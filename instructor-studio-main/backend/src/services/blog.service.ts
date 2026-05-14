import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { AppError } from '../utils/errors';

export class BlogService {
  async listPosts(params: { category?: string; tag?: string; search?: string; page: number; limit: number }) {
    const { category, tag, search, page, limit } = params;
    const offset = (page - 1) * limit;
    const conditions = ["bp.status = 'published'"];
    const vals: any[] = [];
    let idx = 1;

    if (category) { conditions.push(`bp.category = $${idx}`); vals.push(category); idx++; }
    if (search) { conditions.push(`(bp.title ILIKE $${idx} OR bp.excerpt ILIKE $${idx})`); vals.push(`%${search}%`); idx++; }
    if (tag) { conditions.push(`EXISTS (SELECT 1 FROM blog_tags bt JOIN tags t ON t.id=bt.tag_id WHERE bt.post_id=bp.id AND t.slug=$${idx})`); vals.push(tag); idx++; }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await query(
      `SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.category, bp.view_count,
              bp.read_time_min, bp.published_at, bp.is_featured,
              mf.cdn_url AS thumbnail_url,
              u.first_name || ' ' || u.last_name AS author_name,
              u.avatar_url AS author_avatar,
              ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
       FROM blog_posts bp
       JOIN users u ON u.id = bp.author_id
       LEFT JOIN media_files mf ON mf.id = bp.thumbnail_id
       LEFT JOIN blog_tags bt ON bt.post_id = bp.id
       LEFT JOIN tags t ON t.id = bt.tag_id
       ${where}
       GROUP BY bp.id, mf.cdn_url, u.first_name, u.last_name, u.avatar_url
       ORDER BY bp.published_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...vals, limit, offset]
    );

    const { rows: countRows } = await query(
      `SELECT COUNT(*) FROM blog_posts bp ${where}`, vals
    );

    return { posts: rows, total: parseInt(countRows[0].count), page, limit };
  }

  async getPost(slug: string) {
    const { rows } = await query(
      `SELECT bp.*, mf.cdn_url AS thumbnail_url,
              u.first_name || ' ' || u.last_name AS author_name,
              u.avatar_url AS author_avatar, u.bio AS author_bio,
              ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
       FROM blog_posts bp
       JOIN users u ON u.id = bp.author_id
       LEFT JOIN media_files mf ON mf.id = bp.thumbnail_id
       LEFT JOIN blog_tags bt ON bt.post_id = bp.id
       LEFT JOIN tags t ON t.id = bt.tag_id
       WHERE bp.slug = $1 AND bp.status = 'published'
       GROUP BY bp.id, mf.cdn_url, u.first_name, u.last_name, u.avatar_url, u.bio`,
      [slug]
    );
    if (!rows.length) throw AppError.notFound('Blog post');

    // Increment view count
    await query(`UPDATE blog_posts SET view_count = view_count + 1 WHERE slug = $1`, [slug]);
    return rows[0];
  }

  async createPost(authorId: string, data: any) {
    const id = uuidv4();
    let slug = slugify(data.title, { lower: true, strict: true });
    const { rows: ex } = await query(`SELECT id FROM blog_posts WHERE slug LIKE $1`, [`${slug}%`]);
    if (ex.length) slug = `${slug}-${ex.length}`;

    const wordCount = (data.content || '').split(' ').length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    await query(
      `INSERT INTO blog_posts (id, author_id, title, slug, excerpt, content, category,
        status, scheduled_at, meta_title, meta_description, read_time_min,
        published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
         CASE WHEN $8 = 'published' THEN NOW() ELSE NULL END)`,
      [id, authorId, data.title, slug, data.excerpt || null, data.content,
       data.category, data.status, data.scheduled_at || null,
       data.meta_title || null, data.meta_description || null, readTime]
    );

    // Link tags
    if (data.tag_ids?.length) {
      for (const tagId of data.tag_ids) {
        await query(
          `INSERT INTO blog_tags (post_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [id, tagId]
        );
      }
    }

    return { id, slug };
  }

  async updatePost(postId: string, authorId: string, roles: string[], data: any) {
    if (!roles.includes('admin') && !roles.includes('super_admin')) {
      const { rows } = await query(`SELECT id FROM blog_posts WHERE id=$1 AND author_id=$2`, [postId, authorId]);
      if (!rows.length) throw AppError.forbidden('You do not own this post');
    }

    const fields: string[] = [];
    const vals: any[] = [postId];
    let idx = 2;
    const allowed = ['title', 'excerpt', 'content', 'category', 'status', 'meta_title', 'meta_description', 'is_featured'];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        vals.push(data[key]); idx++;
      }
    }
    if (data.status === 'published') {
      fields.push(`published_at = NOW()`);
    }

    if (fields.length) {
      await query(`UPDATE blog_posts SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $1`, vals);
    }
    return { message: 'Post updated' };
  }

  async deletePost(postId: string) {
    await query(`DELETE FROM blog_posts WHERE id = $1`, [postId]);
    return { message: 'Post deleted' };
  }

  async getComments(postId: string) {
    const { rows } = await query(
      `SELECT bc.id, bc.content, bc.parent_id, bc.created_at,
              u.id AS author_id,
              u.first_name || ' ' || u.last_name AS author_name,
              u.avatar_url AS author_avatar
       FROM blog_comments bc
       JOIN users u ON u.id = bc.author_id
       WHERE bc.post_id = $1 AND bc.is_approved = true
       ORDER BY bc.created_at ASC`,
      [postId]
    );
    return rows;
  }

  async addComment(postId: string, authorId: string, data: { content: string; parent_id?: string }) {
    const id = uuidv4();
    await query(
      `INSERT INTO blog_comments (id, post_id, author_id, content, parent_id, is_approved)
       VALUES ($1,$2,$3,$4,$5, true)`,
      [id, postId, authorId, data.content, data.parent_id || null]
    );
    return { id };
  }

  async moderateComment(commentId: string, approved: boolean) {
    await query(`UPDATE blog_comments SET is_approved = $1 WHERE id = $2`, [approved, commentId]);
    return { message: approved ? 'Comment approved' : 'Comment rejected' };
  }

  async getTags() {
    const { rows } = await query(`SELECT id, name, slug FROM tags ORDER BY name`);
    return rows;
  }

  async createTag(name: string) {
    const id = await query(
      `INSERT INTO tags (name, slug) VALUES ($1,$2) ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
      [name, slugify(name, { lower: true, strict: true })]
    );
    return { id: id.rows[0].id };
  }
}

export const blogService = new BlogService();
