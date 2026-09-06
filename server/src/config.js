import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3001),
  dbPath: process.env.DB_PATH
    ? path.resolve(process.cwd(), process.env.DB_PATH)
    : path.resolve(process.cwd(), 'data', 'travel-companion.db'),
  corsOrigin: process.env.ALLOWED_CORS_ORIGIN || 'https://smajla82-hub.github.io',
  nodeEnv: process.env.NODE_ENV || 'development',
};
