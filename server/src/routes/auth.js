import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import * as repo from '../repositories/userRepository.js';

const router = express.Router();

function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

router.post('/register', (req, res) => {
  const { email, password } = req.body ?? {};
  const user = repo.createUser({ email, password });
  const token = issueToken(user);
  return res.status(201).json({ token, user: repo.toPublicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const user = repo.getUserByEmail(String(email ?? '').trim().toLowerCase());

  if (!user || !repo.verifyPassword(user, password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = issueToken(user);
  return res.json({ token, user: repo.toPublicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = repo.getUserById(req.user.id);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  return res.json(repo.toPublicUser(user));
});

export default router;
