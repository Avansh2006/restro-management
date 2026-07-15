# RestroOS — Restaurant Management SaaS Demo

A fully interactive, frontend-only restaurant management demo built from the
Google Stitch **"RestroOS Premium Management Dashboard"** designs
(`stitch_restroos_premium_management_dashboard/`).

No backend, no database, no login — everything runs in the browser with
`localStorage` as the demo database.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

## What's inside

| Area | Modules |
|---|---|
| Operations | Dashboard, Live Orders (kanban), Tables & floor plan, Reservations, Kitchen Display System, POS terminal, Menu management |
| Supply | Inventory & stock, Recipes with costing, Suppliers, Purchase orders (receiving restocks inventory) |
| People | Employees + profiles, Attendance, Face-attendance kiosk (with PIN fallback), Shifts, Leave, Payroll |
| Guests | Customers, Loyalty program, Feedback, Customer QR ordering (mobile-first) |
| Insights | Analytics (Recharts), Reports with CSV export, Branches, Audit logs, Settings |
| Extra | Employee mobile app experience, demo experience switcher (⚡ in the top bar) |

## Connected data

Modules behave like one application, e.g.:

- QR order → appears in Live Orders + KDS, occupies the table
- KDS status changes → reflected in Live Orders and the guest's QR tracking screen
- Paying an order → revenue KPIs update, table becomes dirty→available, customer history + loyalty points update
- Marking a menu item sold out → hidden from POS and QR ordering
- Kiosk punch-in → Attendance, employee profile, and dashboard staff KPI update
- Receiving a purchase order → inventory stock increases

## Demo data

Seeded on first visit; user changes persist across refreshes.
Under **Settings → Demo Data** you can:

- **Reset Demo Data** to the original seed
- **Export** the full state as JSON
- **Import** a previously exported JSON snapshot

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Zustand (persist) ·
Recharts · Lucide icons — design tokens ported from the Stitch `DESIGN.md`.
