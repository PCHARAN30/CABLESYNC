# CableSync v2

A lightweight web app for a single cable operator to manage customers and payments — Khatabook + Contacts, not a full accounting suite.

This build covers **Phase 1–8** of the roadmap: project setup, MongoDB models, backend REST APIs, dashboard, live customer search/list, customer profile, payment history, and the new-payment flow. Phases 9–11 (richer reports, deployment) are the natural next steps — due-status logic itself is already implemented (see below).

## What's included

- **Backend**: Express + Mongoose, fully working REST API for customers, payments, and search.
- **Frontend**: Vite + React + Tailwind scaffold, PIN-gated, with a placeholder dashboard that fetches real data from the backend.
- **PIN gate** (moved up from "Future Enhancements"): a single shared operator PIN, checked on every API request via the `x-operator-pin` header. Not full authentication, but it stops a public URL from being wide open to anyone who finds the link.
- **Soft deletes** on both customers and payments: nothing is hard-deleted by default, so financial records and customer history survive mistakes. Customers get an `isActive` flag; payments get a `deletedAt` timestamp.

## Getting started

### Backend

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI to your MongoDB Atlas connection string,
# and set OPERATOR_PIN to whatever PIN you want the operator to use
npm install
npm run dev
```

Server runs on `http://localhost:5000` by default. Check `/health` (no PIN needed) to confirm it's up.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs on `http://localhost:5173`. It'll prompt for the PIN on first load — enter whatever you set as `OPERATOR_PIN` in the backend's `.env`.

## API reference

All routes except `/health` require the `x-operator-pin` header.

### Customers
| Method | Route | Notes |
|---|---|---|
| GET | `/customers` | Active customers only. `?includeInactive=true` for all. |
| GET | `/customers/:id` | Single customer. |
| GET | `/customers/:id/due-status` | Computed live via the ledger model — see "Payment logic" below. Returns `{ status, balance, arrears, monthsAdvance, paidThroughDate, lastPayment }`. |
| GET | `/customers/:id/activity` | Auto-generated system notes for this customer (payments and edits) — see "Automatic activity log" below. |
| POST | `/customers` | Create. `serialNumber` must be unique. |
| PUT | `/customers/:id` | Update. |
| DELETE | `/customers/:id` | Soft delete by default (sets `isActive: false`). `?hard=true` for permanent delete. |

### Payments
| Method | Route | Notes |
|---|---|---|
| POST | `/payments` | Create. Also flips the customer's cached `status` to `PAID`. |
| GET | `/payments/customer/:id` | History for one customer. `?year=2026` to filter. |
| GET | `/payments/today` | Powers the "Today's Collection" dashboard card. |
| DELETE | `/payments/:id` | Soft delete (sets `deletedAt`), never a hard delete. |

### Search
| Method | Route | Notes |
|---|---|---|
| GET | `/search?q=` | Regex match across name, phone, CAF, address, serial number, PON. Fragment matching, so partial phone numbers work. |

## Payment logic (ledger model)

The original "check the last payment's month" approach had a real bug: a customer with zero payments who signed up this month showed as PAID (nothing to be behind on yet), while the customer list's cached status defaulted to DUE for the same customer — two different screens disagreeing about the same person. It's fixed now by replacing that check with a running balance:

```
totalBilled = monthsSinceSignup × monthlyFee
balance = totalPaid − totalBilled

balance ≥ 0                  → PAID (balance is credit, i.e. months paid ahead)
balance < 0, |balance| < fee → PARTIAL (short by less than one month)
balance < 0, |balance| ≥ fee → DUE
```

This one formula produces FIFO settlement, multi-month advance payment, and carry-forward of a shortfall as pure arithmetic — none of those are special-cased:

- Owes ₹300, pays ₹100 → balance −200 → `PARTIAL`, short ₹200 (this is the "carryOver" from the debt).
- Plan ₹300, pays ₹250 → balance −50 → `PARTIAL`, short ₹50 (carry-forward).
- Plan ₹300, pays ₹900 in the signup month → balance +600 → `PAID`, 2 months credit (3 months bought total — this is the multi-month advance case).
- Brand-new signup, zero payments, same month → balance is immediately negative → `DUE` right away, not `PAID` by default (this was the bug).

Implemented in `backend/utils/billing.js` as `computeBilling()`, used by `GET /customers/:id/due-status` (single customer, live) and `GET /dashboard/summary` (all customers, via one aggregation instead of N queries). The cached `Customer.status` field is refreshed on every payment create/delete via `refreshCachedStatus()` in `paymentController.js`, so the customer list (which reads the cached field for speed) matches the live ledger. It is **not** currently refreshed when `monthlyFee` is edited on an existing customer — a known gap, noted below.

