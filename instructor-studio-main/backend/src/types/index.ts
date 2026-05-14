import { Request } from 'express';

export type RoleType =
  | 'super_admin'
  | 'admin'
  | 'blog_manager'
  | 'hr_manager'
  | 'website_manager'
  | 'instructor'
  | 'student';

export interface AuthUser {
  id: string;
  email: string;
  roles: RoleType[];
}

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      user?: AuthUser;
    }
  }
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  status: 'active' | 'inactive' | 'banned' | 'pending_verification';
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Course {
  id: string;
  instructor_id: string;
  category_id: number | null;
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
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
