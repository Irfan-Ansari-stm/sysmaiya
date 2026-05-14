import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { cache, CacheKeys } from '../config/redis';
import { AppError } from './errors';

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';

export interface JwtPayload {
  sub: string;       // user id
  email: string;
  roles: string[];
  jti: string;       // unique token id for blacklisting
  iat?: number;
  exp?: number;
}

export function signAccessToken(payload: Omit<JwtPayload, 'jti'>): string {
  const jti = uuidv4();
  return jwt.sign({ ...payload, jti }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES as any });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') throw AppError.unauthorized('Token expired');
    throw AppError.unauthorized('Invalid token');
  }
}

export async function blacklistToken(jti: string, exp: number): Promise<void> {
  const ttl = exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await cache.set(CacheKeys.blacklistedToken(jti), '1', ttl);
  }
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  return cache.exists(CacheKeys.blacklistedToken(jti));
}

export function generateSecureToken(): string {
  return uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
}
