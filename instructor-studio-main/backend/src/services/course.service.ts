import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import { query, withTransaction } from '../config/database';
import { AppError } from '../utils/errors';
import { cache } from '../config/redis';

export class CourseService {
  // ─── List Courses (Public) ─────────────────────────────────────────────────
  async listCourses(params: {
    search?: string; category?: string; level?: string;
    min_price?: number; max_price?: number; is_free?: boolean;
    sort?: string; page: number; limit: number;
  }) {
    const { search, category, level, min_price, max_price, is_free, sort, page, limit } = params;
    const offset = (page - 1) * limit;
    const conditions: string[] = ["c.status = 'published'"];
    const values: any[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(c.title ILIKE $${idx} OR c.description ILIKE $${idx})`);
      values.push(`%${search}%`); idx++;
    }
    if (category) {
      conditions.push(`cat.slug = $${idx}`);
      values.push(category); idx++;
    }
    if (level) { conditions.push(`c.level = $${idx}`); values.push(level); idx++; }
    if (is_free !== undefined) { conditions.push(`c.is_free = $${idx}`); values.push(is_free); idx++; }
    if (min_price !== undefined) { conditions.push(`c.price >= $${idx}`); values.push(min_price); idx++; }
    if (max_price !== undefined) { conditions.push(`c.price <= $${idx}`); values.push(max_price); idx++; }

    const orderMap: Record<string, string> = {
      newest: 'c.published_at DESC',
      popular: 'c.total_students DESC',
      highest_rated: 'c.rating_avg DESC',
      price_asc: 'c.price ASC',
      price_desc: 'c.price DESC',
    };
    const orderBy = orderMap[sort || 'newest'] || 'c.published_at DESC';
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQ = `SELECT COUNT(*) FROM courses c LEFT JOIN categories cat ON cat.id = c.category_id ${where}`;
    const dataQ = `
      SELECT c.id, c.title, c.slug, c.subtitle, c.level, c.language, c.is_free, c.price,
             c.discount_price, c.duration_hours, c.total_lessons, c.total_students,
             c.rating_avg, c.total_reviews, c.is_featured, c.published_at,
             mf.cdn_url AS thumbnail_url,
             cat.name AS category_name, cat.slug AS category_slug,
             u.first_name || ' ' || u.last_name AS instructor_name,
             i.id AS instructor_id
      FROM courses c
      LEFT JOIN categories cat ON cat.id = c.category_id
      LEFT JOIN instructors i ON i.id = c.instructor_id
      LEFT JOIN users u ON u.id = i.user_id
      LEFT JOIN media_files mf ON mf.id = c.thumbnail_id
      ${where}
      ORDER BY ${orderBy}
      LIMIT $${idx} OFFSET $${idx + 1}`;

    const [countRes, dataRes] = await Promise.all([
      query(countQ, values),
      query(dataQ, [...values, limit, offset]),
    ]);

    return {
      courses: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      page, limit,
    };
  }

  // ─── Get Course Detail ─────────────────────────────────────────────────────
  async getCourse(slug: string, userId?: string) {
    const { rows } = await query(
      `SELECT c.*,
              mf.cdn_url AS thumbnail_url,
              pv.cdn_url AS preview_video_url,
              cat.name AS category_name, cat.slug AS category_slug,
              u.first_name || ' ' || u.last_name AS instructor_name,
              u.avatar_url AS instructor_avatar,
              i.headline AS instructor_headline, i.rating_avg AS instructor_rating,
              i.total_students AS instructor_students, i.id AS instructor_id
       FROM courses c
       LEFT JOIN categories cat ON cat.id = c.category_id
       LEFT JOIN instructors i ON i.id = c.instructor_id
       LEFT JOIN users u ON u.id = i.user_id
       LEFT JOIN media_files mf ON mf.id = c.thumbnail_id
       LEFT JOIN media_files pv ON pv.id = c.preview_video_id
       WHERE c.slug = $1 AND c.status = 'published'`,
      [slug]
    );
    if (!rows.length) throw AppError.notFound('Course');
    const course = rows[0];

    // Get sections + lessons
    const { rows: sections } = await query(
      `SELECT cs.id, cs.title, cs.sort_order,
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', l.id, 'title', l.title, 'type', l.type,
                  'duration_sec', l.duration_sec, 'is_preview', l.is_preview,
                  'sort_order', l.sort_order
                ) ORDER BY l.sort_order
              ) FILTER (WHERE l.id IS NOT NULL) AS lessons
       FROM course_sections cs
       LEFT JOIN lessons l ON l.section_id = cs.id AND l.is_published = true
       WHERE cs.course_id = $1
       GROUP BY cs.id ORDER BY cs.sort_order`,
      [course.id]
    );

    // Check enrollment if user provided
    let enrollment = null;
    if (userId) {
      const { rows: enr } = await query(
        `SELECT id, status, progress_pct, enrolled_at FROM enrollments
         WHERE student_id = $1 AND course_id = $2`,
        [userId, course.id]
      );
      enrollment = enr[0] || null;
    }

    return { ...course, sections, enrollment };
  }

  // ─── Create Course ─────────────────────────────────────────────────────────
  async createCourse(instructorUserId: string, data: any) {
    const { rows: instRows } = await query(
      `SELECT id FROM instructors WHERE user_id = $1`, [instructorUserId]
    );
    if (!instRows.length) throw AppError.badRequest('Instructor profile not found');

    const instructorId = instRows[0].id;
    const courseId = uuidv4();
    let slug = slugify(data.title, { lower: true, strict: true });

    // Ensure unique slug
    const { rows: existing } = await query(`SELECT id FROM courses WHERE slug LIKE $1`, [`${slug}%`]);
    if (existing.length) slug = `${slug}-${existing.length}`;

    await query(
      `INSERT INTO courses (id, instructor_id, category_id, title, slug, subtitle, description,
        what_you_learn, requirements, level, language, is_free, price, discount_price, certificate_enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [courseId, instructorId, data.category_id || null, data.title, slug,
       data.subtitle || null, data.description || null,
       data.what_you_learn || [], data.requirements || [],
       data.level, data.language, data.is_free, data.price,
       data.discount_price || null, data.certificate_enabled ?? true]
    );

