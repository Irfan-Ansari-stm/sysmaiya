import { Response } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess, sendPaginated, paginate } from '../utils/response';
import { AuthRequest } from '../types';

export const userController = {
  getProfile: async (req: AuthRequest, res: Response) => {
    const user = await userService.getProfile(req.user!.id);
    sendSuccess(res, { user });
  },

  updateProfile: async (req: AuthRequest, res: Response) => {
    const result = await userService.updateProfile(req.user!.id, req.body);
    sendSuccess(res, result);
  },

  getStudentDashboard: async (req: AuthRequest, res: Response) => {
    const data = await userService.getStudentDashboard(req.user!.id);
    sendSuccess(res, data);
  },

  getSessions: async (req: AuthRequest, res: Response) => {
    const sessions = await userService.getSessions(req.user!.id);
    sendSuccess(res, { sessions });
  },

  revokeSession: async (req: AuthRequest, res: Response) => {
    const result = await userService.revokeSession(req.user!.id, req.params.sessionId);
    sendSuccess(res, result);
  },

  // ─── Admin ────────────────────────────────────────────────────────────────
  listUsers: async (req: AuthRequest, res: Response) => {
    const { page, limit } = paginate(req.query);
    const result = await userService.listUsers({
      search: req.query.search as string,
      status: req.query.status as string,
      role: req.query.role as string,
      page,
      limit,
    });
    sendPaginated(res, result.users, result.total, result.page, result.limit);
  },

  getUserById: async (req: AuthRequest, res: Response) => {
    const user = await userService.getUserById(req.params.id);
    sendSuccess(res, { user });
  },

  updateUserStatus: async (req: AuthRequest, res: Response) => {
    const result = await userService.updateUserStatus(req.params.id, req.body.status);
    sendSuccess(res, result);
  },

  assignRole: async (req: AuthRequest, res: Response) => {
    const result = await userService.assignRole(req.params.id, req.body.role, req.user!.id);
    sendSuccess(res, result);
  },

  revokeRole: async (req: AuthRequest, res: Response) => {
    const result = await userService.revokeRole(req.params.id, req.params.role);
    sendSuccess(res, result);
  },

  getAdminStats: async (req: AuthRequest, res: Response) => {
    const stats = await userService.getAdminStats();
    sendSuccess(res, stats);
  },
};
