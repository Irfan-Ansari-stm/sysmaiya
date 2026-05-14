import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { globalLimiter } from './middleware/rateLimit.middleware';
import { errorHandler } from './utils/errors';
import { logger } from './utils/logger';
import routes from './routes';

const app = express();

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// Raw body for webhook signature verification
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── Request Logging ──────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use(globalLimiter);

// ─── Trust Proxy (for accurate IP behind load balancer) ──────────────────────
app.set('trust proxy', 1);

// ─── API Routes ───────────────────────────────────────────────────────────────
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
app.use(API_PREFIX, routes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
