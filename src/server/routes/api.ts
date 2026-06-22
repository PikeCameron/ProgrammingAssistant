import { Router } from 'express';
import { getLatest } from '../poller.js';

export const apiRouter = Router();

apiRouter.get('/data', (_req, res) => {
  const data = getLatest();
  if (!data) {
    res.status(503).json({ error: 'Data not yet available, please retry shortly.' });
    return;
  }
  res.json(data);
});