Payment records still store `paidMonth`/`paidYear` for readability in the history view and as a default suggestion in the New Payment form (auto-suggested from the ledger's "paid through" date), but they're no longer what determines PAID/PARTIAL/DUE.

## Automatic activity log

Every payment creation/deletion and every customer field edit writes an automatic, plain-language note — visible in Customer Details under "Activity." These are never operator-written free text; they're generated by the backend itself (`backend/utils/activityLog.js`), so the trail can't be edited or faked after the fact. Examples of what gets logged automatically: `Payment of ₹350 recorded for July 2026 (Cash)`, `Updated monthly fee: "300" → "350"`, `Customer marked inactive`.

## Dashboard additions

Beyond the four original cards, the dashboard now shows:
- A fifth **Partial** card, alongside Total/Paid/Due/Today's Amount.
- **Expiring within 7 days** — customers whose paid-through date falls in the next week, so the operator can follow up before they lapse into DUE.
- **Recent Payments** — last 10 payments across all customers, with a link through to each customer.

## What's still pending

The message that prompted this round also described three larger subsystems that aren't built yet, each of which is a real separate piece of work rather than a quick addition:

- **CSV/Excel import** with column-name normalization (handling "CAF Number" / "CAF No" / "CAF ID" etc. as the same field) — needs a parsing library and a review/confirm UI before committing rows.
- **PON-specific management** (a dedicated PON dashboard, per-PON stats) — a new dimension of reporting beyond what's here now.
- **Offline capability** (cached responses so the app still shows data when the connection drops) — needs a service worker and a caching strategy, which is infrastructure, not a UI feature.

Happy to build any of these next — they're each substantial enough to want their own focused pass rather than being squeezed in alongside a payment-model rewrite.

## Security notes

- The PIN is a deterrent, not encryption — it's sent in a plain header and stored in `sessionStorage` on the frontend. Good enough to keep a public Vercel/Render URL from being casually browseable; not good enough if this app will ever hold data you'd consider sensitive beyond "an operator's customer list."
- Deployed to Render's free tier, the backend will spin down after inactivity — the first request after idle time can take 30+ seconds. Worth knowing before the operator hits it first thing in the morning.

## What's in the frontend now

- **Dashboard** (`/`) — large search bar with live dropdown results, quick-action buttons, and four summary cards (Total Customers, Paid, Due, Today's Amount) backed by `GET /dashboard/summary`.
- **Customer List** (`/customers`) — live search-as-you-type, plus `?filter=due` / `?filter=paid` links from the dashboard cards.
- **Add / Edit Customer** (`/customers/new`, `/customers/:id/edit`) — shared form component.
- **Customer Details** (`/customers/:id`) — profile fields, live-computed due status, Edit and New Payment buttons.
- **Payment History** — embedded in Customer Details, with a year selector and expandable months (a month can contain more than one payment entry).
- **New Payment** — modal form (amount, month, year, mode, notes) that refreshes both the history and the due-status display on save.
- **Today's Collection** (`/today`) — list of today's payments with customer names, linked from the dashboard.

### Design notes

The visual language leans into the "ledger/khatabook" framing from the brief itself rather than a generic dashboard look: a cool paper background, ink-navy text, and a signature status badge styled like a rubber ink stamp (forest green for Paid, sealing-wax red for Due), tilted slightly as if freshly pressed. Numbers use IBM Plex Mono throughout so amounts and phone numbers align like real ledger columns; headings use Fraunces, sparingly. Fonts load from Google Fonts via a `<link>` tag in `index.html` — swap for self-hosted fonts if the deployment target has no internet access at the operator's location.

## Next steps

- Phase 9 refinement: the cached `status` field on Customer is updated on payment creation but can drift if a payment is later soft-deleted — consider a scheduled job or recompute-on-read for full consistency, or rely on `/customers/:id/due-status` as the source of truth (already done in Customer Details).
- Phase 10: richer reports (monthly collection trends, due-customer export).
- Phase 11: deployment to Render/Vercel.
- Data export: a CSV export endpoint is worth adding early — losing an operator's only copy of customer/payment data would be a real problem, and it's cheap to build now.
- The "Due Customers" and "Paid" dashboard card links filter client-side against the list already fetched by `/customers`, using each customer's cached `status` field — fine at small scale, but for a large customer base you'd want a server-side filtered endpoint instead.
