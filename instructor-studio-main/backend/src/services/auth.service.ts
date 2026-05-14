import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { query, withTransaction } from '../config/database';
import { cache, CacheKeys } from '../config/redis';
import { signAccessToken, generateSecureToken, blacklistToken } from '../utils/jwt';
import { AppError } from '../utils/errors';
import { sendEmail, EmailTemplates } from './email.service';
import { logger } from '../utils/logger';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const REFRESH_TOKEN_EXPIRY_DAYS_REMEMBER = 90;

function normalizeRoles(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((role): role is string => typeof role === 'string' && role.length > 0);
  }

  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }

  return [];
}

export class AuthService {
  // ─── Register ──────────────────────────────────────────────────────────────
  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) {
    const { email, password, first_name, last_name, phone } = data;

    // Check duplicate
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) throw AppError.conflict('Email already registered');

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = uuidv4();

    await withTransaction(async (client) => {
      // Create user
      await client.query(
        `INSERT INTO users (id, email, phone, password_hash, first_name, last_name, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending_verification')`,
        [userId, email, phone || null, password_hash, first_name, last_name]
      );

      // Assign student role
      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT $1, id FROM roles WHERE name = 'student'`,
        [userId]
      );
    });

    // Send verification email
    const verification = await this.sendVerificationEmail(userId, email, first_name);

    return {
      user_id: userId,
      email,
      message: 'Verification email sent',
      ...(process.env.NODE_ENV !== 'production' ? {
        verification_token: verification.token,
        verification_url: verification.verifyUrl,
      } : {}),
    };
  }

  // ─── Send Verification Email ───────────────────────────────────────────────
  async sendVerificationEmail(userId: string, email: string, name: string) {
    const token = generateSecureToken();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await query(
      `INSERT INTO auth_tokens (user_id, token_hash, type, expires_at)
       VALUES ($1, $2, 'email_verify', NOW() + INTERVAL '24 hours')`,
      [userId, tokenHash]
    );

    const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
    const tmpl = EmailTemplates.verifyEmail(name, verifyUrl);
    await sendEmail({ to: email, ...tmpl });

    logger.info('Verification token generated', {
      userId,
      email,
      verifyUrl,
      exposedInResponse: process.env.NODE_ENV !== 'production',
    });

    return { token, verifyUrl };
  }

  // ─── Verify Email ──────────────────────────────────────────────────────────
  async verifyEmail(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { rows } = await query(
      `SELECT * FROM auth_tokens
       WHERE token_hash = $1 AND type = 'email_verify' AND used = false AND expires_at > NOW()`,
      [tokenHash]
    );
    if (!rows.length) throw AppError.badRequest('Invalid or expired verification token');

    const authToken = rows[0];
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE users SET email_verified = true, status = 'active', updated_at = NOW() WHERE id = $1`,
        [authToken.user_id]
      );
      await client.query(`UPDATE auth_tokens SET used = true WHERE id = $1`, [authToken.id]);
    });

    // Invalidate role cache
    await cache.del(CacheKeys.userRoles(authToken.user_id));
    return { message: 'Email verified successfully' };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────
  async login(email: string, password: string, rememberMe: boolean, ip: string) {
    const { rows } = await query(
      `SELECT u.*, ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.email = $1
       GROUP BY u.id`,
      [email]
    );

    const user = rows[0];

    // Always hash compare to prevent timing attacks
    const dummyHash = '$2a$12$dummy.hash.to.prevent.timing.attacks.123456789012';
    const isValid = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, dummyHash);

    if (!user || !isValid) {
      // Log failed attempt
      await query(
        `INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, false)`,
        [email, ip]
      );
      throw AppError.unauthorized('Invalid email or password');
    }

    if (user.status === 'banned') throw AppError.forbidden('Account has been banned');
    if (user.status === 'pending_verification')
      throw AppError.forbidden('Please verify your email first');
    if (user.status === 'inactive') throw AppError.forbidden('Account is inactive');

    // Check login attempt lockout (5 failures in 15 min)
    const { rows: attempts } = await query(
      `SELECT COUNT(*) FROM login_attempts
       WHERE email = $1 AND success = false AND attempted_at > NOW() - INTERVAL '15 minutes'`,
      [email]
    );
    if (parseInt(attempts[0].count) >= 5) {
      throw AppError.tooManyRequests('Too many failed attempts. Try again in 15 minutes.');
    }

    const roles = normalizeRoles(user.roles);

    // Cache roles
    await cache.set(CacheKeys.userRoles(user.id), roles, 3600);

    // Issue tokens
    const accessToken = signAccessToken({ sub: user.id, email: user.email, roles });

    const refreshToken = generateSecureToken();
    const refreshExpiry = rememberMe ? REFRESH_TOKEN_EXPIRY_DAYS_REMEMBER : REFRESH_TOKEN_EXPIRY_DAYS;

    await query(
      `INSERT INTO user_sessions (user_id, refresh_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '${refreshExpiry} days')`,
      [user.id, refreshToken, ip, null]
    );

    // Log success
    await query(
      `UPDATE users SET last_login_at = NOW(), login_count = login_count + 1 WHERE id = $1`,
      [user.id]
    );
    await query(
      `INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, true)`,
      [email, ip]
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        roles,
      },
    };
  }

  // ─── Refresh Token ─────────────────────────────────────────────────────────
  async refreshToken(refreshToken: string) {
    const { rows } = await query(
      `SELECT us.*, u.email,
              ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) AS roles
       FROM user_sessions us
       JOIN users u ON u.id = us.user_id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE us.refresh_token = $1
         AND us.revoked = false
         AND us.expires_at > NOW()
         AND u.status = 'active'
       GROUP BY us.id, u.email`,
      [refreshToken]
    );

    if (!rows.length) throw AppError.unauthorized('Invalid or expired refresh token');

    const session = rows[0];
    const roles = normalizeRoles(session.roles);
    const accessToken = signAccessToken({ sub: session.user_id, email: session.email, roles });

    // Update role cache
    await cache.set(CacheKeys.userRoles(session.user_id), roles, 3600);

    return { access_token: accessToken };
  }

  // ─── Logout ────────────────────────────────────────────────────────────────
  async logout(userId: string, refreshToken: string, jti: string, exp: number) {
    await query(
      `UPDATE user_sessions SET revoked = true WHERE user_id = $1 AND refresh_token = $2`,
      [userId, refreshToken]
    );
    await blacklistToken(jti, exp);
    await cache.del(CacheKeys.userRoles(userId));
  }

  // ─── Forgot Password ───────────────────────────────────────────────────────
  async forgotPassword(email: string) {
    const { rows } = await query(
      `SELECT id, first_name FROM users WHERE email = $1 AND status = 'active'`,
      [email]
    );
    // Always return success to prevent email enumeration
    if (!rows.length) return { message: 'If this email exists, a reset link has been sent' };

    const user = rows[0];
    const token = generateSecureToken();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Invalidate old tokens
    await query(
      `UPDATE auth_tokens SET used = true WHERE user_id = $1 AND type = 'password_reset'`,
      [user.id]
    );

    await query(
      `INSERT INTO auth_tokens (user_id, token_hash, type, expires_at)
       VALUES ($1, $2, 'password_reset', NOW() + INTERVAL '1 hour')`,
      [user.id, tokenHash]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    const tmpl = EmailTemplates.passwordReset(user.first_name, resetUrl);
    await sendEmail({ to: email, ...tmpl });

    return { message: 'If this email exists, a reset link has been sent' };
  }

  // ─── Reset Password ────────────────────────────────────────────────────────
  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { rows } = await query(
      `SELECT * FROM auth_tokens
       WHERE token_hash = $1 AND type = 'password_reset' AND used = false AND expires_at > NOW()`,
      [tokenHash]
    );
    if (!rows.length) throw AppError.badRequest('Invalid or expired reset token');

    const authToken = rows[0];
    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
        [password_hash, authToken.user_id]
      );
      await client.query(`UPDATE auth_tokens SET used = true WHERE id = $1`, [authToken.id]);
      // Revoke all sessions
      await client.query(
        `UPDATE user_sessions SET revoked = true WHERE user_id = $1`,
        [authToken.user_id]
      );
    });

    return { message: 'Password reset successfully' };
  }

  // ─── Change Password ───────────────────────────────────────────────────────
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const { rows } = await query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
    if (!rows.length) throw AppError.notFound('User');

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) throw AppError.badRequest('Current password is incorrect');

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [
      password_hash, userId,
    ]);

    // Revoke all other sessions
    await query(`UPDATE user_sessions SET revoked = true WHERE user_id = $1`, [userId]);

    return { message: 'Password changed successfully' };
  }
}

export const authService = new AuthService();
