import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

const connectionString = process.env.DATABASE_URL || [
  'postgresql://',
  encodeURIComponent(process.env.DB_USER || 'postgres'),
  process.env.DB_PASSWORD ? `:${encodeURIComponent(process.env.DB_PASSWORD)}` : '',
  '@',
  process.env.DB_HOST || 'localhost',
  ':',
  process.env.DB_PORT || '5432',
  '/',
  process.env.DB_NAME || 'instructorstudiodb',
].join('');

const pool = new Pool({
  connectionString,
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  logger.error('Unexpected DB pool error', { error: err.message });
});

pool.on('connect', () => {
  logger.debug('New DB client connected');
});

// Query wrapper with logging
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn('Slow query detected', { text: text.substring(0, 100), duration });
    }
    return { rows: res.rows, rowCount: res.rowCount };
  } catch (err: any) {
    logger.error('Query error', { text: text.substring(0, 100), error: err.message });
    throw err;
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  await client.query('SELECT 1');
  client.release();
  logger.info('✅ Database connected successfully');
}

export default pool;
