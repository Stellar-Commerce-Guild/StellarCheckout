# Good First Issues

Welcome! These are well-scoped tasks ideal for first-time contributors. Each one has clear acceptance criteria and points to the relevant files.

---

## 🟢 Beginner (no Stellar knowledge required)

### 1. Add copy-to-clipboard button on checkout page

**File:** `frontend/src/pages/CheckoutPage.tsx`

The checkout page shows the payment memo. Add a small copy button next to it so users can copy the memo to their clipboard.

**Acceptance criteria:**
- Button copies `payment.memo` to clipboard
- Shows a "Copied!" confirmation for 2 seconds
- Accessible (keyboard focusable, has aria-label)

---

### 2. Add loading skeleton to dashboard table

**File:** `frontend/src/pages/DashboardPage.tsx`

While payments are loading, show a skeleton placeholder instead of a spinner.

**Acceptance criteria:**
- 5 skeleton rows visible during load
- Matches the table column layout
- Uses Tailwind `animate-pulse`

---

### 3. Add `GET /health` response to include DB status

**File:** `backend/src/index.ts`

The `/health` endpoint currently returns `{ status: 'ok' }`. Extend it to also check if the database is reachable.

**Acceptance criteria:**
- Runs `SELECT 1` against the DB
- Returns `{ status: 'ok', db: 'ok' }` on success
- Returns `{ status: 'degraded', db: 'error' }` if DB is unreachable (don't throw)

---

### 4. Validate Stellar address format on payment creation

**File:** `backend/src/routes/payments.ts`

The `destination` field accepts any 56-character string. Add proper Stellar address validation using the SDK.

**Acceptance criteria:**
- Use `StrKey.isValidEd25519PublicKey(destination)` from `@stellar/stellar-sdk`
- Return `400` with a clear error message if invalid
- Add a test case

---

### 5. Add `expires_at` countdown to checkout page

**File:** `frontend/src/pages/CheckoutPage.tsx`

Show a countdown timer on the checkout page so users know how long the payment link is valid.

**Acceptance criteria:**
- Displays time remaining (e.g., "Expires in 23h 45m")
- Updates every minute
- Shows "Expired" and disables the pay button when time runs out

---

## 🟡 Intermediate (some backend/Stellar knowledge helpful)

### 6. Add `GET /api/payments/:id/status` SSE endpoint

**Files:** `backend/src/routes/payments.ts`, `frontend/src/pages/CheckoutPage.tsx`

Replace the frontend's `setInterval` polling with Server-Sent Events for real-time status updates.

**Acceptance criteria:**
- `GET /api/payments/:id/status` streams events using SSE
- Frontend subscribes and updates UI on `payment.completed` event
- Connection closes automatically when payment reaches terminal state

---

### 7. Add webhook delivery history endpoint

**File:** `backend/src/routes/webhooks.ts`

Merchants need to see if their webhooks are being delivered.

**Acceptance criteria:**
- `GET /api/webhooks/:id/deliveries` returns last 50 delivery attempts
- Includes: `event`, `status_code`, `attempts`, `delivered_at`, `created_at`
- Requires auth

---

### 8. Add `PATCH /api/payments/:id/expire` endpoint

**File:** `backend/src/routes/payments.ts`

Allow merchants to manually expire a pending payment before its natural expiry.

**Acceptance criteria:**
- Only works on `pending` payments
- Requires auth (merchant must own the payment)
- Returns updated payment object

---

### 9. Add EUR and GBP to fiat display

**File:** `backend/src/fx.ts`, `backend/src/types.ts`

The FX service currently returns USD, NGN, EUR. Add GBP and BRL.

**Acceptance criteria:**
- `FxRates` type updated to include `GBP` and `BRL`
- CoinGecko query updated to fetch `gbp,brl`
- Fallback values added
- Frontend fiat display shows all 5 currencies

---

### 10. Write integration tests for payment creation flow

**File:** `backend/src/__tests__/payments.test.ts` (create this file)

**Acceptance criteria:**
- Uses Jest + supertest
- Tests: create payment → get payment → verify status is `pending`
- Mocks the database (or uses a test DB)
- Runs with `npm test` in the backend workspace

---

## How to Claim an Issue

1. Comment on the GitHub issue: "I'd like to work on this"
2. Fork the repo and create a branch: `fix/issue-number-short-description`
3. Open a draft PR early so others know it's in progress
4. Ask questions in the PR — we're happy to help

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution guide.
