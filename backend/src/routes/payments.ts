import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { requireAuth, merchantId } from '../middleware/auth';
import { generateMemo, buildPaymentTransaction } from '../stellar';
import { getFxRates, convertAmount } from '../fx';
import { Payment } from '../types';

const router = Router();

const CreatePaymentSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,7})?$/),
  asset: z.enum(['XLM', 'USDC']).default('XLM'),
  description: z.string().max(200).optional(),
  destination: z.string().length(56),
  expires_in_hours: z.number().min(1).max(168).default(24),
});

// POST /api/payments — create a payment
router.post('/', requireAuth, async (req, res) => {
  const parsed = CreatePaymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { amount, asset, description, destination, expires_in_hours } = parsed.data;
  const id = uuidv4();
  const memo = generateMemo(id);
  const mid = merchantId(req);

  const { rows } = await db.query<Payment>(
    `INSERT INTO payments (id, merchant_id, amount, asset, description, memo, destination, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7, NOW() + $8::interval)
     RETURNING *`,
    [id, mid, amount, asset, description, memo, destination, `${expires_in_hours} hours`]
  );

  const payment = rows[0];
  const rates = await getFxRates();
  const fiat = convertAmount(amount, asset, rates);

  res.status(201).json({
    payment,
    fiat,
    checkout_url: `${process.env.FRONTEND_URL}/pay/${id}`,
  });
});

// GET /api/payments — list merchant payments
router.get('/', requireAuth, async (req, res) => {
  const mid = merchantId(req);
  const { status, limit = '20', offset = '0' } = req.query as Record<string, string>;

  const conditions = ['merchant_id=$1'];
  const params: any[] = [mid];

  if (status) {
    params.push(status);
    conditions.push(`status=$${params.length}`);
  }

  const { rows } = await db.query<Payment>(
    `SELECT * FROM payments WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, parseInt(limit), parseInt(offset)]
  );

  const { rows: [{ count }] } = await db.query(
    `SELECT COUNT(*) FROM payments WHERE ${conditions.join(' AND ')}`,
    params
  );

  res.json({ payments: rows, total: parseInt(count) });
});

// GET /api/payments/:id — get payment (public, for checkout page)
router.get('/:id', async (req, res) => {
  const { rows } = await db.query<Payment>(
    'SELECT * FROM payments WHERE id=$1', [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Payment not found' });

  const payment = rows[0];
  const rates = await getFxRates();
  const fiat = convertAmount(payment.amount, payment.asset as 'XLM' | 'USDC', rates);

  res.json({ payment, fiat });
});

// POST /api/payments/:id/build-tx — build unsigned transaction for Freighter
router.post('/:id/build-tx', async (req, res) => {
  const { sender_public_key } = req.body;
  if (!sender_public_key) return res.status(400).json({ error: 'sender_public_key required' });

  const { rows } = await db.query<Payment>('SELECT * FROM payments WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Payment not found' });

  const payment = rows[0];
  if (payment.status !== 'pending') {
    return res.status(400).json({ error: `Payment is ${payment.status}` });
  }

  try {
    const xdr = await buildPaymentTransaction(
      sender_public_key,
      payment.destination,
      payment.amount,
      payment.asset as 'XLM' | 'USDC',
      payment.memo
    );
    res.json({ xdr });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/:id/submit — submit signed transaction
router.post('/:id/submit', async (req, res) => {
  const { signed_xdr } = req.body;
  if (!signed_xdr) return res.status(400).json({ error: 'signed_xdr required' });

  const { rows } = await db.query<Payment>('SELECT * FROM payments WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Payment not found' });

  const payment = rows[0];
  if (payment.status !== 'pending') {
    return res.status(400).json({ error: `Payment is ${payment.status}` });
  }

  try {
    const { server, networkPassphrase } = await import('../stellar');
    const { TransactionBuilder } = await import('@stellar/stellar-sdk');
    const tx = TransactionBuilder.fromXDR(signed_xdr, networkPassphrase);
    const result = await server.submitTransaction(tx);

    await db.query(
      `UPDATE payments SET status='completed', tx_hash=$1, ledger=$2, updated_at=NOW() WHERE id=$3`,
      [result.hash, (result as any).ledger, payment.id]
    );

    const { dispatchWebhooks } = await import('../webhooks');
    const { rows: [updated] } = await db.query<Payment>('SELECT * FROM payments WHERE id=$1', [payment.id]);
    await dispatchWebhooks(updated, 'payment.completed');

    res.json({ success: true, tx_hash: result.hash });
  } catch (err: any) {
    await db.query(
      `UPDATE payments SET status='failed', updated_at=NOW() WHERE id=$1`,
      [payment.id]
    );
    res.status(500).json({ error: err.message });
  }
});

export default router;
