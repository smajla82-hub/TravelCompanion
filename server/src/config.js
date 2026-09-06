import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const DEV_ONLY_JWT_SECRET = 'dev-only-insecure-secret-change-me';
const INSECURE_JWT_SECRET_ALLOWED_ENVS = new Set(['development', 'test']);
const configuredInvitationExpiry = Number(process.env.INVITATION_EXPIRES_IN_DAYS || 7);
const configuredTripLockTtl = Number(process.env.TRIP_LOCK_TTL_MS || 120000);

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
};
