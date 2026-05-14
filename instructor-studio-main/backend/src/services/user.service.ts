import { query, withTransaction } from '../config/database';
import { AppError } from '../utils/errors';
import { cache, CacheKeys } from '../config/redis';

export class UserService {
  async getProfile(userId: string) {
    const { rows } = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_url, u.bio,
              u.phone, u.date_of_birth, u.country, u.city, u.timezone, u.gender,
              u.status, u.email_verified, u.phone_verified, u.last_login_at, u.created_at,
              ARRAY_AGG(DISTINCT r.name) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );
    if (!rows.length) throw AppError.notFound('User');
    const user = rows[0];
    delete (user as any).password_hash;
    return user;
  }

  async updateProfile(userId: string, data: Record<string, any>) {
    const allowed = ['first_name', 'last_name', 'bio', 'phone', 'date_of_birth',
                     'country', 'city', 'timezone', 'gender'];
    const updates = Object.entries(data)
      .filter(([k]) => allowed.includes(k) && data[k] !== undefined);

    if (!updates.length) return { message: 'No changes' };

    const fields = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const vals = updates.map(([, v]) => v);

    await query(
      `UPDATE users SET ${fields}, updated_at = NOW() WHERE id = $1`,
      [userId, ...vals]
    );
    return { message: 'Profile updated' };
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    await query(`UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2`, [avatarUrl, userId]);
    return { avatar_url: avatarUrl };
  }

  // ─── Admin: List All Users ─────────────────────────────────────────────────
  async listUsers(params: { search?: string; status?: string; role?: string; page: number; limit: number }) {
    const { search, status, role, page, limit } = params;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const vals: any[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(u.email ILIKE $${idx} OR u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx})`);
      vals.push(`%${search}%`); idx++;
    }
    if (status) { conditions.push(`u.status = $${idx}`); vals.push(status); idx++; }
    if (role) { conditions.push(`r.name = $${idx}`); vals.push(role); idx++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_url,
              u.status, u.email_verified, u.last_login_at, u.created_at,
              ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       ${where}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...vals, limit, offset]
    );

    const { rows: countRows } = await query(
      `SELECT COUNT(DISTINCT u.id) FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       ${where}`,
      vals
    );

    return { users: rows, total: parseInt(countRows[0].count), page, limit };
  }

  async getUserById(userId: string) {
    return this.getProfile(userId);
  }

  async updateUserStatus(userId: string, status: string) {
    const allowed = ['active', 'inactive', 'banned'];
    if (!allowed.includes(status)) throw AppError.badRequest('Invalid status');
    await query(`UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2`, [status, userId]);
    await cache.del(CacheKeys.userRoles(userId));
    return { message: `User ${status}` };
  }

  async assignRole(userId: string, roleName: string, assignedBy: string) {
    const { rows: roleRows } = await query(`SELECT id FROM roles WHERE name = $1`, [roleName]);
    if (!roleRows.length) throw AppError.notFound('Role');

    await query(
      `INSERT INTO user_roles (user_id, role_id, assigned_by)
       VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
      [userId, roleRows[0].id, assignedBy]
    );

    // If assigning instructor role, also create instructor profile if missing
    if (roleName === 'instructor') {
      await query(
        `INSERT INTO instructors (id, user_id) VALUES (gen_random_uuid(), $1) ON CONFLICT DO NOTHING`,
        [userId]
      );
    }

    await cache.del(CacheKeys.userRoles(userId));
    return { message: `Role '${roleName}' assigned` };
  }

  async revokeRole(userId: string, roleName: string) {
    await query(
      `DELETE FROM user_roles WHERE user_id = $1
       AND role_id = (SELECT id FROM roles WHERE name = $2)`,
      [userId, roleName]
    );
    await cache.del(CacheKeys.userRoles(userId));
    return { message: `Role '${roleName}' revoked` };
  }

  async getSessions(userId: string) {
    const { rows } = await query(
      `SELECT id, ip_address, user_agent, created_at, expires_at
       FROM user_sessions WHERE user_id = $1 AND revoked = false AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  async revokeSession(userId: string, sessionId: string) {
    await query(
      `UPDATE user_sessions SET revoked = true WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );
    return { message: 'Session revoked' };
  }

  async getStudentDashboard(userId: string) {
    const { rows } = await query(`SELECT * FROM vw_student_dashboard WHERE student_id = $1`, [userId]);
    return rows[0] || {};
  }

  async getAdminStats() {
    const [usersRes, coursesRes, enrollmentsRes, revenueRes] = await Promise.all([
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active,
             COUNT(*) FILTER (WHERE created_at > NOW()-INTERVAL '30 days') AS new_this_month
             FROM users`),
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='published') AS published,
             COUNT(*) FILTER (WHERE status='draft') AS drafts FROM courses`),
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active,
             COUNT(*) FILTER (WHERE status='completed') AS completed FROM enrollments`),
      query(`SELECT COALESCE(SUM(total_amount) FILTER (WHERE payment_status='completed'),0) AS total_revenue,
             COALESCE(SUM(total_amount) FILTER (WHERE payment_status='completed' AND created_at > NOW()-INTERVAL '30 days'),0) AS this_month
             FROM orders`),
    ]);
    return {
      users: usersRes.rows[0],
      courses: coursesRes.rows[0],
      enrollments: enrollmentsRes.rows[0],
      revenue: revenueRes.rows[0],
    };
  }
}

export const userService = new UserService();
