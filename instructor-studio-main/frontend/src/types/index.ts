export type RoleType =
  | 'super_admin' | 'admin' | 'blog_manager'
  | 'hr_manager' | 'website_manager' | 'instructor' | 'student';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  status: string;
  email_verified: boolean;
  roles: RoleType[];
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  level: string;
  language: string;
  status: string;
  is_free: boolean;
  price: number;
  discount_price: number | null;
  duration_hours: number;
  total_lessons: number;
  total_students: number;
  rating_avg: number;
  total_reviews: number;
  is_featured: boolean;
  thumbnail_url: string | null;
  instructor_name: string;
  instructor_id: string;
  category_name: string | null;
  category_slug: string | null;
  published_at: string | null;
  what_you_learn: string[];
  requirements: string[];
  sections?: CourseSection[];
  enrollment?: Enrollment | null;
}

export interface CourseSection {
  id: string;
  title: string;
  sort_order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'live_session';
  duration_sec: number;
  is_preview: boolean;
  is_published: boolean;
  sort_order: number;
  content?: string;
  video_url?: string;
}

export interface Enrollment {
  id: string;
  course_id: string;
  status: 'active' | 'completed' | 'dropped';
  progress_pct: number;
  enrolled_at: string;
  completed_at: string | null;
  course?: Course;
}

export interface Certificate {
  id: string;
  certificate_no: string;
  issued_at: string;
  pdf_url: string | null;
  status: string;
  course_title: string;
  course_slug: string;
  thumbnail_url: string | null;
}

export interface Order {
  id: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  payment_status: string;
  gateway: string;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  course_id: string;
  title: string;
  price: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  view_count: number;
  read_time_min: number;
  published_at: string | null;
  is_featured: boolean;
  thumbnail_url: string | null;
  author_name: string;
  author_avatar: string | null;
  tags: string[];
}

export interface Job {
  id: string;
  title: string;
  slug: string;
  job_type: string;
  location: string | null;
  is_remote: boolean;
  experience_min: number;
  experience_max: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  application_deadline: string | null;
  total_openings: number;
  published_at: string | null;
  department_name: string | null;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
}

export interface Instructor {
  id: string;
  name: string;
  headline: string | null;
  avatar_url: string | null;
  bio: string | null;
  rating_avg: number;
  total_students: number;
  total_courses: number;
  is_featured: boolean;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export interface DashboardStats {
  active_enrollments: number;
  completed_courses: number;
  certificates_earned: number;
  avg_progress: number;
}

export interface AdminStats {
  users: { total: number; active: number; new_this_month: number };
  courses: { total: number; published: number; drafts: number };
  enrollments: { total: number; active: number; completed: number };
  revenue: { total_revenue: number; this_month: number };
}