    return { id: courseId, slug };
  }

  // ─── Update Course ─────────────────────────────────────────────────────────
  async updateCourse(courseId: string, userId: string, roles: string[], data: any) {
    const { rows } = await query(
      `SELECT c.id FROM courses c
       JOIN instructors i ON i.id = c.instructor_id
       WHERE c.id = $1`,
      [courseId]
    );
    if (!rows.length) throw AppError.notFound('Course');

    // Check ownership unless admin/super_admin
    if (!roles.includes('admin') && !roles.includes('super_admin')) {
      const { rows: own } = await query(
        `SELECT 1 FROM courses c JOIN instructors i ON i.id = c.instructor_id
         WHERE c.id = $1 AND i.user_id = $2`,
        [courseId, userId]
      );
      if (!own.length) throw AppError.forbidden('You do not own this course');
    }

    const fields = Object.entries(data)
      .filter(([, v]) => v !== undefined)
      .map(([k, _], i) => `${k} = $${i + 2}`);
    const vals = Object.values(data).filter((v) => v !== undefined);

    if (!fields.length) return { message: 'No changes' };

    await query(
      `UPDATE courses SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $1`,
      [courseId, ...vals]
    );

    await cache.del(`course:${courseId}`);
    return { message: 'Course updated' };
  }

  // ─── Publish / Unpublish ───────────────────────────────────────────────────
  async publishCourse(courseId: string) {
    const { rows } = await query(`SELECT id, status FROM courses WHERE id = $1`, [courseId]);
    if (!rows.length) throw AppError.notFound('Course');

    await query(
      `UPDATE courses SET status = 'published', published_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [courseId]
    );
    return { message: 'Course published' };
  }

  async unpublishCourse(courseId: string) {
    await query(
      `UPDATE courses SET status = 'draft', published_at = NULL, updated_at = NOW() WHERE id = $1`,
      [courseId]
    );
    return { message: 'Course unpublished' };
  }

  // ─── Sections ──────────────────────────────────────────────────────────────
  async createSection(courseId: string, data: { title: string; description?: string; sort_order?: number }) {
    const id = uuidv4();
    await query(
      `INSERT INTO course_sections (id, course_id, title, description, sort_order)
       VALUES ($1,$2,$3,$4,$5)`,
      [id, courseId, data.title, data.description || null, data.sort_order || 0]
    );
    return { id };
  }

  async getSections(courseId: string) {
    const { rows } = await query(
      `SELECT cs.*, 
              JSON_AGG(JSON_BUILD_OBJECT(
                'id', l.id, 'title', l.title, 'type', l.type,
                'duration_sec', l.duration_sec, 'is_preview', l.is_preview,
                'is_published', l.is_published, 'sort_order', l.sort_order
              ) ORDER BY l.sort_order) FILTER (WHERE l.id IS NOT NULL) AS lessons
       FROM course_sections cs
       LEFT JOIN lessons l ON l.section_id = cs.id
       WHERE cs.course_id = $1
       GROUP BY cs.id ORDER BY cs.sort_order`,
      [courseId]
    );
    return rows;
  }

  // ─── Lessons ───────────────────────────────────────────────────────────────
  async createLesson(courseId: string, data: any) {
    const id = uuidv4();
    await query(
      `INSERT INTO lessons (id, section_id, course_id, title, type, description, content,
        duration_sec, sort_order, is_preview)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, data.section_id, courseId, data.title, data.type,
       data.description || null, data.content || null,
       data.duration_sec || 0, data.sort_order || 0, data.is_preview || false]
    );

    // Update total_lessons count
    await query(
      `UPDATE courses SET total_lessons = (
         SELECT COUNT(*) FROM lessons WHERE course_id = $1 AND is_published = true
       ) WHERE id = $1`,
      [courseId]
    );
    return { id };
  }

  async getLesson(lessonId: string, userId?: string) {
    const { rows } = await query(
      `SELECT l.*, cs.title AS section_title,
              mf.cdn_url AS video_url
       FROM lessons l
       JOIN course_sections cs ON cs.id = l.section_id
       LEFT JOIN media_files mf ON mf.id = l.video_id
       WHERE l.id = $1`,
      [lessonId]
    );
    if (!rows.length) throw AppError.notFound('Lesson');
    const lesson = rows[0];

    // Non-preview lessons require enrollment
    if (!lesson.is_preview && userId) {
      const { rows: enr } = await query(
        `SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2 AND status = 'active'`,
        [userId, lesson.course_id]
      );
      if (!enr.length) throw AppError.forbidden('Enroll in this course to access lesson');
    }

    return lesson;
  }

  // ─── Instructor's Own Courses ──────────────────────────────────────────────
  async getInstructorCourses(userId: string) {
    const { rows } = await query(
      `SELECT c.id, c.title, c.slug, c.status, c.price, c.is_free,
              c.total_students, c.rating_avg, c.total_reviews, c.created_at,
              mf.cdn_url AS thumbnail_url
       FROM courses c
       JOIN instructors i ON i.id = c.instructor_id
       LEFT JOIN media_files mf ON mf.id = c.thumbnail_id
       WHERE i.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return rows;
  }

  // ─── Featured Courses ──────────────────────────────────────────────────────
  async getFeaturedCourses() {
    const { rows } = await query(
      `SELECT c.id, c.title, c.slug, c.subtitle, c.level, c.price, c.is_free,
              c.rating_avg, c.total_students, c.total_lessons, c.duration_hours,
              mf.cdn_url AS thumbnail_url,
              u.first_name || ' ' || u.last_name AS instructor_name
       FROM courses c
       LEFT JOIN instructors i ON i.id = c.instructor_id
       LEFT JOIN users u ON u.id = i.user_id
       LEFT JOIN media_files mf ON mf.id = c.thumbnail_id
       WHERE c.status = 'published' AND c.is_featured = true
       ORDER BY c.published_at DESC LIMIT 8`
    );
    return rows;
  }

  // ─── Categories ───────────────────────────────────────────────────────────
  async getCategories() {
    const { rows } = await query(
      `SELECT c.*, COUNT(co.id) AS course_count
       FROM categories c
       LEFT JOIN courses co ON co.category_id = c.id AND co.status = 'published'
       WHERE c.is_active = true AND c.parent_id IS NULL
       GROUP BY c.id ORDER BY c.sort_order`
    );
    return rows;
  }
}

export const courseService = new CourseService();
