import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { AppError } from '../utils/errors';

export class CareerService {
  async listJobs(params: { department?: string; type?: string; is_remote?: boolean; page: number; limit: number }) {
    const { department, type, is_remote, page, limit } = params;
    const offset = (page - 1) * limit;
    const conditions = ["jp.status = 'open'"];
    const vals: any[] = [];
    let idx = 1;

    if (department) { conditions.push(`d.name ILIKE $${idx}`); vals.push(`%${department}%`); idx++; }
    if (type) { conditions.push(`jp.job_type = $${idx}`); vals.push(type); idx++; }
    if (is_remote !== undefined) { conditions.push(`jp.is_remote = $${idx}`); vals.push(is_remote); idx++; }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await query(
      `SELECT jp.id, jp.title, jp.slug, jp.job_type, jp.location, jp.is_remote,
              jp.experience_min, jp.experience_max, jp.salary_min, jp.salary_max,
              jp.salary_currency, jp.application_deadline, jp.total_openings,
              jp.published_at, d.name AS department_name
       FROM job_postings jp
       LEFT JOIN departments d ON d.id = jp.department_id
       ${where}
       ORDER BY jp.published_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...vals, limit, offset]
    );

    const { rows: countRows } = await query(
      `SELECT COUNT(*) FROM job_postings jp LEFT JOIN departments d ON d.id=jp.department_id ${where}`, vals
    );

    return { jobs: rows, total: parseInt(countRows[0].count), page, limit };
  }

  async getJob(slug: string) {
    const { rows } = await query(
      `SELECT jp.*, d.name AS department_name
       FROM job_postings jp LEFT JOIN departments d ON d.id = jp.department_id
       WHERE jp.slug = $1`,
      [slug]
    );
    if (!rows.length) throw AppError.notFound('Job posting');
    return rows[0];
  }

  async createJob(postedBy: string, data: any) {
    const id = uuidv4();
    let slug = slugify(data.title, { lower: true, strict: true });
    const { rows: ex } = await query(`SELECT id FROM job_postings WHERE slug LIKE $1`, [`${slug}%`]);
    if (ex.length) slug = `${slug}-${Date.now()}`;

    await query(
      `INSERT INTO job_postings (id, department_id, posted_by, title, slug, description,
        responsibilities, requirements, benefits, location, is_remote, job_type,
        experience_min, experience_max, salary_min, salary_max, salary_currency,
        application_deadline, total_openings, status, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
         CASE WHEN $20 = 'open' THEN NOW() ELSE NULL END)`,
      [id, data.department_id || null, postedBy, data.title, slug, data.description,
       data.responsibilities || [], data.requirements || [], data.benefits || [],
       data.location || null, data.is_remote, data.job_type,
       data.experience_min, data.experience_max || null,
       data.salary_min || null, data.salary_max || null, data.salary_currency,
       data.application_deadline || null, data.total_openings, data.status]
    );
    return { id, slug };
  }

  async updateJob(jobId: string, data: Partial<any>) {
    const allowed = ['title', 'description', 'status', 'responsibilities', 'requirements',
                     'benefits', 'location', 'is_remote', 'salary_min', 'salary_max',
                     'application_deadline', 'total_openings'];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (!fields.length) return { message: 'No changes' };

    const sets = fields.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const vals = fields.map(k => (data as any)[k]);
    await query(`UPDATE job_postings SET ${sets}, updated_at = NOW() WHERE id = $1`, [jobId, ...vals]);
    return { message: 'Job updated' };
  }

  async deleteJob(jobId: string) {
    await query(`DELETE FROM job_postings WHERE id = $1`, [jobId]);
    return { message: 'Job deleted' };
  }

  async applyJob(jobId: string, applicantId: string, resumeId: string | null, data: any) {
    const { rows: jobRows } = await query(`SELECT id FROM job_postings WHERE id=$1 AND status='open'`, [jobId]);
    if (!jobRows.length) throw AppError.notFound('Job posting');

    const { rows: existing } = await query(
      `SELECT id FROM job_applications WHERE job_id=$1 AND applicant_id=$2`, [jobId, applicantId]
    );
    if (existing.length) throw AppError.conflict('Already applied to this job');

    const id = uuidv4();
    await query(
      `INSERT INTO job_applications (id, job_id, applicant_id, resume_id, cover_letter,
        portfolio_url, linkedin_url, expected_salary, notice_period_days)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, jobId, applicantId, resumeId, data.cover_letter || null,
       data.portfolio_url || null, data.linkedin_url || null,
       data.expected_salary || null, data.notice_period_days || null]
    );
    return { id, message: 'Application submitted' };
  }

  async listApplications(params: { job_id?: string; status?: string; page: number; limit: number }) {
    const { job_id, status, page, limit } = params;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const vals: any[] = [];
    let idx = 1;

    if (job_id) { conditions.push(`ja.job_id = $${idx}`); vals.push(job_id); idx++; }
    if (status) { conditions.push(`ja.status = $${idx}`); vals.push(status); idx++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT ja.id, ja.status, ja.created_at, ja.expected_salary,
              u.first_name || ' ' || u.last_name AS applicant_name,
              u.email AS applicant_email, u.avatar_url,
              jp.title AS job_title
       FROM job_applications ja
       JOIN users u ON u.id = ja.applicant_id
       JOIN job_postings jp ON jp.id = ja.job_id
       ${where}
       ORDER BY ja.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...vals, limit, offset]
    );

    const { rows: countRows } = await query(
      `SELECT COUNT(*) FROM job_applications ja ${where}`, vals
    );

    return { applications: rows, total: parseInt(countRows[0].count), page, limit };
  }

  async updateApplicationStatus(appId: string, status: string, reviewedBy: string) {
    const valid = ['screening', 'interview', 'offered', 'rejected', 'withdrawn'];
    if (!valid.includes(status)) throw AppError.badRequest('Invalid status');

    await query(
      `UPDATE job_applications SET status=$1, reviewed_by=$2, updated_at=NOW() WHERE id=$3`,
      [status, reviewedBy, appId]
    );
    return { message: 'Application updated' };
  }

  async getDepartments() {
    const { rows } = await query(`SELECT id, name, description FROM departments WHERE is_active=true ORDER BY name`);
    return rows;
  }
}

export const careerService = new CareerService();
