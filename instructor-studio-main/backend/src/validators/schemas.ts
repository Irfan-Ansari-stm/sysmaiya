import { z } from 'zod';

// ─── Auth Schemas ──────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must have uppercase')
    .regex(/[a-z]/, 'Must have lowercase')
    .regex(/[0-9]/, 'Must have number')
    .regex(/[^A-Za-z0-9]/, 'Must have special character'),
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember_me: z.boolean().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

// ─── User Schemas ──────────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  first_name: z.string().min(1).max(80).optional(),
  last_name: z.string().min(1).max(80).optional(),
  bio: z.string().max(1000).optional(),
  phone: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  country: z.string().max(60).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  timezone: z.string().optional(),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional().nullable(),
});

export const assignRoleSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'blog_manager', 'hr_manager', 'website_manager', 'instructor', 'student']),
});

// ─── Course Schemas ────────────────────────────────────────────────────────────
export const createCourseSchema = z.object({
  title: z.string().min(5).max(255),
  category_id: z.number().int().positive().optional(),
  subtitle: z.string().max(500).optional(),
  description: z.string().optional(),
  what_you_learn: z.array(z.string()).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels']).default('all_levels'),
  language: z.string().default('English'),
  is_free: z.boolean().default(false),
  price: z.number().min(0).default(0),
  discount_price: z.number().min(0).optional().nullable(),
  certificate_enabled: z.boolean().default(true),
});

export const updateCourseSchema = createCourseSchema.partial();

export const courseQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels']).optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  is_free: z.coerce.boolean().optional(),
  sort: z.enum(['newest', 'popular', 'highest_rated', 'price_asc', 'price_desc']).optional().default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Lesson / Section Schemas ─────────────────────────────────────────────────
export const createSectionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  sort_order: z.number().int().default(0),
});

export const createLessonSchema = z.object({
  section_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  type: z.enum(['video', 'text', 'quiz', 'assignment', 'live_session']).default('video'),
  description: z.string().optional(),
  content: z.string().optional(),
  duration_sec: z.number().int().min(0).default(0),
  sort_order: z.number().int().default(0),
  is_preview: z.boolean().default(false),
});

// ─── Enrollment ────────────────────────────────────────────────────────────────
export const enrollSchema = z.object({
  course_id: z.string().uuid(),
});

export const progressSchema = z.object({
  completed: z.boolean(),
  watch_time_sec: z.number().int().min(0).optional(),
  last_position_sec: z.number().int().min(0).optional(),
});

// ─── Order / Payment ──────────────────────────────────────────────────────────
export const createOrderSchema = z.object({
  course_ids: z.array(z.string().uuid()).min(1),
  coupon_code: z.string().optional(),
  gateway: z.enum(['razorpay', 'stripe']),
});

export const refundSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(5).max(500),
});

export const verifyPaymentSchema = z.object({
  order_id: z.string(),
  payment_id: z.string(),
  signature: z.string(),
  gateway: z.enum(['razorpay', 'stripe']),
});

// ─── Blog Schemas ──────────────────────────────────────────────────────────────
export const createBlogSchema = z.object({
  title: z.string().min(5).max(400),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(50),
  category: z.enum(['Tech', 'Design', 'Marketing', 'Business', 'Career', 'Tutorial', 'News']),
  tag_ids: z.array(z.number()).optional().default([]),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  scheduled_at: z.string().datetime().optional(),
  meta_title: z.string().max(255).optional(),
  meta_description: z.string().max(500).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parent_id: z.string().uuid().optional(),
});

// ─── Review Schema ────────────────────────────────────────────────────────────
export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review_text: z.string().max(2000).optional(),
});

// ─── Job / Career Schemas ──────────────────────────────────────────────────────
export const createJobSchema = z.object({
  department_id: z.number().int().positive().optional(),
  title: z.string().min(5).max(255),
  description: z.string().min(50),
  responsibilities: z.array(z.string()).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
  benefits: z.array(z.string()).optional().default([]),
  location: z.string().max(150).optional(),
  is_remote: z.boolean().default(false),
  job_type: z.enum(['full_time', 'part_time', 'contract', 'internship']),
  experience_min: z.number().int().min(0).default(0),
  experience_max: z.number().int().optional(),
  salary_min: z.number().positive().optional(),
  salary_max: z.number().positive().optional(),
  salary_currency: z.string().default('INR'),
  application_deadline: z.string().datetime().optional(),
  total_openings: z.number().int().positive().default(1),
  status: z.enum(['open', 'closed', 'on_hold']).default('open'),
});

export const applyJobSchema = z.object({
  cover_letter: z.string().max(5000).optional(),
  portfolio_url: z.string().url().optional(),
  linkedin_url: z.string().url().optional(),
  expected_salary: z.number().positive().optional(),
  notice_period_days: z.number().int().min(0).optional(),
});

// ─── Site Settings ────────────────────────────────────────────────────────────
export const updateSettingSchema = z.object({
  value: z.string(),
});

// ─── Newsletter ───────────────────────────────────────────────────────────────
export const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

// ─── Contact ──────────────────────────────────────────────────────────────────
export const contactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  subject: z.string().max(255).optional(),
  message: z.string().min(10).max(5000),
});

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export const submitQuizSchema = z.object({
  answers: z.array(z.object({
    question_id: z.string().uuid(),
    option_id: z.string().uuid().optional(),
    text_answer: z.string().optional(),
  })),
});

// ─── Coupon ───────────────────────────────────────────────────────────────────
export const createCouponSchema = z.object({
  code: z.string().min(3).max(40).toUpperCase(),
  description: z.string().optional(),
  discount_type: z.enum(['percent', 'fixed']),
  discount_value: z.number().positive(),
  min_order_amount: z.number().min(0).default(0),
  max_discount: z.number().positive().optional(),
  max_uses: z.number().int().positive().optional(),
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().optional(),
});
