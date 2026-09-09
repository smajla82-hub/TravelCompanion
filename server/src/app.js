import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.js';
import { createTripRoutes } from './routes/trips.js';
import { createAuthRoutes } from './routes/auth.js';
import { createInvitationRoutes } from './routes/invitations.js';
import { config } from './config.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  const allowedOrigins = (config.corsOrigin ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(express.json({ limit: '1mb' }));

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );

  app.use(healthRoutes);
  app.use('/auth', createAuthRoutes());
  app.use('/invitations', createInvitationRoutes());
  app.use('/trips', createTripRoutes());

  app.use((error, _req, res, _next) => {
    const status = error.statusCode ?? 500;
    const message = error.message ?? 'Unexpected server error.';
    res.status(status).json({ error: message });
  });

  return app;
}

export default createApp();
