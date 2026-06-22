import { Router } from 'express';
import type { DashboardData } from '../../shared/types.js';
import { subscribe } from '../poller.js';

export const sseRouter = Router();

sseRouter.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const unsubscribe = subscribe((data: DashboardData) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });

  req.on('close', unsubscribe);
});
