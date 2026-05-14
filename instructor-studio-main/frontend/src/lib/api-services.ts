import api from './api';

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; first_name: string; last_name: string; phone?: string }) =>
    api.post('/auth/register', data),

  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email?token=${token}`),

  login: (data: { email: string; password: string; remember_me?: boolean }) =>
    api.post('/auth/login', data),

  refresh: () => api.post('/auth/refresh'),

  logout: () => api.post('/auth/logout'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  changePassword: (current_password: string, new_password: string) =>
    api.post('/auth/change-password', { current_password, new_password }),

  me: () => api.get('/auth/me'),
};

// ─── Users ─────────────────────────────────────────────────────────────────────
export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: Record<string, any>) => api.patch('/users/me', data),
  getDashboard: () => api.get('/users/me/dashboard'),
  getSessions: () => api.get('/users/me/sessions'),
  revokeSession: (sessionId: string) => api.delete(`/users/me/sessions/${sessionId}`),

  // Admin
  listUsers: (params?: Record<string, any>) => api.get('/users', { params }),
  getUserById: (id: string) => api.get(`/users/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/users/${id}/status`, { status }),
  assignRole: (id: string, role: string) => api.post(`/users/${id}/roles`, { role }),
  revokeRole: (id: string, role: string) => api.delete(`/users/${id}/roles/${role}`),
  getAdminStats: () => api.get('/users/stats'),
};

// ─── Courses ───────────────────────────────────────────────────────────────────
export const courseApi = {
  list: (params?: Record<string, any>) => api.get('/courses', { params }),
  getFeatured: () => api.get('/courses/featured'),
  getCategories: () => api.get('/courses/categories'),
  getBySlug: (slug: string) => api.get(`/courses/${slug}`),
  create: (data: Record<string, any>) => api.post('/courses', data),
  update: (id: string, data: Record<string, any>) => api.patch(`/courses/${id}`, data),
  publish: (id: string) => api.post(`/courses/${id}/publish`),
  unpublish: (id: string) => api.post(`/courses/${id}/unpublish`),
  delete: (id: string) => api.delete(`/courses/${id}`),
  getMyCourses: () => api.get('/courses/instructor/my-courses'),

  // Sections & Lessons
  getSections: (courseId: string) => api.get(`/courses/${courseId}/sections`),
  createSection: (courseId: string, data: Record<string, any>) =>
    api.post(`/courses/${courseId}/sections`, data),
  createLesson: (courseId: string, data: Record<string, any>) =>
    api.post(`/courses/${courseId}/lessons`, data),
  getLesson: (courseId: string, lessonId: string) =>
    api.get(`/courses/${courseId}/lessons/${lessonId}`),

  // Reviews
  getReviews: (courseSlug: string) => api.get(`/courses/${courseSlug}/reviews`),
  submitReview: (courseId: string, data: { rating: number; review_text?: string }) =>
    api.post(`/courses/${courseId}/reviews`, data),
};

// ─── Enrollments ───────────────────────────────────────────────────────────────
export const enrollmentApi = {
  enroll: (course_id: string) => api.post('/enrollments', { course_id }),
  getMyEnrollments: (status?: string) => api.get('/enrollments', { params: { status } }),
  drop: (enrollmentId: string) => api.patch(`/enrollments/${enrollmentId}/drop`),
  updateProgress: (enrollmentId: string, lessonId: string, data: {
    completed: boolean; watch_time_sec?: number; last_position_sec?: number;
  }) => api.post(`/enrollments/${enrollmentId}/lessons/${lessonId}/progress`, data),
};

// ─── Certificates ──────────────────────────────────────────────────────────────
export const certificateApi = {
  getMyCertificates: () => api.get('/certificates/my'),
  verify: (certificateNo: string) => api.get(`/certificates/verify/${certificateNo}`),
};

// ─── Payments ──────────────────────────────────────────────────────────────────
export const paymentApi = {
  createOrder: (data: { course_ids: string[]; coupon_code?: string; gateway: string }) =>
    api.post('/payments/orders', data),
  verifyPayment: (data: Record<string, any>) => api.post('/payments/verify', data),
  getOrders: (params?: Record<string, any>) => api.get('/payments/orders', { params }),
  requestRefund: (orderId: string, data: { amount: number; reason: string }) =>
    api.post(`/payments/orders/${orderId}/refund`, data),
  getRevenueStats: () => api.get('/payments/revenue-stats'),
  getCoupons: () => api.get('/payments/coupons'),
  createCoupon: (data: Record<string, any>) => api.post('/payments/coupons', data),
};

// ─── Blog ──────────────────────────────────────────────────────────────────────
export const blogApi = {
  list: (params?: Record<string, any>) => api.get('/blog', { params }),
  getBySlug: (slug: string) => api.get(`/blog/${slug}`),
  getTags: () => api.get('/blog/tags'),
  create: (data: Record<string, any>) => api.post('/blog', data),
  update: (id: string, data: Record<string, any>) => api.patch(`/blog/${id}`, data),
  delete: (id: string) => api.delete(`/blog/${id}`),
  getComments: (postId: string) => api.get(`/blog/${postId}/comments`),
  addComment: (postId: string, data: { content: string; parent_id?: string }) =>
    api.post(`/blog/${postId}/comments`, data),
  moderateComment: (commentId: string, approved: boolean) =>
    api.patch(`/blog/comments/${commentId}/moderate`, { approved }),
  createTag: (name: string) => api.post('/blog/tags', { name }),
};

// ─── Careers ───────────────────────────────────────────────────────────────────
export const careerApi = {
  listJobs: (params?: Record<string, any>) => api.get('/careers/jobs', { params }),
  getJob: (slug: string) => api.get(`/careers/jobs/${slug}`),
  getDepartments: () => api.get('/careers/departments'),
  createJob: (data: Record<string, any>) => api.post('/careers/jobs', data),
  updateJob: (id: string, data: Record<string, any>) => api.patch(`/careers/jobs/${id}`, data),
  deleteJob: (id: string) => api.delete(`/careers/jobs/${id}`),
  applyJob: (id: string, data: Record<string, any>) => api.post(`/careers/jobs/${id}/apply`, data),
  listApplications: (params?: Record<string, any>) => api.get('/careers/applications', { params }),
  updateApplication: (id: string, status: string) =>
    api.patch(`/careers/applications/${id}/status`, { status }),
};

// ─── Website / CMS ─────────────────────────────────────────────────────────────
export const websiteApi = {
  getSettings: () => api.get('/website/settings'),
  updateSetting: (key: string, value: string) => api.patch(`/website/settings/${key}`, { value }),
  getFaqs: () => api.get('/website/faqs'),
  createFaq: (data: Record<string, any>) => api.post('/website/faqs', data),
  getTestimonials: () => api.get('/website/testimonials'),
  getBanners: (position?: string) => api.get('/website/banners', { params: { position } }),
  subscribe: (email: string, name?: string) => api.post('/website/newsletter/subscribe', { email, name }),
  contact: (data: Record<string, any>) => api.post('/website/contact', data),
  getMessages: () => api.get('/website/contact'),
};

// ─── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getActivityLogs: (params?: Record<string, any>) => api.get('/admin/activity-logs', { params }),
  getEnrollments: (params?: Record<string, any>) => api.get('/admin/enrollments', { params }),
};

// ─── Instructors ───────────────────────────────────────────────────────────────
export const instructorApi = {
  list: () => api.get('/instructors'),
  getById: (id: string) => api.get(`/instructors/${id}`),
};

// ─── Notifications ─────────────────────────────────────────────────────────────
export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
