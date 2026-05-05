import crypto from 'crypto';
import axios from 'axios';
import { db } from './db';
import { Payment } from './types';

export function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export async function dispatchWebhooks(payment: Payment, event: string) {
  const { rows: webhooks } = await db.query(
    `SELECT * FROM webhooks WHERE merchant_id=$1 AND active=true AND $2=ANY(events)`,
    [payment.merchant_id, event]
  );

  for (const wh of webhooks) {
    await db.query(
      `INSERT INTO webhook_deliveries (webhook_id, payment_id, event, next_retry_at)
       VALUES ($1, $2, $3, NOW())`,
      [wh.id, payment.id, event]
    );
  }
}

export async function processWebhookQueue() {
  const { rows } = await db.query(`
    SELECT wd.*, w.url, w.secret
    FROM webhook_deliveries wd
    JOIN webhooks w ON w.id = wd.webhook_id
    JOIN payments p ON p.id = wd.payment_id
    WHERE wd.delivered_at IS NULL
      AND wd.attempts < 5
      AND (wd.next_retry_at IS NULL OR wd.next_retry_at <= NOW())
  `);

  for (const delivery of rows) {
    const { rows: [payment] } = await db.query(
      'SELECT * FROM payments WHERE id=$1', [delivery.payment_id]
    );

    const payload = JSON.stringify({
      event: delivery.event,
      payment,
      timestamp: new Date().toISOString(),
    });

    const signature = signPayload(payload, delivery.secret);

    try {
      const res = await axios.post(delivery.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-StellarCheckout-Signature': `sha256=${signature}`,
          'X-StellarCheckout-Event': delivery.event,
        },
        timeout: 10000,
      });

      await db.query(
        `UPDATE webhook_deliveries SET status_code=$1, attempts=attempts+1, delivered_at=NOW() WHERE id=$2`,
        [res.status, delivery.id]
      );
    } catch (err: any) {
      const attempt = delivery.attempts + 1;
      // Exponential backoff: 1m, 5m, 30m, 2h, 8h
      const delays = [1, 5, 30, 120, 480];
      const nextDelay = delays[Math.min(attempt, delays.length - 1)];

      await db.query(
        `UPDATE webhook_deliveries
         SET attempts=$1, status_code=$2, next_retry_at=NOW() + $3::interval
         WHERE id=$4`,
        [attempt, err.response?.status ?? null, `${nextDelay} minutes`, delivery.id]
      );
    }
  }
}
