import Razorpay from 'razorpay';
import Stripe from 'stripe';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { query, withTransaction } from '../config/database';
import { AppError } from '../utils/errors';
import { enrollmentService } from './enrollment.service';
import { sendEmail, EmailTemplates } from './email.service';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export class PaymentService {
  // ─── Create Order ──────────────────────────────────────────────────────────
  async createOrder(studentId: string, data: {
    course_ids: string[]; coupon_code?: string; gateway: 'razorpay' | 'stripe';
  }) {
    const { course_ids, coupon_code, gateway } = data;

    // Fetch courses
    const { rows: courses } = await query(
      `SELECT id, title, price, is_free FROM courses
       WHERE id = ANY($1) AND status = 'published'`,
      [course_ids]
    );
    if (courses.length !== course_ids.length) throw AppError.badRequest('One or more courses not found');

    // Check already purchased
    for (const course of courses) {
      const { rows: existing } = await query(
        `SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id
         WHERE oi.course_id = $1 AND o.student_id = $2 AND o.payment_status = 'completed'`,
        [course.id, studentId]
      );
      if (existing.length) throw AppError.conflict(`Already purchased: ${course.title}`);
    }

    let subtotal = courses.reduce((sum, c) => sum + parseFloat(c.price), 0);
    let discount = 0;
    let couponId = null;

    // Apply coupon
    if (coupon_code) {
      const { rows: coupons } = await query(
        `SELECT * FROM coupons
         WHERE code = UPPER($1) AND is_active = true
           AND (valid_until IS NULL OR valid_until > NOW())
           AND (max_uses IS NULL OR used_count < max_uses)`,
        [coupon_code]
      );
      if (!coupons.length) throw AppError.badRequest('Invalid or expired coupon');
      const coupon = coupons[0];
      if (subtotal < parseFloat(coupon.min_order_amount)) {
        throw AppError.badRequest(`Minimum order amount is ₹${coupon.min_order_amount}`);
      }
      discount = coupon.discount_type === 'percent'
        ? Math.min(subtotal * (parseFloat(coupon.discount_value) / 100), parseFloat(coupon.max_discount || '999999'))
        : parseFloat(coupon.discount_value);
      couponId = coupon.id;
    }

    const taxPercent = 18; // GST
    const taxable = subtotal - discount;
    const tax = parseFloat((taxable * taxPercent / 100).toFixed(2));
    const total = parseFloat((taxable + tax).toFixed(2));

    const orderId = uuidv4();

    // Create gateway order
    let gatewayOrderId: string;
    if (gateway === 'razorpay') {
      const rzOrder = await razorpay.orders.create({
        amount: Math.round(total * 100), // paise
        currency: 'INR',
        receipt: orderId,
      });
      gatewayOrderId = rzOrder.id;
    } else {
      const piIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: 'inr',
        metadata: { order_id: orderId },
      });
      gatewayOrderId = piIntent.client_secret!;
    }

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO orders (id, student_id, coupon_id, subtotal, discount_amount, tax_amount,
          total_amount, payment_status, payment_method, gateway, gateway_order_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,$9,$10)`,
        [orderId, studentId, couponId, subtotal, discount, tax, total,
         gateway === 'razorpay' ? 'card' : 'card', gateway, gatewayOrderId]
      );
      for (const course of courses) {
        await client.query(
          `INSERT INTO order_items (id, order_id, course_id, price)
           VALUES ($1,$2,$3,$4)`,
          [uuidv4(), orderId, course.id, course.price]
        );
      }
      if (couponId) {
        await client.query(
          `UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`, [couponId]
        );
      }
    });

    return {
      order_id: orderId,
      gateway_order_id: gatewayOrderId,
      amount: total,
      currency: 'INR',
      gateway,
      razorpay_key: gateway === 'razorpay' ? process.env.RAZORPAY_KEY_ID : undefined,
    };
  }

  // ─── Verify Payment ────────────────────────────────────────────────────────
  async verifyPayment(data: {
    order_id: string; payment_id: string; signature: string; gateway: string;
  }) {
    const { order_id, payment_id, signature, gateway } = data;

    const { rows: orders } = await query(
      `SELECT * FROM orders WHERE id = $1 AND payment_status = 'pending'`, [order_id]
    );
    if (!orders.length) throw AppError.notFound('Order');
    const order = orders[0];

    // Signature verification
    if (gateway === 'razorpay') {
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${order.gateway_order_id}|${payment_id}`)
        .digest('hex');
      if (expected !== signature) throw AppError.badRequest('Payment signature invalid');
    }

    await this.fulfillOrder(order, payment_id);
    return { message: 'Payment verified and enrollment activated' };
  }

  // ─── Razorpay Webhook ──────────────────────────────────────────────────────
  async handleRazorpayWebhook(body: string, signature: string) {
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');
    if (expected !== signature) throw AppError.unauthorized('Invalid webhook signature');

    const event = JSON.parse(body);
    if (event.event === 'payment.captured') {
      const gatewayOrderId = event.payload.payment.entity.order_id;
      const { rows: orders } = await query(
        `SELECT * FROM orders WHERE gateway_order_id = $1 AND payment_status = 'pending'`,
        [gatewayOrderId]
      );
      if (orders.length) await this.fulfillOrder(orders[0], event.payload.payment.entity.id);
    }
  }

  // ─── Fulfill Order (shared) ────────────────────────────────────────────────
  private async fulfillOrder(order: any, paymentId: string) {
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE orders SET payment_status = 'completed', gateway_payment_id = $1, updated_at = NOW()
         WHERE id = $2`,
        [paymentId, order.id]
      );
      await client.query(
        `INSERT INTO payment_transactions (id, order_id, amount, currency, status, gateway, gateway_txn_id)
         VALUES ($1,$2,$3,'INR','completed',$4,$5)`,
        [uuidv4(), order.id, order.total_amount, order.gateway, paymentId]
      );
    });

    // Enroll in all courses in order
    const { rows: items } = await query(
      `SELECT oi.course_id, c.title FROM order_items oi JOIN courses c ON c.id = oi.course_id
       WHERE oi.order_id = $1`,
      [order.id]
    );
    for (const item of items) {
      try { await enrollmentService.enroll(order.student_id, item.course_id); } catch {}
    }

    // Send payment success email
    const { rows: users } = await query(
      `SELECT email, first_name FROM users WHERE id = $1`, [order.student_id]
    );
    if (users.length) {
      const tmpl = EmailTemplates.paymentSuccess(
        users[0].first_name,
        order.total_amount,
        items.map((i: any) => i.title)
      );
      await sendEmail({ to: users[0].email, ...tmpl });
    }
  }

  // ─── Get Order History ────────────────────────────────────────────────────
  async getOrders(studentId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { rows } = await query(
      `SELECT o.id, o.total_amount, o.discount_amount, o.tax_amount, o.payment_status,
              o.gateway, o.created_at,
              JSON_AGG(JSON_BUILD_OBJECT('course_id', oi.course_id, 'title', c.title, 'price', oi.price)) AS items
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN courses c ON c.id = oi.course_id
       WHERE o.student_id = $1
       GROUP BY o.id ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [studentId, limit, offset]
    );
    const { rows: countRows } = await query(
      `SELECT COUNT(*) FROM orders WHERE student_id = $1`, [studentId]
    );
    return { orders: rows, total: parseInt(countRows[0].count), page, limit };
  }

  // ─── Refund ───────────────────────────────────────────────────────────────
  async requestRefund(orderId: string, data: { amount: number; reason: string }, adminId: string) {
    const { rows: orders } = await query(
      `SELECT * FROM orders WHERE id = $1 AND payment_status = 'completed'`, [orderId]
    );
    if (!orders.length) throw AppError.notFound('Order');
    const order = orders[0];
    if (data.amount > order.total_amount) throw AppError.badRequest('Refund amount exceeds order total');

    const refundId = uuidv4();
    await query(
      `INSERT INTO refunds (id, order_id, amount, reason, status, processed_by)
       VALUES ($1,$2,$3,$4,'pending',$5)`,
      [refundId, orderId, data.amount, data.reason, adminId]
    );

    if (order.gateway === 'razorpay') {
      await razorpay.payments.refund(order.gateway_payment_id, {
        amount: Math.round(data.amount * 100),
        notes: { reason: data.reason },
      });
    } else {
      await stripe.refunds.create({
        payment_intent: order.gateway_payment_id,
        amount: Math.round(data.amount * 100),
      });
    }

    await query(
      `UPDATE refunds SET status = 'processed', processed_at = NOW() WHERE id = $1`, [refundId]
    );
    return { refund_id: refundId, message: 'Refund processed' };
  }

  // ─── Admin: Revenue Stats ──────────────────────────────────────────────────
  async getRevenueStats() {
    const { rows } = await query(
      `SELECT DATE_TRUNC('month', created_at) AS month,
              COUNT(*) AS orders,
              SUM(total_amount) FILTER (WHERE payment_status = 'completed') AS revenue,
              COUNT(DISTINCT student_id) AS unique_buyers
       FROM orders GROUP BY 1 ORDER BY 1 DESC LIMIT 12`
    );
    return rows;
  }
}

export const paymentService = new PaymentService();
