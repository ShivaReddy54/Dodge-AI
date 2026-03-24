import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import initSqlJs from "sql.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const DATA_DIR = path.join(ROOT, "sap-o2c-data");
const DB_PATH = path.join(__dirname, "..", "data", "o2c.db");
const WASM_DIR = path.join(__dirname, "..", "node_modules", "sql.js", "dist");

const ENTITY_KEY_FIELDS = {
  billing_document_items: ["billingDocument", "billingDocumentItem"],
  products: ["product"],
  business_partner_addresses: ["businessPartner", "addressId"],
  sales_order_schedule_lines: ["salesOrder", "salesOrderItem", "scheduleLine"],
  billing_document_headers: ["billingDocument"],
  outbound_delivery_items: ["deliveryDocument", "deliveryDocumentItem"],
  product_plants: ["product", "plant"],
  product_storage_locations: ["product", "plant", "storageLocation"],
  journal_entry_items_accounts_receivable: [
    "companyCode",
    "fiscalYear",
    "accountingDocument",
    "accountingDocumentItem",
  ],
  sales_order_headers: ["salesOrder"],
  payments_accounts_receivable: [
    "companyCode",
    "fiscalYear",
    "accountingDocument",
    "accountingDocumentItem",
  ],
  plants: ["plant"],
  product_descriptions: ["product", "language"],
  sales_order_items: ["salesOrder", "salesOrderItem"],
  customer_sales_area_assignments: [
    "customer",
    "salesOrganization",
    "distributionChannel",
    "division",
  ],
  business_partners: ["businessPartner"],
  outbound_delivery_headers: ["deliveryDocument"],
  billing_document_cancellations: ["billingDocument"],
  customer_company_assignments: ["customer", "companyCode"],
};

function rowKey(entity, obj) {
  const fields = ENTITY_KEY_FIELDS[entity];
  if (!fields) {
    throw new Error(`Unknown entity folder: ${entity}`);
  }
  return fields.map((f) => String(obj[f] ?? "")).join("|");
}

function* walkJsonlFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walkJsonlFiles(full);
    else if (e.isFile() && e.name.endsWith(".jsonl")) yield full;
  }
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error("Missing data folder:", DATA_DIR);
    process.exit(1);
  }

  const SQL = await initSqlJs({
    locateFile: (file) => path.join(WASM_DIR, file),
  });

  const db = new SQL.Database();
  db.run(`
    CREATE TABLE o2c_rows (
      entity TEXT NOT NULL,
      row_key TEXT NOT NULL,
      payload TEXT NOT NULL,
      PRIMARY KEY (entity, row_key)
    );
    CREATE INDEX idx_o2c_entity ON o2c_rows(entity);
  `);

  const insert = db.prepare(
    "INSERT OR REPLACE INTO o2c_rows (entity, row_key, payload) VALUES (?, ?, ?)"
  );

  let total = 0;
  const entityDirs = fs
    .readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const entity of entityDirs) {
    if (!ENTITY_KEY_FIELDS[entity]) {
      console.warn("Skipping unknown folder:", entity);
      continue;
    }
    const entityPath = path.join(DATA_DIR, entity);
    for (const file of walkJsonlFiles(entityPath)) {
      const raw = fs.readFileSync(file, "utf8");
      const lines = raw.split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        let obj;
        try {
          obj = JSON.parse(line);
        } catch {
          continue;
        }
        insert.run([entity, rowKey(entity, obj), line]);
        total++;
      }
    }
    console.log("Imported", entity);
  }

  insert.free();
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const out = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(out));
  db.close();
  console.log("Done. Rows:", total, "DB:", DB_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
