import { Response } from 'express';
import { courseService } from '../services/course.service';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';
import { AuthRequest } from '../types';

export const courseController = {
  listCourses: async (req: AuthRequest, res: Response) => {
    const result = await courseService.listCourses({
      search: req.query.search as string,
      category: req.query.category as string,
      level: req.query.level as string,
      min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
      max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
      is_free: req.query.is_free === 'true' ? true : req.query.is_free === 'false' ? false : undefined,
      sort: req.query.sort as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    sendPaginated(res, result.courses, result.total, result.page, result.limit);
  },

  getCourse: async (req: AuthRequest, res: Response) => {
    const course = await courseService.getCourse(req.params.slug, req.user?.id);
    sendSuccess(res, { course });
  },

  getFeatured: async (req: AuthRequest, res: Response) => {
    const courses = await courseService.getFeaturedCourses();
    sendSuccess(res, { courses });
  },

  getCategories: async (_req: AuthRequest, res: Response) => {
    const categories = await courseService.getCategories();
    sendSuccess(res, { categories });
  },

  createCourse: async (req: AuthRequest, res: Response) => {
    const result = await courseService.createCourse(req.user!.id, req.body);
    sendCreated(res, result);
  },

  updateCourse: async (req: AuthRequest, res: Response) => {
    const result = await courseService.updateCourse(
      req.params.id, req.user!.id, req.user!.roles, req.body
    );
    sendSuccess(res, result);
  },

  publishCourse: async (req: AuthRequest, res: Response) => {
    const result = await courseService.publishCourse(req.params.id);
    sendSuccess(res, result);
  },

  unpublishCourse: async (req: AuthRequest, res: Response) => {
    const result = await courseService.unpublishCourse(req.params.id);
    sendSuccess(res, result);
  },

  deleteCourse: async (req: AuthRequest, res: Response) => {
    const { query } = await import('../config/database');
    await query(`UPDATE courses SET status='archived' WHERE id=$1`, [req.params.id]);
    sendSuccess(res, { message: 'Course archived' });
  },

  getMySections: async (req: AuthRequest, res: Response) => {
    const sections = await courseService.getSections(req.params.id);
    sendSuccess(res, { sections });
  },

  createSection: async (req: AuthRequest, res: Response) => {
    const result = await courseService.createSection(req.params.id, req.body);
    sendCreated(res, result);
  },

  createLesson: async (req: AuthRequest, res: Response) => {
    const result = await courseService.createLesson(req.params.id, req.body);
    sendCreated(res, result);
  },

  getLesson: async (req: AuthRequest, res: Response) => {
    const lesson = await courseService.getLesson(req.params.lessonId, req.user?.id);
    sendSuccess(res, { lesson });
  },

  getMyInstructorCourses: async (req: AuthRequest, res: Response) => {
    const courses = await courseService.getInstructorCourses(req.user!.id);
    sendSuccess(res, { courses });
  },
};
