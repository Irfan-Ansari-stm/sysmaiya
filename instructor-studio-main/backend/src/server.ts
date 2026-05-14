import 'dotenv/config';
import app from './app';
import { testConnection } from './config/database';
import { testRedisConnection } from './config/redis';
import { logger } from './utils/logger';

const PORT = parseInt(process.env.PORT || '4000');

async function bootstrap() {
  try {
    // Verify connections
    await testConnection();
    await testRedisConnection();

    const server = app.listen(PORT, () => {
      logger.info(`🚀 InstructorStudio API running on port ${PORT}`);
      logger.info(`📡 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API: http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Could not close connections in time, forcing shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception', { error: err.message, stack: err.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', { reason });
    });

  } catch (err: any) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

bootstrap();
