import { v4 as uuidv4 } from 'uuid';
import { query, withTransaction } from '../config/database';
import { AppError } from '../utils/errors';
import { sendEmail, EmailTemplates } from './email.service';

export class EnrollmentService {
  async enroll(studentId: string, courseId: string) {
    // Check course exists and is published
    const { rows: courseRows } = await query(
      `SELECT id, title, is_free, price, instructor_id FROM courses WHERE id = $1 AND status = 'published'`,
      [courseId]
    );
    if (!courseRows.length) throw AppError.notFound('Course');
    const course = courseRows[0];

    // Check not already enrolled
    const { rows: existing } = await query(
      `SELECT id, status FROM enrollments WHERE student_id = $1 AND course_id = $2`,
      [studentId, courseId]
    );
    if (existing.length && existing[0].status === 'active') {
      throw AppError.conflict('Already enrolled in this course');
    }

    // For paid courses, verify completed order
    if (!course.is_free && course.price > 0) {
      const { rows: orders } = await query(
        `SELECT o.id FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         WHERE oi.course_id = $1 AND o.student_id = $2 AND o.payment_status = 'completed'`,
        [courseId, studentId]
      );
      if (!orders.length) throw AppError.unprocessable('Payment required to enroll in this course');
    }

    const enrollmentId = uuidv4();
    if (existing.length) {
      // Re-activate dropped enrollment
      await query(
        `UPDATE enrollments SET status = 'active', updated_at = NOW() WHERE id = $1`,
        [existing[0].id]
      );
    } else {
      await query(
        `INSERT INTO enrollments (id, student_id, course_id, status) VALUES ($1,$2,$3,'active')`,
        [enrollmentId, studentId, courseId]
      );
    }

    // Send confirmation email
    const { rows: userRows } = await query(
      `SELECT email, first_name FROM users WHERE id = $1`, [studentId]
    );
    if (userRows.length) {
      const tmpl = EmailTemplates.enrollmentConfirmation(userRows[0].first_name, course.title);
      await sendEmail({ to: userRows[0].email, ...tmpl });
    }

    return { enrollment_id: enrollmentId, course_id: courseId, message: 'Enrolled successfully' };
  }

  async getMyEnrollments(studentId: string, status = 'active') {
    const { rows } = await query(
      `SELECT e.id, e.status, e.progress_pct, e.enrolled_at, e.completed_at,
              c.id AS course_id, c.title, c.slug, c.level, c.total_lessons, c.duration_hours,
              mf.cdn_url AS thumbnail_url,
              u.first_name || ' ' || u.last_name AS instructor_name
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       LEFT JOIN instructors i ON i.id = c.instructor_id
       LEFT JOIN users u ON u.id = i.user_id
       LEFT JOIN media_files mf ON mf.id = c.thumbnail_id
       WHERE e.student_id = $1 AND e.status = $2
       ORDER BY e.enrolled_at DESC`,
      [studentId, status]
    );
    return rows;
  }

  async updateProgress(studentId: string, enrollmentId: string, lessonId: string, data: {
    completed: boolean; watch_time_sec?: number; last_position_sec?: number;
  }) {
    // Verify enrollment ownership
    const { rows: enrRows } = await query(
      `SELECT id, course_id FROM enrollments WHERE id = $1 AND student_id = $2 AND status = 'active'`,
      [enrollmentId, studentId]
    );
    if (!enrRows.length) throw AppError.notFound('Enrollment');

    // Upsert lesson progress
    await query(
      `INSERT INTO lesson_progress (id, enrollment_id, lesson_id, student_id, completed, watch_time_sec, last_position_sec, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (enrollment_id, lesson_id) DO UPDATE SET
         completed = EXCLUDED.completed,
         watch_time_sec = GREATEST(lesson_progress.watch_time_sec, EXCLUDED.watch_time_sec),
         last_position_sec = EXCLUDED.last_position_sec,
         completed_at = CASE WHEN EXCLUDED.completed = true THEN NOW() ELSE lesson_progress.completed_at END,
         updated_at = NOW()`,
      [uuidv4(), enrollmentId, lessonId, studentId,
       data.completed, data.watch_time_sec || 0, data.last_position_sec || 0,
       data.completed ? new Date() : null]
    );

    // Get updated enrollment to check if completed
    const { rows: updatedEnr } = await query(
      `SELECT progress_pct, status FROM enrollments WHERE id = $1`,
      [enrollmentId]
    );

    // Auto-issue certificate if newly completed
    if (updatedEnr[0]?.status === 'completed') {
      await this.issueCertificate(studentId, enrollmentId, enrRows[0].course_id);
    }

    return { progress_pct: updatedEnr[0]?.progress_pct };
  }

  async issueCertificate(studentId: string, enrollmentId: string, courseId: string) {
    // Check not already issued
    const { rows: existing } = await query(
      `SELECT id FROM certificates WHERE enrollment_id = $1`, [enrollmentId]
    );
    if (existing.length) return;

    const certId = uuidv4();
    await query(
      `INSERT INTO certificates (id, enrollment_id, student_id, course_id, status)
       VALUES ($1,$2,$3,$4,'issued')`,
      [certId, enrollmentId, studentId, courseId]
    );

    // Send certificate email
    const { rows } = await query(
      `SELECT u.email, u.first_name, c.title
       FROM users u, courses c
       WHERE u.id = $1 AND c.id = $2`,
      [studentId, courseId]
    );
    if (rows.length) {
      const certUrl = `${process.env.FRONTEND_URL}/certificates/${certId}`;
      const tmpl = EmailTemplates.certificateIssued(rows[0].first_name, rows[0].title, certUrl);
      await sendEmail({ to: rows[0].email, ...tmpl });
    }
  }

  async getMyCertificates(studentId: string) {
    const { rows } = await query(
      `SELECT cert.id, cert.certificate_no, cert.issued_at, cert.pdf_url, cert.status,
              c.title AS course_title, c.slug AS course_slug,
              mf.cdn_url AS thumbnail_url
       FROM certificates cert
       JOIN courses c ON c.id = cert.course_id
       LEFT JOIN media_files mf ON mf.id = c.thumbnail_id
       WHERE cert.student_id = $1 AND cert.status = 'issued'
       ORDER BY cert.issued_at DESC`,
      [studentId]
    );
    return rows;
  }

  async verifyCertificate(certificateNo: string) {
    const { rows } = await query(
      `SELECT cert.certificate_no, cert.issued_at, cert.status,
              u.first_name || ' ' || u.last_name AS student_name,
              c.title AS course_title,
              ins_u.first_name || ' ' || ins_u.last_name AS instructor_name
       FROM certificates cert
       JOIN users u ON u.id = cert.student_id
       JOIN courses c ON c.id = cert.course_id
       JOIN instructors i ON i.id = c.instructor_id
       JOIN users ins_u ON ins_u.id = i.user_id
       WHERE cert.certificate_no = $1`,
      [certificateNo]
    );
    if (!rows.length) return { valid: false };
    return { valid: rows[0].status === 'issued', ...rows[0] };
  }

  async dropEnrollment(studentId: string, enrollmentId: string) {
    const { rows } = await query(
      `SELECT id FROM enrollments WHERE id = $1 AND student_id = $2 AND status = 'active'`,
      [enrollmentId, studentId]
    );
    if (!rows.length) throw AppError.notFound('Enrollment');
    await query(
      `UPDATE enrollments SET status = 'dropped', updated_at = NOW() WHERE id = $1`,
      [enrollmentId]
    );
    return { message: 'Enrollment dropped' };
  }
}

export const enrollmentService = new EnrollmentService();
