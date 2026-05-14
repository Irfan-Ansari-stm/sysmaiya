import { Router, Request, Response } from 'express';
import { authenticate, authorize, requirePermission, optionalAuth } from '../middleware/auth.middleware';
import { authLimiter, paymentLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { authController } from '../controllers/auth.controller';
import { userController } from '../controllers/user.controller';
import { courseController } from '../controllers/course.controller';
import { sendSuccess, sendCreated, sendPaginated, paginate } from '../utils/response';
import { enrollmentService } from '../services/enrollment.service';
import { paymentService } from '../services/payment.service';
import { blogService } from '../services/blog.service';
import { careerService } from '../services/career.service';
import { AuthRequest } from '../types';
import * as schemas from '../validators/schemas';
import { query } from '../config/database';
import { AppError } from '../utils/errors';

const router = Router();

// ─── Health ────────────────────────────────────────────────────────────────────
router.get('/health', async (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES  /api/v1/auth
// ══════════════════════════════════════════════════════════════════════════════
const authRouter = Router();

authRouter.post('/register',
  authLimiter,
  validate(schemas.registerSchema),
  authController.register
);

authRouter.get('/verify-email', authController.verifyEmail);

authRouter.post('/login',
  authLimiter,
  validate(schemas.loginSchema),
  authController.login
);

authRouter.post('/refresh', authController.refresh);

authRouter.post('/logout',
  authenticate,
  authController.logout
);

authRouter.post('/forgot-password',
  authLimiter,
  validate(schemas.forgotPasswordSchema),
  authController.forgotPassword
);

authRouter.post('/reset-password',
  validate(schemas.resetPasswordSchema),
  authController.resetPassword
);

authRouter.post('/change-password',
  authenticate,
  validate(schemas.changePasswordSchema),
  authController.changePassword
);

authRouter.get('/me', authenticate, authController.me);

// ══════════════════════════════════════════════════════════════════════════════
// USER ROUTES  /api/v1/users
// ══════════════════════════════════════════════════════════════════════════════
const userRouter = Router();
userRouter.use(authenticate);

// Own profile
userRouter.get('/me', userController.getProfile);
userRouter.patch('/me', validate(schemas.updateProfileSchema, 'body'), userController.updateProfile);
userRouter.get('/me/dashboard', userController.getStudentDashboard);
userRouter.get('/me/sessions', userController.getSessions);
userRouter.delete('/me/sessions/:sessionId', userController.revokeSession);

// Admin user management
userRouter.get('/',
  requirePermission('users', 'read'),
  userController.listUsers
);
userRouter.get('/stats',
  requirePermission('users', 'read'),
  userController.getAdminStats
);
userRouter.get('/:id',
  requirePermission('users', 'read'),
  userController.getUserById
);
userRouter.patch('/:id/status',
  requirePermission('users', 'update'),
  auditLog('user.status_change', 'user'),
  userController.updateUserStatus
);
userRouter.post('/:id/roles',
  authorize('super_admin'),
  validate(schemas.assignRoleSchema),
  auditLog('user.role_assign', 'user'),
  userController.assignRole
);
userRouter.delete('/:id/roles/:role',
  authorize('super_admin'),
  auditLog('user.role_revoke', 'user'),
  userController.revokeRole
);

// ══════════════════════════════════════════════════════════════════════════════
// COURSE ROUTES  /api/v1/courses
// ══════════════════════════════════════════════════════════════════════════════
const courseRouter = Router();

// Public
courseRouter.get('/', optionalAuth, courseController.listCourses);
courseRouter.get('/featured', courseController.getFeatured);
courseRouter.get('/categories', courseController.getCategories);
courseRouter.get('/:slug', optionalAuth, courseController.getCourse);
courseRouter.get('/:id/lessons/:lessonId', optionalAuth, courseController.getLesson);

// Instructor
courseRouter.post('/',
  authenticate,
  authorize('instructor', 'admin', 'super_admin'),
  validate(schemas.createCourseSchema),
  auditLog('course.create', 'course'),
  courseController.createCourse
);
courseRouter.get('/instructor/my-courses',
  authenticate,
  authorize('instructor', 'admin', 'super_admin'),
  courseController.getMyInstructorCourses
);
courseRouter.patch('/:id',
  authenticate,
  authorize('instructor', 'admin', 'super_admin'),
  validate(schemas.updateCourseSchema),
  auditLog('course.update', 'course'),
  courseController.updateCourse
);
courseRouter.delete('/:id',
  authenticate,
  authorize('admin', 'super_admin'),
  auditLog('course.delete', 'course'),
  courseController.deleteCourse
);

// Sections & Lessons
courseRouter.get('/:id/sections', authenticate, courseController.getMySections);
courseRouter.post('/:id/sections',
  authenticate,
  authorize('instructor', 'admin', 'super_admin'),
  validate(schemas.createSectionSchema),
  courseController.createSection
);
courseRouter.post('/:id/lessons',
  authenticate,
  authorize('instructor', 'admin', 'super_admin'),
  validate(schemas.createLessonSchema),
  courseController.createLesson
);

// Publish workflow (admin)
courseRouter.post('/:id/publish',
  authenticate,
  requirePermission('courses', 'publish'),
  auditLog('course.publish', 'course'),
  courseController.publishCourse
);
courseRouter.post('/:id/unpublish',
  authenticate,
  requirePermission('courses', 'publish'),
  auditLog('course.unpublish', 'course'),
  courseController.unpublishCourse
);

// ══════════════════════════════════════════════════════════════════════════════
// REVIEW ROUTES  /api/v1/courses/:courseSlug/reviews
// ══════════════════════════════════════════════════════════════════════════════
courseRouter.get('/:courseSlug/reviews', async (req: AuthRequest, res: Response) => {
  const { rows } = await query(
    `SELECT cr.id, cr.rating, cr.review_text, cr.created_at,
            u.first_name || ' ' || u.last_name AS student_name, u.avatar_url
     FROM course_reviews cr
     JOIN users u ON u.id = cr.student_id
     JOIN courses c ON c.id = cr.course_id
     WHERE c.slug = $1 AND cr.is_approved = true
     ORDER BY cr.created_at DESC`,
    [req.params.courseSlug]
  );
  sendSuccess(res, { reviews: rows });
});

courseRouter.post('/:courseId/reviews',
  authenticate,
  validate(schemas.createReviewSchema),
  async (req: AuthRequest, res: Response) => {
    const { courseId } = req.params;
    const { rating, review_text } = req.body;
    const { rows: enr } = await query(
      `SELECT id FROM enrollments WHERE student_id=$1 AND course_id=$2 AND status='completed'`,
      [req.user!.id, courseId]
    );
    if (!enr.length) throw AppError.forbidden('Complete this course to leave a review');

    await query(
      `INSERT INTO course_reviews (id, course_id, student_id, rating, review_text, is_approved)
       VALUES (gen_random_uuid(),$1,$2,$3,$4,true)
       ON CONFLICT (course_id, student_id) DO UPDATE SET rating=EXCLUDED.rating, review_text=EXCLUDED.review_text`,
      [courseId, req.user!.id, rating, review_text || null]
    );
    sendCreated(res, { message: 'Review submitted' });
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// ENROLLMENT ROUTES  /api/v1/enrollments
// ══════════════════════════════════════════════════════════════════════════════
const enrollRouter = Router();
enrollRouter.use(authenticate);

enrollRouter.post('/',
  validate(schemas.enrollSchema),
  auditLog('enrollment.create', 'enrollment'),
  async (req: AuthRequest, res: Response) => {
    const result = await enrollmentService.enroll(req.user!.id, req.body.course_id);
    sendCreated(res, result);
  }
);

enrollRouter.get('/', async (req: AuthRequest, res: Response) => {
  const status = (req.query.status as string) || 'active';
  const enrollments = await enrollmentService.getMyEnrollments(req.user!.id, status);
  sendSuccess(res, { enrollments });
});

enrollRouter.patch('/:id/drop', async (req: AuthRequest, res: Response) => {
  const result = await enrollmentService.dropEnrollment(req.user!.id, req.params.id);
  sendSuccess(res, result);
});

enrollRouter.post('/:id/lessons/:lessonId/progress',
  validate(schemas.progressSchema),
  async (req: AuthRequest, res: Response) => {
    const result = await enrollmentService.updateProgress(
      req.user!.id, req.params.id, req.params.lessonId, req.body
    );
    sendSuccess(res, result);
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// CERTIFICATE ROUTES  /api/v1/certificates
// ══════════════════════════════════════════════════════════════════════════════
const certRouter = Router();

certRouter.get('/verify/:certificateNo', async (req: Request, res: Response) => {
  const result = await enrollmentService.verifyCertificate(req.params.certificateNo);
  sendSuccess(res, result);
});

certRouter.get('/my',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const certs = await enrollmentService.getMyCertificates(req.user!.id);
    sendSuccess(res, { certificates: certs });
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// PAYMENT ROUTES  /api/v1/payments
// ══════════════════════════════════════════════════════════════════════════════
const paymentRouter = Router();

paymentRouter.post('/orders',
  authenticate,
  paymentLimiter,
  validate(schemas.createOrderSchema),
  async (req: AuthRequest, res: Response) => {
    const result = await paymentService.createOrder(req.user!.id, req.body);
    sendCreated(res, result);
  }
);

paymentRouter.post('/verify',
  authenticate,
  validate(schemas.verifyPaymentSchema),
  async (req: AuthRequest, res: Response) => {
    const result = await paymentService.verifyPayment(req.body);
    sendSuccess(res, result);
  }
);

paymentRouter.get('/orders',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = paginate(req.query);
    const result = await paymentService.getOrders(req.user!.id, page, limit);
    sendPaginated(res, result.orders, result.total, result.page, result.limit);
  }
);

// Razorpay webhook (raw body needed)
paymentRouter.post('/webhook/razorpay', async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  await paymentService.handleRazorpayWebhook(JSON.stringify(req.body), signature);
  res.json({ status: 'ok' });
});

// Admin refund
paymentRouter.post('/orders/:orderId/refund',
  authenticate,
  authorize('admin', 'super_admin'),
  validate(schemas.refundSchema),
  auditLog('payment.refund', 'order'),
  async (req: AuthRequest, res: Response) => {
    const result = await paymentService.requestRefund(req.params.orderId, req.body, req.user!.id);
    sendSuccess(res, result);
  }
);

paymentRouter.get('/revenue-stats',
  authenticate,
  requirePermission('payments', 'read'),
  async (_req: AuthRequest, res: Response) => {
    const stats = await paymentService.getRevenueStats();
    sendSuccess(res, { stats });
  }
);

// Coupons
paymentRouter.get('/coupons',
  authenticate,
  requirePermission('payments', 'manage_coupons'),
  async (_req, res) => {
    const { rows } = await query(`SELECT * FROM coupons ORDER BY created_at DESC`);
    sendSuccess(res, { coupons: rows });
  }
);

paymentRouter.post('/coupons',
  authenticate,
  requirePermission('payments', 'manage_coupons'),
  validate(schemas.createCouponSchema),
  async (req: AuthRequest, res) => {
    const d = req.body;
    await query(
      `INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_amount,
        max_discount, max_uses, valid_from, valid_until, created_by)
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [d.code, d.description||null, d.discount_type, d.discount_value, d.min_order_amount,
       d.max_discount||null, d.max_uses||null, d.valid_from||null, d.valid_until||null, req.user!.id]
    );
    sendCreated(res, { message: 'Coupon created' });
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// BLOG ROUTES  /api/v1/blog
// ══════════════════════════════════════════════════════════════════════════════
const blogRouter = Router();

blogRouter.get('/', async (req: Request, res: Response) => {
  const { page, limit } = paginate(req.query);
  const result = await blogService.listPosts({
    category: req.query.category as string,
    tag: req.query.tag as string,
    search: req.query.search as string,
    page, limit,
  });
  sendPaginated(res, result.posts, result.total, result.page, result.limit);
});

blogRouter.get('/tags', async (_req, res) => {
  const tags = await blogService.getTags();
  sendSuccess(res, { tags });
});

blogRouter.get('/:slug', async (req: Request, res: Response) => {
  const post = await blogService.getPost(req.params.slug);
  sendSuccess(res, { post });
});

blogRouter.get('/:postId/comments', async (req: Request, res: Response) => {
  const comments = await blogService.getComments(req.params.postId);
  sendSuccess(res, { comments });
});

blogRouter.post('/',
  authenticate,
  requirePermission('blog', 'create'),
  validate(schemas.createBlogSchema),
  auditLog('blog.create', 'blog_post'),
  async (req: AuthRequest, res: Response) => {
    const result = await blogService.createPost(req.user!.id, req.body);
    sendCreated(res, result);
  }
);

blogRouter.patch('/:id',
  authenticate,
  requirePermission('blog', 'update'),
  auditLog('blog.update', 'blog_post'),
  async (req: AuthRequest, res: Response) => {
    const result = await blogService.updatePost(req.params.id, req.user!.id, req.user!.roles, req.body);
    sendSuccess(res, result);
  }
);

blogRouter.delete('/:id',
  authenticate,
  requirePermission('blog', 'delete'),
  auditLog('blog.delete', 'blog_post'),
  async (req: AuthRequest, res: Response) => {
    const result = await blogService.deletePost(req.params.id);
    sendSuccess(res, result);
  }
);

blogRouter.post('/:postId/comments',
  authenticate,
  validate(schemas.createCommentSchema),
  async (req: AuthRequest, res: Response) => {
    const result = await blogService.addComment(req.params.postId, req.user!.id, req.body);
    sendCreated(res, result);
  }
);

blogRouter.patch('/comments/:commentId/moderate',
  authenticate,
  requirePermission('blog', 'moderate_comments'),
  async (req: AuthRequest, res: Response) => {
    const result = await blogService.moderateComment(req.params.commentId, req.body.approved);
    sendSuccess(res, result);
  }
);

blogRouter.post('/tags',
  authenticate,
  requirePermission('blog', 'create'),
  async (req: AuthRequest, res: Response) => {
    const result = await blogService.createTag(req.body.name);
    sendCreated(res, result);
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// CAREER ROUTES  /api/v1/careers
// ══════════════════════════════════════════════════════════════════════════════
const careerRouter = Router();

careerRouter.get('/jobs', async (req: Request, res: Response) => {
  const { page, limit } = paginate(req.query);
  const result = await careerService.listJobs({
    department: req.query.department as string,
    type: req.query.type as string,
    is_remote: req.query.is_remote === 'true' ? true : undefined,
    page, limit,
  });
  sendPaginated(res, result.jobs, result.total, result.page, result.limit);
});

careerRouter.get('/departments', async (_req, res) => {
  const departments = await careerService.getDepartments();
  sendSuccess(res, { departments });
});

careerRouter.get('/jobs/:slug', async (req: Request, res: Response) => {
  const job = await careerService.getJob(req.params.slug);
  sendSuccess(res, { job });
});

careerRouter.post('/jobs',
  authenticate,
  requirePermission('careers', 'create'),
  validate(schemas.createJobSchema),
  auditLog('job.create', 'job_posting'),
  async (req: AuthRequest, res: Response) => {
    const result = await careerService.createJob(req.user!.id, req.body);
    sendCreated(res, result);
  }
);

careerRouter.patch('/jobs/:id',
  authenticate,
  requirePermission('careers', 'update'),
  auditLog('job.update', 'job_posting'),
  async (req: AuthRequest, res: Response) => {
    const result = await careerService.updateJob(req.params.id, req.body);
    sendSuccess(res, result);
  }
);

careerRouter.delete('/jobs/:id',
  authenticate,
  requirePermission('careers', 'delete'),
  auditLog('job.delete', 'job_posting'),
  async (req: AuthRequest, res: Response) => {
    const result = await careerService.deleteJob(req.params.id);
    sendSuccess(res, result);
  }
);

careerRouter.post('/jobs/:id/apply',
  authenticate,
  validate(schemas.applyJobSchema),
  async (req: AuthRequest, res: Response) => {
    const result = await careerService.applyJob(req.params.id, req.user!.id, null, req.body);
    sendCreated(res, result);
  }
);

careerRouter.get('/applications',
  authenticate,
  requirePermission('careers', 'read'),
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = paginate(req.query);
    const result = await careerService.listApplications({
      job_id: req.query.job_id as string,
      status: req.query.status as string,
      page, limit,
    });
    sendPaginated(res, result.applications, result.total, result.page, result.limit);
  }
);

careerRouter.patch('/applications/:id/status',
  authenticate,
  requirePermission('careers', 'manage_applications'),
  async (req: AuthRequest, res: Response) => {
    const result = await careerService.updateApplicationStatus(
      req.params.id, req.body.status, req.user!.id
    );
    sendSuccess(res, result);
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// WEBSITE / CMS ROUTES  /api/v1/website
// ══════════════════════════════════════════════════════════════════════════════
const websiteRouter = Router();

websiteRouter.get('/settings', async (_req, res) => {
  const { rows } = await query(
    `SELECT key, value, type, group_name, label FROM site_settings ORDER BY group_name, key`
  );
  sendSuccess(res, { settings: rows });
});

websiteRouter.patch('/settings/:key',
  authenticate,
  requirePermission('website', 'update'),
  validate(schemas.updateSettingSchema),
  async (req: AuthRequest, res) => {
    await query(
      `UPDATE site_settings SET value=$1, updated_by=$2, updated_at=NOW() WHERE key=$3`,
      [req.body.value, req.user!.id, req.params.key]
    );
    sendSuccess(res, { message: 'Setting updated' });
  }
);

websiteRouter.get('/faqs', async (_req, res) => {
  const { rows } = await query(`SELECT * FROM faqs WHERE is_active=true ORDER BY sort_order`);
  sendSuccess(res, { faqs: rows });
});

websiteRouter.post('/faqs',
  authenticate,
  requirePermission('website', 'update'),
  async (req: AuthRequest, res) => {
    const { question, answer, category, sort_order } = req.body;
    await query(
      `INSERT INTO faqs (question, answer, category, sort_order, created_by) VALUES ($1,$2,$3,$4,$5)`,
      [question, answer, category || null, sort_order || 0, req.user!.id]
    );
    sendCreated(res, { message: 'FAQ created' });
  }
);

websiteRouter.get('/testimonials', async (_req, res) => {
  const { rows } = await query(
    `SELECT t.*, mf.cdn_url AS avatar_url FROM testimonials t
     LEFT JOIN media_files mf ON mf.id=t.avatar_id
     WHERE t.is_approved=true AND t.is_featured=true ORDER BY t.sort_order`
  );
  sendSuccess(res, { testimonials: rows });
});

websiteRouter.get('/banners', async (req, res) => {
  const position = req.query.position || 'hero';
  const { rows } = await query(
    `SELECT b.*, mf.cdn_url AS image_url FROM banners b
     LEFT JOIN media_files mf ON mf.id=b.image_id
     WHERE b.is_active=true AND b.position=$1
       AND (b.starts_at IS NULL OR b.starts_at <= NOW())
       AND (b.ends_at IS NULL OR b.ends_at >= NOW())
     ORDER BY b.sort_order`,
    [position]
  );
  sendSuccess(res, { banners: rows });
});

// Newsletter
websiteRouter.post('/newsletter/subscribe',
  validate(schemas.subscribeSchema),
  async (req, res) => {
    const { email, name } = req.body;
    await query(
      `INSERT INTO newsletter_subscribers (id, email, name)
       VALUES (gen_random_uuid(),$1,$2) ON CONFLICT (email) DO UPDATE SET is_active=true`,
      [email, name || null]
    );
    sendCreated(res, { message: 'Subscribed successfully' });
  }
);

// Contact
websiteRouter.post('/contact',
  validate(schemas.contactSchema),
  async (req, res) => {
    const { name, email, subject, message } = req.body;
    await query(
      `INSERT INTO contact_messages (id, name, email, subject, message)
       VALUES (gen_random_uuid(),$1,$2,$3,$4)`,
      [name, email, subject || null, message]
    );
    sendCreated(res, { message: 'Message sent. We will get back to you shortly.' });
  }
);

websiteRouter.get('/contact',
  authenticate,
  requirePermission('website', 'read'),
  async (_req, res) => {
    const { rows } = await query(`SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100`);
    sendSuccess(res, { messages: rows });
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES  /api/v1/admin
// ══════════════════════════════════════════════════════════════════════════════
const adminRouter = Router();
adminRouter.use(authenticate);
adminRouter.use(authorize('admin', 'super_admin'));

adminRouter.get('/stats', userController.getAdminStats);

adminRouter.get('/activity-logs', async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(req.query);
  const offset = (page - 1) * limit;
  const { rows } = await query(
    `SELECT al.*, u.email AS user_email
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const { rows: cnt } = await query(`SELECT COUNT(*) FROM activity_logs`);
  sendPaginated(res, rows, parseInt(cnt[0].count), page, limit);
});

adminRouter.get('/enrollments', async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(req.query);
  const offset = (page - 1) * limit;
  const { rows } = await query(
    `SELECT e.id, e.status, e.progress_pct, e.enrolled_at,
            u.first_name || ' ' || u.last_name AS student_name, u.email,
            c.title AS course_title
     FROM enrollments e
     JOIN users u ON u.id = e.student_id
     JOIN courses c ON c.id = e.course_id
     ORDER BY e.enrolled_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const { rows: cnt } = await query(`SELECT COUNT(*) FROM enrollments`);
  sendPaginated(res, rows, parseInt(cnt[0].count), page, limit);
});

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS  /api/v1/notifications
// ══════════════════════════════════════════════════════════════════════════════
const notifRouter = Router();
notifRouter.use(authenticate);

notifRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { rows } = await query(
    `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
    [req.user!.id]
  );
  sendSuccess(res, { notifications: rows });
});

notifRouter.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  await query(
    `UPDATE notifications SET is_read=true, read_at=NOW() WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.user!.id]
  );
  sendSuccess(res, { message: 'Marked as read' });
});

notifRouter.patch('/read-all', async (req: AuthRequest, res: Response) => {
  await query(
    `UPDATE notifications SET is_read=true, read_at=NOW() WHERE user_id=$1 AND is_read=false`,
    [req.user!.id]
  );
  sendSuccess(res, { message: 'All marked as read' });
});

// ══════════════════════════════════════════════════════════════════════════════
// INSTRUCTORS  /api/v1/instructors
// ══════════════════════════════════════════════════════════════════════════════
const instructorRouter = Router();

instructorRouter.get('/', async (_req, res) => {
  const { rows } = await query(
    `SELECT i.id, i.headline, i.rating_avg, i.total_students, i.total_courses, i.is_featured,
            u.first_name || ' ' || u.last_name AS name,
            u.avatar_url, u.bio
     FROM instructors i JOIN users u ON u.id = i.user_id
     WHERE i.verified = true
     ORDER BY i.is_featured DESC, i.rating_avg DESC`
  );
  sendSuccess(res, { instructors: rows });
});

instructorRouter.get('/:id', async (req, res) => {
  const { rows } = await query(
    `SELECT i.*, u.first_name || ' ' || u.last_name AS name, u.avatar_url, u.bio, u.email
     FROM instructors i JOIN users u ON u.id = i.user_id WHERE i.id=$1`,
    [req.params.id]
  );
  if (!rows.length) throw AppError.notFound('Instructor');

  const { rows: courses } = await query(
    `SELECT id, title, slug, rating_avg, total_students, price, is_free
     FROM courses WHERE instructor_id=$1 AND status='published'
     ORDER BY published_at DESC LIMIT 10`,
    [req.params.id]
  );
  sendSuccess(res, { instructor: rows[0], courses });
});

// ══════════════════════════════════════════════════════════════════════════════
// MOUNT ALL ROUTERS
// ══════════════════════════════════════════════════════════════════════════════
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/courses', courseRouter);
router.use('/enrollments', enrollRouter);
router.use('/certificates', certRouter);
router.use('/payments', paymentRouter);
router.use('/blog', blogRouter);
router.use('/careers', careerRouter);
router.use('/website', websiteRouter);
router.use('/admin', adminRouter);
router.use('/notifications', notifRouter);
router.use('/instructors', instructorRouter);

export default router;
