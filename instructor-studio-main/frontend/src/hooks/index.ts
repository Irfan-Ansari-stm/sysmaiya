'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import {
  courseApi, enrollmentApi, certificateApi,
  paymentApi, blogApi, careerApi, websiteApi,
  adminApi, userApi, notificationApi, instructorApi,
} from '../lib/api-services';
import { getErrorMessage } from '../lib/utils';
import toast from 'react-hot-toast';

// ─── Auth ──────────────────────────────────────────────────────────────────────
export function useCurrentUser() {
  const { user, isAuthenticated } = useAuthStore();
  return { user, isAuthenticated };
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export function useStudentDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => userApi.getDashboard().then(r => r.data.data),
    staleTime: 30_000,
  });
}

// ─── Courses ───────────────────────────────────────────────────────────────────
export function useCourses(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => courseApi.list(params).then(r => r.data),
    staleTime: 60_000,
  });
}

export function useFeaturedCourses() {
  return useQuery({
    queryKey: ['courses', 'featured'],
    queryFn: () => courseApi.getFeatured().then(r => r.data.data.courses),
    staleTime: 120_000,
  });
}

export function useCourse(slug: string) {
  return useQuery({
    queryKey: ['course', slug],
    queryFn: () => courseApi.getBySlug(slug).then(r => r.data.data.course),
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => courseApi.getCategories().then(r => r.data.data.categories),
    staleTime: 300_000,
  });
}

export function useInstructorCourses() {
  return useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () => courseApi.getMyCourses().then(r => r.data.data.courses),
  });
}

// ─── Enrollments ───────────────────────────────────────────────────────────────
export function useMyEnrollments(status = 'active') {
  return useQuery({
    queryKey: ['enrollments', status],
    queryFn: () => enrollmentApi.getMyEnrollments(status).then(r => r.data.data.enrollments),
  });
}

export function useEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => enrollmentApi.enroll(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollments'] });
      toast.success('Enrolled successfully!');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId, lessonId, data }: {
      enrollmentId: string; lessonId: string;
      data: { completed: boolean; watch_time_sec?: number; last_position_sec?: number };
    }) => enrollmentApi.updateProgress(enrollmentId, lessonId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollments'] }),
  });
}

// ─── Certificates ──────────────────────────────────────────────────────────────
export function useMyCertificates() {
  return useQuery({
    queryKey: ['certificates'],
    queryFn: () => certificateApi.getMyCertificates().then(r => r.data.data.certificates),
  });
}

export function useVerifyCertificate(certNo: string) {
  return useQuery({
    queryKey: ['certificate-verify', certNo],
    queryFn: () => certificateApi.verify(certNo).then(r => r.data.data),
    enabled: !!certNo,
  });
}

// ─── Orders ────────────────────────────────────────────────────────────────────
export function useOrders(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => paymentApi.getOrders(params).then(r => r.data),
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (data: { course_ids: string[]; coupon_code?: string; gateway: string }) =>
      paymentApi.createOrder(data),
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ─── Blog ──────────────────────────────────────────────────────────────────────
export function useBlogPosts(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['blog', params],
    queryFn: () => blogApi.list(params).then(r => r.data),
    staleTime: 60_000,
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => blogApi.getBySlug(slug).then(r => r.data.data.post),
    enabled: !!slug,
  });
}

export function useBlogTags() {
  return useQuery({
    queryKey: ['blog-tags'],
    queryFn: () => blogApi.getTags().then(r => r.data.data.tags),
    staleTime: 300_000,
  });
}

export function useBlogComments(postId: string) {
  return useQuery({
    queryKey: ['blog-comments', postId],
    queryFn: () => blogApi.getComments(postId).then(r => r.data.data.comments),
    enabled: !!postId,
  });
}

// ─── Careers ───────────────────────────────────────────────────────────────────
export function useJobs(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () => careerApi.listJobs(params).then(r => r.data),
    staleTime: 60_000,
  });
}

export function useJob(slug: string) {
  return useQuery({
    queryKey: ['job', slug],
    queryFn: () => careerApi.getJob(slug).then(r => r.data.data.job),
    enabled: !!slug,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => careerApi.getDepartments().then(r => r.data.data.departments),
    staleTime: 300_000,
  });
}

// ─── Website ───────────────────────────────────────────────────────────────────
export function useSiteSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => websiteApi.getSettings().then(r => r.data.data.settings),
    staleTime: 300_000,
  });
}

export function useFaqs() {
  return useQuery({
    queryKey: ['faqs'],
    queryFn: () => websiteApi.getFaqs().then(r => r.data.data.faqs),
    staleTime: 300_000,
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: () => websiteApi.getTestimonials().then(r => r.data.data.testimonials),
    staleTime: 300_000,
  });
}

export function useBanners(position = 'hero') {
  return useQuery({
    queryKey: ['banners', position],
    queryFn: () => websiteApi.getBanners(position).then(r => r.data.data.banners),
    staleTime: 300_000,
  });
}

// ─── Admin ─────────────────────────────────────────────────────────────────────
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then(r => r.data.data),
    staleTime: 30_000,
  });
}

export function useAdminUsers(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => userApi.listUsers(params).then(r => r.data),
  });
}

export function useRevenueStats() {
  return useQuery({
    queryKey: ['revenue-stats'],
    queryFn: () => paymentApi.getRevenueStats().then(r => r.data.data.stats),
    staleTime: 60_000,
  });
}

export function useActivityLogs(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['activity-logs', params],
    queryFn: () => adminApi.getActivityLogs(params).then(r => r.data),
  });
}

// ─── Instructors ───────────────────────────────────────────────────────────────
export function useInstructors() {
  return useQuery({
    queryKey: ['instructors'],
    queryFn: () => instructorApi.list().then(r => r.data.data.instructors),
    staleTime: 120_000,
  });
}

export function useInstructor(id: string) {
  return useQuery({
    queryKey: ['instructor', id],
    queryFn: () => instructorApi.getById(id).then(r => r.data.data),
    enabled: !!id,
  });
}

// ─── Notifications ─────────────────────────────────────────────────────────────
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list().then(r => r.data.data.notifications),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
