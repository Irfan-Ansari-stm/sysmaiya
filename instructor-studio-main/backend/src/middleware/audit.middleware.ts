import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { query } from '../config/database';
import { logger } from '../utils/logger';

export function auditLog(action: string, entityType?: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const entityId =
            req.params.id || req.params.courseId || req.params.userId || null;
          await query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              req.user?.id || null,
              action,
              entityType || null,
              entityId,
              req.ip,
              req.get('user-agent') || null,
            ]
          );
        } catch (err: any) {
          logger.warn('Failed to write audit log', { error: err.message });
        }
      }
    });
    next();
  };
}
