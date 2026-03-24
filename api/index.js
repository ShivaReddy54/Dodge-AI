import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import initSqlJs from "sql.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "o2c.db");
const WASM_DIR = path.join(__dirname, "..", "node_modules", "sql.js", "dist");

// Global cache for database (Vercel cold starts)
let cachedDb = null;
let SQL = null;

async function getDatabase() {
  if (cachedDb) return cachedDb;

  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Database not found at ${DB_PATH}. Run: npm run import-data`);
  }

  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file) => path.join(WASM_DIR, file),
    });
  }

  const fileBuffer = fs.readFileSync(DB_PATH);
  cachedDb = new SQL.Database(fileBuffer);
  return cachedDb;
}

function allPayloads(db, entity) {
  const stmt = db.prepare(
    "SELECT payload FROM o2c_rows WHERE entity = ? ORDER BY row_key"
  );
  stmt.bind([entity]);
  const out = [];
  while (stmt.step()) {
    out.push(JSON.parse(stmt.getAsObject().payload));
  }
  stmt.free();
  return out;
}

function parseList(db, entity) {
  return allPayloads(db, entity);
}

function buildCustomerRevenuePareto(db, query) {
  const orders = parseList(db, "sales_order_headers");
  const partners = parseList(db, "business_partners");
  const partnerById = new Map(
    partners.map((p) => [String(p.businessPartner), p])
  );

  const q = (query || "").toString().toLowerCase().trim();
  let filtered = orders;
  if (q) {
    filtered = orders.filter((h) => {
      const id = String(h.soldToParty || "");
      const p = partnerById.get(id);
      const name = (p?.businessPartnerName || "").toLowerCase();
      return id.toLowerCase().includes(q) || name.includes(q);
    });
  }

  const sums = new Map();
  for (const h of filtered) {
    const id = String(h.soldToParty || "");
    const amt = parseFloat(String(h.totalNetAmount).replace(/,/g, "")) || 0;
    sums.set(id, (sums.get(id) || 0) + amt);
  }

  const rows = [...sums.entries()]
    .map(([id, amount]) => {
      const p = partnerById.get(id);
      const shortLabel = p?.businessPartnerName || id;
      return { customerId: id, label: shortLabel, amount };
    })
    .sort((a, b) => b.amount - a.amount);

  const total = rows.reduce((s, r) => s + r.amount, 0);
  const topN = 10;
  const top = rows.slice(0, topN);
  const rest = rows.slice(topN);
  const otherAmount = rest.reduce((s, r) => s + r.amount, 0);
  const paretoRows = [...top];
  if (otherAmount > 0) {
    paretoRows.push({
      customerId: "_other",
      label: `Other (${rest.length})`,
      amount: otherAmount,
    });
  }

  let cum = 0;
  const series = paretoRows.map((r) => {
    cum += r.amount;
    return {
      customerId: r.customerId,
      label: r.label,
      amount: Math.round(r.amount * 100) / 100,
      cumulativePct: total > 0 ? Math.round((cum / total) * 1000) / 10 : 0,
    };
  });

  return {
    series,
    totalAmount: Math.round(total * 100) / 100,
    orderCount: filtered.length,
    customerCount: rows.length,
    currency: filtered[0]?.transactionCurrency || "INR",
  };
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get("/api/health", async (_req, res) => {
  try {
    await getDatabase();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Stats
app.get("/api/stats", async (_req, res) => {
  try {
    const db = await getDatabase();
    const stmt = db.prepare(
      "SELECT entity, COUNT(*) AS n FROM o2c_rows GROUP BY entity ORDER BY entity"
    );
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Sales Orders
app.get("/api/sales-orders", async (req, res) => {
  try {
    const db = await getDatabase();
    const q = (req.query.q || "").toString().toLowerCase().trim();
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    let list = parseList(db, "sales_order_headers");
    if (q) {
      list = list.filter(
        (h) =>
          String(h.salesOrder).toLowerCase().includes(q) ||
          String(h.soldToParty || "").toLowerCase().includes(q)
      );
    }
    list.sort(
      (a, b) =>
        new Date(b.creationDate || 0) - new Date(a.creationDate || 0)
    );
    res.json(list.slice(0, limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/sales-orders/:id", async (req, res) => {
  try {
    const db = await getDatabase();
    const id = req.params.id;
    const headers = parseList(db, "sales_order_headers");
    const header = headers.find((h) => String(h.salesOrder) === id);
    if (!header) return res.status(404).json({ error: "Not found" });

    const partners = parseList(db, "business_partners");
    const customer = partners.find(
      (p) => String(p.businessPartner) === String(header.soldToParty)
    );

    const items = parseList(db, "sales_order_items").filter(
      (i) => String(i.salesOrder) === id
    );
    items.sort((a, b) => Number(a.salesOrderItem) - Number(b.salesOrderItem));

    const schedules = parseList(db, "sales_order_schedule_lines").filter(
      (s) => String(s.salesOrder) === id
    );

    res.json({ header, customer: customer || null, items, schedules });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Customers
app.get("/api/customers", async (req, res) => {
  try {
    const db = await getDatabase();
    const q = (req.query.q || "").toString().toLowerCase().trim();
    let list = parseList(db, "business_partners");
    if (q) {
      list = list.filter(
        (p) =>
          String(p.businessPartner).includes(q) ||
          String(p.businessPartnerName || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) =>
      String(a.businessPartnerName || "").localeCompare(
        String(b.businessPartnerName || "")
      )
    );
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/customers/:id", async (req, res) => {
  try {
    const db = await getDatabase();
    const id = req.params.id;
    const p = parseList(db, "business_partners").find(
      (x) => String(x.businessPartner) === id
    );
    if (!p) return res.status(404).json({ error: "Not found" });

    const addrs = parseList(db, "business_partner_addresses").filter(
      (a) => String(a.businessPartner) === id
    );

    res.json({ partner: p, addresses: addrs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Billing
app.get("/api/billing", async (req, res) => {
  try {
    const db = await getDatabase();
    const q = (req.query.q || "").toString().toLowerCase().trim();
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    let list = parseList(db, "billing_document_headers");
    if (q) {
      list = list.filter(
        (h) =>
          String(h.billingDocument).toLowerCase().includes(q) ||
          String(h.soldToParty || "").toLowerCase().includes(q)
      );
    }
    list.sort(
      (a, b) =>
        new Date(b.documentDate || 0) - new Date(a.documentDate || 0)
    );
    res.json(list.slice(0, limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/billing/:id", async (req, res) => {
  try {
    const db = await getDatabase();
    const id = req.params.id;
    const headers = parseList(db, "billing_document_headers");
    const header = headers.find((h) => String(h.billingDocument) === id);
    if (!header) return res.status(404).json({ error: "Not found" });

    const items = parseList(db, "billing_document_items").filter(
      (i) => String(i.billingDocument) === id
    );

    res.json({ header, items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Deliveries
app.get("/api/deliveries", async (req, res) => {
  try {
    const db = await getDatabase();
    const q = (req.query.q || "").toString().toLowerCase().trim();
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    let list = parseList(db, "outbound_delivery_headers");
    if (q) {
      list = list.filter(
        (h) =>
          String(h.deliveryDocument).toLowerCase().includes(q) ||
          String(h.soldToParty || "").toLowerCase().includes(q)
      );
    }
    list.sort(
      (a, b) =>
        new Date(b.documentDate || 0) - new Date(a.documentDate || 0)
    );
    res.json(list.slice(0, limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/deliveries/:id", async (req, res) => {
  try {
    const db = await getDatabase();
    const id = req.params.id;
    const headers = parseList(db, "outbound_delivery_headers");
    const header = headers.find((h) => String(h.deliveryDocument) === id);
    if (!header) return res.status(404).json({ error: "Not found" });

    const items = parseList(db, "outbound_delivery_items").filter(
      (i) => String(i.deliveryDocument) === id
    );

    res.json({ header, items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Payments
app.get("/api/payments", async (req, res) => {
  try {
    const db = await getDatabase();
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    let list = parseList(db, "payments_accounts_receivable");
    list.sort(
      (a, b) =>
        new Date(b.documentDate || 0) - new Date(a.documentDate || 0)
    );
    res.json(list.slice(0, limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Products
app.get("/api/products", async (req, res) => {
  try {
    const db = await getDatabase();
    const q = (req.query.q || "").toString().toLowerCase().trim();
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    let list = parseList(db, "products");
    if (q) {
      list = list.filter(
        (p) =>
          String(p.product).toLowerCase().includes(q) ||
          String(p.productType || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => String(a.product).localeCompare(String(b.product)));
    res.json(list.slice(0, limit));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Pareto Chart
app.get("/api/customer-revenue-pareto", async (req, res) => {
  try {
    const db = await getDatabase();
    const query = req.query.q || "";
    const data = buildCustomerRevenuePareto(db, query);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Export for Vercel serverless
export default app;
