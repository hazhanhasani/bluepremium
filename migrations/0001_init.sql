PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS provider_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  months INTEGER NOT NULL UNIQUE CHECK(months IN (3,6,12)),
  title TEXT NOT NULL,
  wholesale_ton REAL,
  auto_price_toman INTEGER NOT NULL DEFAULT 0,
  manual_price_toman INTEGER,
  price_toman INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT NOT NULL UNIQUE,
  public_token_hash TEXT NOT NULL,
  plan_id INTEGER NOT NULL,
  months INTEGER NOT NULL,
  username TEXT NOT NULL,
  price_toman INTEGER NOT NULL,
  status TEXT NOT NULL,
  device_id TEXT,
  blupal_invoice_id TEXT UNIQUE,
  payment_url TEXT,
  tg_transaction_id TEXT,
  provider_error TEXT,
  created_at TEXT NOT NULL,
  paid_at TEXT,
  delivered_at TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(plan_id) REFERENCES plans(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_invoice ON orders(blupal_invoice_id);
CREATE INDEX IF NOT EXISTS idx_orders_tg_tx ON orders(tg_transaction_id);

INSERT OR IGNORE INTO settings(key,value,updated_at) VALUES
  ('profit_percent','15',datetime('now')),
  ('rounding','1000',datetime('now')),
  ('support','@bluepanelsapp',datetime('now')),
  ('tgtools_fulfillment_mode','auto',datetime('now')),
  ('last_ton_toman','0',datetime('now')),
  ('last_price_sync','',datetime('now'));

INSERT OR IGNORE INTO plans(months,title,active,updated_at) VALUES
  (3,'Telegram Premium 3 Months',1,datetime('now')),
  (6,'Telegram Premium 6 Months',1,datetime('now')),
  (12,'Telegram Premium 12 Months',1,datetime('now'));
