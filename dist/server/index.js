import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { startPoller } from './poller.js';
import { apiRouter } from './routes/api.js';
import { sseRouter } from './routes/sse.js';
import { reviewRouter } from './routes/review.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use('/api', apiRouter);
app.use('/api', sseRouter);
app.use('/api/review', reviewRouter);
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
