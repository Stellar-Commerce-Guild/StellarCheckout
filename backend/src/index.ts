import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { migrate } from './db';
import { pollPendingPayments } from './stellar';
import { processWebhookQueue } from './webhooks';
import paymentsRouter from './routes/payments';
import webhooksRouter from './routes/webhooks';
import fxRouter from './routes/fx';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

app.use('/api/payments', paymentsRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/fx', fxRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

async function start() {
  await migrate();

  // Poll Stellar every 15 seconds
  setInterval(pollPendingPayments, 15_000);
  // Process webhook queue every 30 seconds
  setInterval(processWebhookQueue, 30_000);

  app.listen(PORT, () => console.log(`StellarCheckout API running on :${PORT}`));
}

start().catch(console.error);
