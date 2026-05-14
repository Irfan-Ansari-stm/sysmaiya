import { Response, NextFunction } from 'express';
import { verifyAccessToken, isTokenBlacklisted } from '../utils/jwt';
import { AppError } from '../utils/errors';
import { AuthRequest, RoleType } from '../types';
import { cache, CacheKeys } from '../config/redis';
import { query } from '../config/database';

// ─── Authenticate JWT ──────────────────────────────────────────────────────────
export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('No token provided');
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    // Check blacklist (for logged-out tokens)
    if (await isTokenBlacklisted(payload.jti)) {
      throw AppError.unauthorized('Token has been revoked');
    }

    // Try roles from cache first
    let roles = payload.roles;
    const cachedRoles = await cache.get<RoleType[]>(CacheKeys.userRoles(payload.sub));
    if (cachedRoles) {
      roles = cachedRoles;
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: roles as RoleType[],
    };
    next();
  } catch (err) {
    next(err);
  }
}

// ─── Authorize by Role ────────────────────────────────────────────────────────
export function authorize(...allowedRoles: RoleType[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) return next(AppError.forbidden('Insufficient permissions'));
    next();
  };
}

// ─── Authorize by Permission (module:action) ──────────────────────────────────
export function requirePermission(module: string, action: string) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());

    // Super admin always passes
    if (req.user.roles.includes('super_admin')) return next();

    try {
      const { rows } = await query(
        `SELECT 1 FROM user_roles ur
         JOIN role_permissions rp ON rp.role_id = ur.role_id
         JOIN permissions p ON p.id = rp.permission_id
         WHERE ur.user_id = $1 AND p.module = $2 AND p.action = $3
         LIMIT 1`,
        [req.user.id, module, action]
      );

      if (!rows.length) return next(AppError.forbidden('Missing required permission'));
      next();
    } catch (err) {
      next(err);
    }
  };
}

// ─── Optional auth (for public routes that can benefit from user context) ─────
export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (!(await isTokenBlacklisted(payload.jti))) {
      req.user = { id: payload.sub, email: payload.email, roles: payload.roles as RoleType[] };
    }
  } catch {
    // Ignore - optional
  }
  next();
}

// ─── Verify account is active ─────────────────────────────────────────────────
export async function requireActiveAccount(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user) return next(AppError.unauthorized());
  try {
    const { rows } = await query('SELECT status FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length || rows[0].status !== 'active') {
      return next(AppError.forbidden('Account is not active'));
    }
    next();
  } catch (err) {
    next(err);
  }
}
