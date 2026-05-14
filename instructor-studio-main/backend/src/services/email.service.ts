import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      ...opts,
    });
    logger.info('Email sent', { to: opts.to, subject: opts.subject });
  } catch (err: any) {
    logger.error('Email send failed', { error: err.message, to: opts.to });
    // Don't throw — email failure shouldn't break the request
  }
}

export const EmailTemplates = {
  verifyEmail: (name: string, url: string) => ({
    subject: 'Verify your InstructorStudio email',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1A3C5E;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0">InstructorStudio</h1>
        </div>
        <div style="padding:32px;background:#f9fafb">
          <h2 style="color:#1A3C5E">Hi ${name}, verify your email</h2>
          <p>Thanks for registering! Click the button below to verify your email address.</p>
          <a href="${url}" style="display:inline-block;background:#F97316;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
            Verify Email
          </a>
          <p style="color:#6b7280;font-size:14px">Link expires in 24 hours. If you didn't register, ignore this email.</p>
        </div>
      </div>`,
  }),

  passwordReset: (name: string, url: string) => ({
    subject: 'Reset your InstructorStudio password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1A3C5E;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0">InstructorStudio</h1>
        </div>
        <div style="padding:32px;background:#f9fafb">
          <h2 style="color:#1A3C5E">Hi ${name}, reset your password</h2>
          <p>We received a request to reset your password.</p>
          <a href="${url}" style="display:inline-block;background:#F97316;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
            Reset Password
          </a>
          <p style="color:#6b7280;font-size:14px">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
        </div>
      </div>`,
  }),

  enrollmentConfirmation: (name: string, courseTitle: string) => ({
    subject: `You're enrolled: ${courseTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1A3C5E;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0">InstructorStudio</h1>
        </div>
        <div style="padding:32px;background:#f9fafb">
          <h2 style="color:#16A34A">🎉 You're enrolled, ${name}!</h2>
          <p>You've successfully enrolled in <strong>${courseTitle}</strong>.</p>
          <a href="${process.env.FRONTEND_URL}/dashboard/my-courses" style="display:inline-block;background:#F97316;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
            Start Learning
          </a>
        </div>
      </div>`,
  }),

  certificateIssued: (name: string, courseTitle: string, certUrl: string) => ({
    subject: `🏆 Certificate issued: ${courseTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1A3C5E;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0">InstructorStudio</h1>
        </div>
        <div style="padding:32px;background:#f9fafb;text-align:center">
          <div style="font-size:64px">🏆</div>
          <h2 style="color:#1A3C5E">Congratulations ${name}!</h2>
          <p>You've completed <strong>${courseTitle}</strong> and earned your certificate.</p>
          <a href="${certUrl}" style="display:inline-block;background:#F97316;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
            Download Certificate
          </a>
        </div>
      </div>`,
  }),

  paymentSuccess: (name: string, amount: number, courses: string[]) => ({
    subject: 'Payment Successful - InstructorStudio',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1A3C5E;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0">InstructorStudio</h1>
        </div>
        <div style="padding:32px;background:#f9fafb">
          <h2 style="color:#16A34A">✅ Payment Successful</h2>
          <p>Hi ${name}, your payment of <strong>₹${amount}</strong> was successful.</p>
          <p><strong>Enrolled courses:</strong></p>
          <ul>${courses.map(c => `<li>${c}</li>`).join('')}</ul>
          <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;background:#F97316;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
            Go to Dashboard
          </a>
        </div>
      </div>`,
  }),
};
