import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { startPoller } from './poller.js';
import { apiRouter } from './routes/api.js';
import { sseRouter } from './routes/sse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use('/api', apiRouter);
app.use('/api', sseRouter);

// Serve built client in production
const clientDist = path.join(__dirname, '../../dist/client');
app.use(express.static(clientDist));
app.get('/*path', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

startPoller();

app.listen(config.port, () => {
  console.log(`PR Dashboard running at http://localhost:${config.port}`);
});
