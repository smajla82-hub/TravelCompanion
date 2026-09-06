import express from 'express';

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'travel-companion-api',
    timestamp: new Date().toISOString(),
  });
});

export default router;
