import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AxiosError } from 'axios';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
    ...options,
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.error?.message || error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  blog_manager: 'Blog Manager',
  hr_manager: 'HR Manager',
  website_manager: 'Website Manager',
  instructor: 'Instructor',
  student: 'Student',
};

export const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-700',
  admin: 'bg-purple-100 text-purple-700',
  blog_manager: 'bg-blue-100 text-blue-700',
  hr_manager: 'bg-green-100 text-green-700',
  website_manager: 'bg-yellow-100 text-yellow-700',
  instructor: 'bg-orange-100 text-orange-700',
  student: 'bg-gray-100 text-gray-700',
};

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  banned: 'bg-red-100 text-red-700',
  pending_verification: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-blue-100 text-blue-700',
  archived: 'bg-red-100 text-red-700',
};
