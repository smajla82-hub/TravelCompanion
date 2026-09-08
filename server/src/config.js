import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const DEV_ONLY_JWT_SECRET = 'dev-only-insecure-secret-change-me';
const INSECURE_JWT_SECRET_ALLOWED_ENVS = new Set(['development', 'test']);
const configuredInvitationExpiry = Number(process.env.INVITATION_EXPIRES_IN_DAYS || 7);
const configuredTripLockTtl = Number(process.env.TRIP_LOCK_TTL_MS || 120000);
const configuredPasswordResetExpiry = Number(process.env.PASSWORD_RESET_EXPIRES_IN_MINUTES || 60);

if (
  !INSECURE_JWT_SECRET_ALLOWED_ENVS.has(nodeEnv) &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEV_ONLY_JWT_SECRET)
) {
  throw new Error(
    `JWT_SECRET must be set to a strong, random value when NODE_ENV is not one of: ${Array.from(INSECURE_JWT_SECRET_ALLOWED_ENVS).join(', ')}. Refusing to start with an insecure or missing secret.`,
  );
}

export const config = {
  port: Number(process.env.PORT || 3001),
  dbPath: process.env.DB_PATH
    ? path.resolve(process.cwd(), process.env.DB_PATH)
    : path.resolve(process.cwd(), 'data', 'travel-companion.db'),
  corsOrigin: process.env.ALLOWED_CORS_ORIGIN || 'https://smajla82-hub.github.io',
  nodeEnv,
  jwtSecret: process.env.JWT_SECRET || DEV_ONLY_JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  invitationExpiresInDays: Number.isFinite(configuredInvitationExpiry) && configuredInvitationExpiry > 0
    ? configuredInvitationExpiry
    : 7,
  tripLockTtlMs: Number.isFinite(configuredTripLockTtl) && configuredTripLockTtl > 0
    ? configuredTripLockTtl
    : 120000,
  passwordResetExpiresInMinutes: Number.isFinite(configuredPasswordResetExpiry) && configuredPasswordResetExpiry > 0
    ? configuredPasswordResetExpiry
    : 60,
  // The frontend origin (including any sub-path, no trailing slash) used to
  // build the password reset link sent by email. Falls back to the
  // production GitHub Pages deployment so a missing/unset value in
  // production still points somewhere real instead of `undefined/...`.
  appBaseUrl: (process.env.APP_BASE_URL || 'https://smajla82-hub.github.io/TravelCompanion').replace(/\/+$/, ''),
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Travel Companion <no-reply@travel-companion.local>',
  },
};
