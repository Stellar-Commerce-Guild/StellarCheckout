# StellarCheckout Roadmap

This roadmap reflects the project's direction. Items are not promises — they reflect priorities based on community feedback and ecosystem needs.

---

## ✅ v1.0 — Foundation (Current)

- [x] Payment link generation (`/pay/:id`)
- [x] Hosted checkout UI (Freighter wallet, QR code, fiat display)
- [x] REST API (create, get, list payments)
- [x] Stellar SDK integration (XLM + USDC, memo tracking, Horizon polling)
- [x] Webhook system with exponential backoff retry
- [x] Merchant dashboard (stats, filters, transaction history)
- [x] Embeddable JS SDK (iframe, modal, CDN)
- [x] Multi-currency fiat display (USD, NGN, EUR)

---

## 🔨 v1.1 — Reliability & DX

- [ ] **Path payments** — customer pays XLM, merchant receives USDC (Stellar DEX)
- [ ] **Payment expiration cron** — dedicated job instead of inline polling
- [ ] **Idempotency keys** on payment creation
- [ ] **Pagination cursor** on list endpoint
- [ ] **Webhook delivery logs** endpoint (`GET /api/webhooks/:id/deliveries`)
- [ ] **Docker Compose** setup for one-command local dev
- [ ] **OpenAPI spec** (auto-generated from Zod schemas)

---

## 🚀 v1.2 — Merchant Features

- [ ] **Multi-merchant auth** — API key per merchant stored in DB
- [ ] **Refund flow** — initiate refund via API, tracked in DB
- [ ] **Payment metadata** — arbitrary key/value attached to payments
- [ ] **Email notifications** — merchant email on payment.completed
- [ ] **Checkout customization** — merchant logo, brand color via API
- [ ] **Batch payment creation** — create multiple payments in one request

---

## 🌍 v1.3 — Ecosystem & Integrations

- [ ] **WooCommerce plugin** — WordPress/WooCommerce payment gateway
- [ ] **Shopify app** — Shopify checkout integration
- [ ] **React component library** — `@stellarcheckout/react` with `<CheckoutButton />`
- [ ] **Soroban smart contract** — on-chain escrow for trustless payments
- [ ] **Stellar Anchor integration** — on/off ramp via SEP-24
- [ ] **More fiat currencies** — BRL, KES, GHS, ZAR

---

## 🔐 v2.0 — Enterprise

- [ ] **Multi-signature support** — require M-of-N signers for large payments
- [ ] **Fraud detection** — velocity checks, address screening
- [ ] **Compliance hooks** — KYC/AML integration points
- [ ] **Audit log** — immutable event log per merchant
- [ ] **SLA webhooks** — guaranteed delivery with dead-letter queue
- [ ] **Self-hosted Horizon** — guide for running your own Horizon node

---

## Ideas Under Consideration

- Subscription / recurring payments via Stellar claimable balances
- Payment splitting (split a payment across multiple destinations)
- Stellar Quest integration for developer onboarding
- Mobile SDK (React Native)

---

## How to Influence the Roadmap

Open an issue with the `roadmap` label. Items with the most community interest get prioritized. PRs for roadmap items are always welcome.
