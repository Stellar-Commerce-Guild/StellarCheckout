# Contributing to StellarCheckout

Thank you for your interest in contributing! StellarCheckout is open-source infrastructure for global payments on Stellar, and every contribution matters.

---

## Ways to Contribute

- **Bug reports** — Open an issue with reproduction steps
- **Feature requests** — Open an issue describing the use case
- **Code** — Fix bugs, implement features from the roadmap
- **Documentation** — Improve guides, add examples, fix typos
- **Testing** — Add test coverage, report edge cases

---

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Git

### Steps

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/stellarcheckout.git
cd stellarcheckout

# Install all dependencies
npm install

# Set up backend config
cp backend/.env.example backend/.env
# Edit backend/.env with your local PostgreSQL URL and a test API_SECRET

# Start everything
npm run dev
```

The API runs on `:3001`, the frontend on `:5173`.

---

## Project Structure

```
stellarcheckout/
├── backend/src/
│   ├── index.ts          # Express app entry
│   ├── db.ts             # PostgreSQL + schema
│   ├── stellar.ts        # Stellar SDK integration
│   ├── fx.ts             # FX rate fetching
│   ├── webhooks.ts       # Webhook delivery + retry
│   ├── middleware/auth.ts
│   └── routes/           # payments, webhooks, fx
├── frontend/src/
│   ├── pages/            # CheckoutPage, DashboardPage, CreatePaymentPage
│   ├── components/       # StatusBadge, etc.
│   ├── hooks/            # useFreighter
│   └── api.ts            # Axios API client
└── sdk/src/
    └── index.ts          # Embeddable checkout SDK
```

---

## Submitting a Pull Request

1. **Branch** from `main`: `git checkout -b feat/your-feature`
2. **Write focused commits** — one logical change per commit
3. **Test your changes** — run `npm test` and verify manually
4. **Update docs** if your change affects the API or setup
5. **Open a PR** with a clear title and description

### PR Title Format

```
feat: add path payment support
fix: correct memo encoding for UUIDs with dashes
docs: add webhook verification example
chore: upgrade stellar-sdk to 13.x
```

---

## Code Style

- TypeScript strict mode — no `any` unless unavoidable
- Zod for all request validation
- No external state management libraries in frontend (React state is fine)
- Keep files focused — one concern per file

---

## Reporting Bugs

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Node.js version, OS

---

## Security Issues

Do **not** open a public issue for security vulnerabilities. Email `security@stellarcheckout.dev` instead.

---

## Good First Issues

See [GOOD_FIRST_ISSUES.md](GOOD_FIRST_ISSUES.md) for beginner-friendly tasks.

---

## License

By contributing, you agree your contributions will be licensed under the MIT License.
