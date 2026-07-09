export const MIGRATIONS_SQL = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  tenant_subdomain TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  barcode TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  price TEXT NOT NULL DEFAULT '0',
  stock_qty TEXT NOT NULL DEFAULT '0',
  category_id TEXT,
  payload_json TEXT NOT NULL,
  PRIMARY KEY (id, branch_id, tenant_subdomain)
);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(tenant_subdomain, branch_id, barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(tenant_subdomain, branch_id, sku);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  tenant_subdomain TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  product_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, branch_id, tenant_subdomain)
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  tenant_subdomain TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT,
  payload_json TEXT NOT NULL,
  PRIMARY KEY (id, branch_id, tenant_subdomain)
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  tenant_subdomain TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  payload_json TEXT NOT NULL,
  PRIMARY KEY (id, branch_id, tenant_subdomain)
);

CREATE TABLE IF NOT EXISTS pos_config (
  branch_id TEXT NOT NULL,
  tenant_subdomain TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (branch_id, tenant_subdomain)
);

CREATE TABLE IF NOT EXISTS cash_register_state (
  branch_id TEXT NOT NULL,
  tenant_subdomain TEXT NOT NULL,
  is_open INTEGER NOT NULL DEFAULT 0,
  balance TEXT NOT NULL DEFAULT '0',
  payload_json TEXT NOT NULL,
  PRIMARY KEY (branch_id, tenant_subdomain)
);

CREATE TABLE IF NOT EXISTS held_orders (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  tenant_subdomain TEXT NOT NULL,
  label TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS checkout_outbox (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  branch_id TEXT NOT NULL,
  tenant_subdomain TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cash_register_outbox (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  tenant_subdomain TEXT NOT NULL,
  op_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_meta (
  entity TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  tenant_subdomain TEXT NOT NULL,
  last_synced_at TEXT,
  PRIMARY KEY (entity, branch_id, tenant_subdomain)
);
`;
