import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { RATE_LIMIT_WINDOW_MS } from '../middleware/rateLimitWindow.js';
import * as repo from '../repositories/userRepository.js';
import * as passwordResets from '../repositories/passwordResetRepository.js';
import { sendPasswordResetEmail } from '../services/mailer.js';

const router = express.Router();

// Register/login are brute-force targets; limit each IP to a small number of
// attempts per window. `/me` is read-only and already requires a valid JWT,
// so it uses the more permissive general limiter applied below.
const authAttemptLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please wait a moment and try again.' },
});

const meLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
});

// Requesting a reset sends an email, which is more expensive/abusable than a
// failed login attempt, so it gets its own, stricter limiter.
const forgotPasswordLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests. Please wait a moment and try again.' },
});

const GENERIC_FORGOT_PASSWORD_MESSAGE =
  'If an account exists for that email address, a password reset link has been sent.';

function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

router.post('/register', authAttemptLimiter, (req, res) => {
  const { email, password } = req.body ?? {};
  const user = repo.createUser({ email, password });
  const token = issueToken(user);
  return res.status(201).json({ token, user: repo.toPublicUser(user) });
});

router.post('/login', authAttemptLimiter, (req, res) => {
  const { email, password } = req.body ?? {};
  const user = repo.getUserByEmail(String(email ?? '').trim().toLowerCase());

  if (!user || !repo.verifyPassword(user, password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = issueToken(user);
  return res.json({ token, user: repo.toPublicUser(user) });
});

router.get('/me', meLimiter, requireAuth, (req, res) => {
  const user = repo.getUserById(req.user.id);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  return res.json(repo.toPublicUser(user));
});

router.put('/profile', meLimiter, requireAuth, (req, res) => {
  const { displayName } = req.body ?? {};
  const user = repo.updateDisplayName(req.user.id, displayName);
  return res.json(repo.toPublicUser(user));
});

// Always responds with the same generic message regardless of whether the
// email address matches an account, so this endpoint cannot be used to
// enumerate registered users. The email itself (if any) is sent
// best-effort; a delivery failure still returns the generic success message.
router.post('/forgot-password', forgotPasswordLimiter, (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const user = email ? repo.getUserByEmail(email) : null;

  const respondGeneric = () => res.json({ message: GENERIC_FORGOT_PASSWORD_MESSAGE });

  if (!user) {
    return respondGeneric();
  }

  const expiresAt = new Date(
    Date.now() + config.passwordResetExpiresInMinutes * 60 * 1000,
  ).toISOString();
  const resetToken = passwordResets.createResetToken(user.id, expiresAt);
  const resetLink = `${config.appBaseUrl}/reset-password/${resetToken.token}`;

  return sendPasswordResetEmail(user.email, resetLink, config.passwordResetExpiresInMinutes)
    .catch(() => undefined)
    .then(respondGeneric);
});

router.post('/reset-password', authAttemptLimiter, (req, res) => {
  const { token, password } = req.body ?? {};
  const resetToken = token ? passwordResets.getValidResetToken(String(token)) : null;

  if (!resetToken) {
    return res.status(400).json({ error: 'This password reset link is invalid or has expired.' });
  }

  repo.updatePasswordHash(resetToken.userId, password);
  passwordResets.markResetTokenUsed(resetToken.id);

  return res.json({ message: 'Password updated successfully. You can now log in with your new password.' });
});

export default router;
