import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { RATE_LIMIT_WINDOW_MS } from '../middleware/rateLimitWindow.js';
import * as repo from '../repositories/userRepository.js';

const router = express.Router();

// Register/login are brute-force targets; limit each IP to a small number of
// attempts per window. `/me` is read-only and already requires a valid JWT,
// so it uses the more permissive general limiter applied below.
const authAttemptLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const meLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

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

export default router;
