import { Pool } from 'pg';

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id   TEXT NOT NULL,
  amount        NUMERIC(20, 7) NOT NULL,
  asset         TEXT NOT NULL DEFAULT 'XLM',
  description   TEXT,
  memo          TEXT UNIQUE NOT NULL,
  destination   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','expired')),
  tx_hash       TEXT,
  ledger        INTEGER,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id   TEXT NOT NULL,
  url           TEXT NOT NULL,
  secret        TEXT NOT NULL,
  events        TEXT[] NOT NULL DEFAULT ARRAY['payment.completed','payment.failed'],
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id    UUID NOT NULL REFERENCES webhooks(id),
  payment_id    UUID NOT NULL REFERENCES payments(id),
  event         TEXT NOT NULL,
  status_code   INTEGER,
  attempts      INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  delivered_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_merchant ON payments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_memo ON payments(memo);
CREATE INDEX IF NOT EXISTS idx_webhooks_merchant ON webhooks(merchant_id);
`;

export async function migrate() {
  await db.query(SCHEMA);
  console.log('Database migrated');
}
