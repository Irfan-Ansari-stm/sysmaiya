import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { AuthRequest } from '../types';
import { JwtPayload } from '../utils/jwt';

export const authController = {
  register: async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    sendCreated(res, result);
  },

  verifyEmail: async (req: Request, res: Response) => {
    const { token } = req.query as { token: string };
    const result = await authService.verifyEmail(token);
    sendSuccess(res, result);
  },

  login: async (req: Request, res: Response) => {
    const { email, password, remember_me } = req.body;
    const result = await authService.login(email, password, remember_me, req.ip || '');

    // Set refresh token in httpOnly cookie
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: (remember_me ? 90 : 30) * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, {
      access_token: result.access_token,
      user: result.user,
    });
  },

  refresh: async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh token' } });
    }
    const result = await authService.refreshToken(refreshToken);
    sendSuccess(res, result);
  },

  logout: async (req: AuthRequest, res: Response) => {
    const refreshToken = req.cookies?.refresh_token;
    const payload = (req as any).tokenPayload as JwtPayload;

    if (req.user && refreshToken && payload) {
      await authService.logout(req.user.id, refreshToken, payload.jti, payload.exp!);
    }

    res.clearCookie('refresh_token');
    sendSuccess(res, { message: 'Logged out' });
  },

  forgotPassword: async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body.email);
    sendSuccess(res, result);
  },

  resetPassword: async (req: Request, res: Response) => {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    sendSuccess(res, result);
  },

  changePassword: async (req: AuthRequest, res: Response) => {
    const result = await authService.changePassword(
      req.user!.id, req.body.current_password, req.body.new_password
    );
    res.clearCookie('refresh_token');
    sendSuccess(res, result);
  },

  me: async (req: AuthRequest, res: Response) => {
    sendSuccess(res, { user: req.user });
  },
};
