# SAP Order-to-Cash (O2C) Explorer

Full-stack app that loads SAP-style O2C sample data from JSONL files into a local SQLite database, exposes it through a **Node.js** API, and browses it in a **React** UI (sales, customers, billing, deliveries, AR payments, and a customer revenue Pareto chart).

## Tech stack

| Layer    | Choice |
|----------|--------|
| Backend  | Node.js, Express, CORS |
| Database | SQLite file via **sql.js** (no native addon; portable on Windows/macOS/Linux) |
| Frontend | React 18, React Router, Vite 6, Recharts |

## Repository layout

```
data/
├── sap-o2c-data/          # Source JSONL exports (one folder per entity)
├── backend/
│   ├── scripts/import.mjs # Builds backend/data/o2c.db from sap-o2c-data
│   ├── src/index.js       # Express API
│   ├── data/o2c.db        # Generated after import (not committed; see .gitignore)
│   └── package.json
└── frontend/
    ├── src/               # React app (pages, components, styles)
    ├── vite.config.js     # Dev server + /api proxy → localhost:3001
    └── package.json
```

## Prerequisites

- **Node.js** 18+ (LTS recommended)

## Setup

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Build the database from JSONL

Requires `sap-o2c-data` at the repo root (sibling of `backend/`).

```bash
npm run import
```

This creates `backend/data/o2c.db`.

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

## Run locally (development)

Use **two terminals**.

**Terminal A — API (port 3001)**

```bash
cd backend
npm start
```

Optional: `set PORT=3002` (Windows) or `PORT=3002` (Unix) before `npm start` if 3001 is taken. If you change the port, update `frontend/vite.config.js` proxy `target` to match.

**Terminal B — UI (Vite, default 5173)**

```bash
cd frontend
npm run dev
```

Open **http://127.0.0.1:5173** (or the URL Vite prints). API requests to `/api/*` are proxied to `http://localhost:3001`.

## Production build (frontend only)

```bash
cd frontend
npm run build
```

Static files are written to `frontend/dist/`. Serve that folder with any static host and run the API separately, pointing the client at the API origin (you would need to configure CORS or a reverse proxy; dev uses Vite’s proxy).

Preview locally:

```bash
npm run preview
```

## API overview

Base URL in dev: `http://localhost:3001` (or via Vite: same-origin `/api/...`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | Row counts per entity |
| GET | `/api/sales-orders?q=&limit=` | Sales order headers |
| GET | `/api/sales-orders/:id` | Order detail (items, customer, schedules) |
| GET | `/api/customers?q=` | Business partners |
| GET | `/api/customers/:id` | Customer detail |
| GET | `/api/products?q=` | Products (+ EN description when available) |
| GET | `/api/billing?q=` | Billing document headers |
| GET | `/api/billing/:id` | Billing detail |
| GET | `/api/deliveries` | Outbound delivery headers |
| GET | `/api/deliveries/:id` | Delivery detail |
| GET | `/api/payments` | AR payment lines (sample) |
| GET | `/api/analytics/customer-revenue-pareto?query=` | Pareto series (optional filter on customer id/name) |

## UI routes

- `/` — Dashboard (stats + customer revenue Pareto + query filter)
- `/sales-orders`, `/sales-orders/:id`
- `/customers`, `/customers/:id`
- `/products`
- `/billing`, `/billing/:id`
- `/deliveries`, `/deliveries/:id`
- `/payments`

## Data model (import)

Each JSONL line is stored as JSON in table `o2c_rows` (`entity`, `row_key`, `payload`). Entity names match folder names under `sap-o2c-data/` (for example `sales_order_headers`, `billing_document_items`).

## Troubleshooting

- **`Database not found`** — Run `cd backend && npm run import` after `npm install`.
- **Chart or analytics 404** — Restart the backend after pulling changes so new routes load.
- **Frontend cannot reach API** — Ensure the API is on port 3001, or align Vite’s `proxy` target with your `PORT`.

## License

Private / assignment use unless you add your own license.
