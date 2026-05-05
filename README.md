# ⚡ StellarCheckout

**Open-source payment infrastructure for global commerce — powered by Stellar.**

Accept XLM and USDC payments from anywhere in the world. Instant settlement, near-zero fees, embeddable checkout, and a full REST API. Think Stripe Checkout, but built on Stellar.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built on Stellar](https://img.shields.io/badge/Built%20on-Stellar-black)](https://stellar.org)

---

## The Problem

Global payments are broken for most of the world:

- **Expensive** — cross-border wire fees eat 3–10% of every transaction
- **Slow** — international transfers take 2–5 business days
- **Fragmented** — merchants need different integrations per region
- **Exclusive** — 1.4 billion adults remain unbanked

## Why Stellar

Stellar solves all of this at the infrastructure level:

| Feature | Traditional | Stellar |
|---|---|---|
| Settlement time | 2–5 days | ~5 seconds |
| Transaction fee | $15–50 | $0.00001 |
| Availability | Business hours | 24/7/365 |
| Stablecoin support | Limited | Native USDC |

StellarCheckout builds a developer-friendly payment layer on top of Stellar — so any business can accept global payments without touching the complexity of blockchain directly.

---

## Features

- **Payment Links** — Generate `/pay/{id}` links, shareable anywhere
- **Hosted Checkout** — Stripe-quality UI with Freighter wallet connect and QR code
- **REST API** — Create payments, poll status, receive webhooks
- **Embeddable SDK** — Drop a checkout into any website in 3 lines of JS
- **Multi-currency display** — Show fiat equivalents (USD, NGN, EUR)
- **Webhook system** — Reliable delivery with exponential backoff retry
- **Merchant Dashboard** — Revenue overview, transaction history, filters
- **Real Stellar integration** — Memo-based tracking, Horizon polling, tx verification

---

## How It Works

```
Merchant creates payment  →  Shares /pay/{id} link
Customer opens link       →  Sees amount, QR code, fiat equivalent
Customer connects wallet  →  Freighter signs transaction with memo
Transaction submitted     →  Stellar settles in ~5 seconds
Merchant gets webhook     →  payment.completed event fired
```

---

## Quick Start (< 5 minutes)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- [Freighter wallet](https://freighter.app) (for testing payments)

### 1. Clone & install

```bash
git clone https://github.com/your-org/stellarcheckout.git
cd stellarcheckout
npm install
```

### 2. Configure backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/stellarcheckout
STELLAR_NETWORK=testnet
API_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
```

### 3. Start development

```bash
npm run dev
```

- API: http://localhost:3001
- Dashboard: http://localhost:5173
- Checkout: http://localhost:5173/pay/{payment_id}

---

## API Reference

All authenticated endpoints require:
```
Authorization: Bearer YOUR_API_SECRET
```

### Create a Payment

```bash
POST /api/payments
```

```json
{
  "amount": "10.00",
  "asset": "USDC",
  "description": "Order #1234",
  "destination": "GDESTINATION...",
  "expires_in_hours": 24
}
```

**Response:**
```json
{
  "payment": {
    "id": "uuid",
    "amount": "10.00",
    "asset": "USDC",
    "status": "pending",
    "memo": "abc123...",
    "expires_at": "2024-01-02T00:00:00Z"
  },
  "fiat": { "USD": "10.00", "NGN": "15800.00", "EUR": "9.20" },
  "checkout_url": "https://yourapp.com/pay/uuid"
}
```

### Get Payment Status

```bash
GET /api/payments/:id
```

### List Payments

```bash
GET /api/payments?status=completed&limit=20&offset=0
```

### Register Webhook

```bash
POST /api/webhooks
```

```json
{
  "url": "https://yourapp.com/webhooks/stellar",
  "events": ["payment.completed", "payment.failed"]
}
```

### Webhook Payload

```json
{
  "event": "payment.completed",
  "payment": {
    "id": "uuid",
    "tx_hash": "abc...",
    "ledger": 12345,
    "amount": "10.00",
    "asset": "USDC"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

Verify webhook authenticity:
```js
const signature = req.headers['x-stellarcheckout-signature'];
const expected = 'sha256=' + hmac('sha256', secret, body);
if (signature !== expected) return res.status(401).end();
```

---

## Embeddable SDK

### npm

```bash
npm install @stellarcheckout/sdk
```

```js
import { createCheckout } from '@stellarcheckout/sdk';

const checkout = createCheckout({
  apiUrl: 'https://api.yourapp.com',
  paymentId: 'payment-uuid',
  container: '#checkout-container',
  onSuccess: (txHash) => console.log('Paid!', txHash),
  onError: (err) => console.error(err),
});
```

### CDN / Script tag

```html
<script src="https://cdn.jsdelivr.net/npm/@stellarcheckout/sdk/dist/stellarcheckout.min.js"></script>
<script>
  StellarCheckout.openCheckoutModal({
    apiUrl: 'https://api.yourapp.com',
    paymentId: 'payment-uuid',
    onSuccess: (txHash) => alert('Payment complete: ' + txHash),
  });
</script>
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    StellarCheckout                       │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │   Frontend   │    │   Backend    │    │  Stellar  │  │
│  │  React/Vite  │◄──►│  Express API │◄──►│  Horizon  │  │
│  │  Tailwind    │    │  PostgreSQL  │    │  Network  │  │
│  └──────────────┘    └──────┬───────┘    └───────────┘  │
│                             │                           │
│  ┌──────────────┐    ┌──────▼───────┐                   │
│  │   JS SDK     │    │   Webhooks   │                   │
│  │  iframe/CDN  │    │  + Retry     │                   │
│  └──────────────┘    └──────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

**Payment flow:**
1. Merchant calls `POST /api/payments` → gets checkout URL
2. Customer opens URL → frontend loads payment details from API
3. Customer connects Freighter → frontend calls `POST /api/payments/:id/build-tx`
4. Backend builds unsigned Stellar transaction with memo
5. Freighter signs → frontend calls `POST /api/payments/:id/submit`
6. Backend submits to Horizon → updates DB → fires webhook
7. Horizon poller runs every 15s as fallback verification

---

## Deployment

### Docker Compose

```bash
cp backend/.env.example backend/.env
# edit backend/.env with production values
docker compose up -d
```

### Manual

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
# Serve dist/ with nginx or any static host
```

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `STELLAR_NETWORK` | `testnet` or `mainnet` | ✅ |
| `STELLAR_HORIZON_URL` | Horizon endpoint | ✅ |
| `API_SECRET` | API authentication key | ✅ |
| `FRONTEND_URL` | Frontend origin for CORS | ✅ |
| `WEBHOOK_SIGNING_SECRET` | Webhook HMAC secret | ✅ |

---

## Stellar Testnet

Get test XLM from the [Stellar Friendbot](https://friendbot.stellar.org/?addr=YOUR_ADDRESS).

Test USDC on testnet: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). All contributions welcome.

## Roadmap

See [ROADMAP.md](ROADMAP.md).

## License

MIT — see [LICENSE](LICENSE).

---

*Built with ❤️ for the Stellar ecosystem. Aligned with Stellar's mission of financial inclusion and borderless payments.*
