import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { db } from '../db';
import { requireAuth, merchantId } from '../middleware/auth';

const router = Router();

const WebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(['payment.completed', 'payment.failed'])).min(1),
});

router.post('/', requireAuth, async (req, res) => {
  const parsed = WebhookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const mid = merchantId(req);
  const secret = crypto.randomBytes(32).toString('hex');

  const { rows } = await db.query(
    `INSERT INTO webhooks (id, merchant_id, url, secret, events)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [uuidv4(), mid, parsed.data.url, secret, parsed.data.events]
  );

  res.status(201).json({ webhook: rows[0], signing_secret: secret });
});

router.get('/', requireAuth, async (req, res) => {
  const mid = merchantId(req);
  const { rows } = await db.query(
    'SELECT id, merchant_id, url, events, active, created_at FROM webhooks WHERE merchant_id=$1',
    [mid]
  );
  res.json({ webhooks: rows });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const mid = merchantId(req);
  await db.query(
    'UPDATE webhooks SET active=false WHERE id=$1 AND merchant_id=$2',
    [req.params.id, mid]
  );
  res.json({ success: true });
});

export default router;
