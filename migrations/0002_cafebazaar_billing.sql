-- Cafe Bazaar In-App Billing support
ALTER TABLE orders ADD COLUMN payment_provider TEXT;
ALTER TABLE orders ADD COLUMN bazaar_purchase_token TEXT;
ALTER TABLE orders ADD COLUMN bazaar_order_id TEXT;
ALTER TABLE orders ADD COLUMN bazaar_product_id TEXT;
ALTER TABLE orders ADD COLUMN bazaar_consumed INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_bazaar_purchase_token
  ON orders(bazaar_purchase_token)
  WHERE bazaar_purchase_token IS NOT NULL AND bazaar_purchase_token != '';

INSERT OR IGNORE INTO settings(key,value,updated_at) VALUES
  ('payment_provider','cafebazaar',datetime('now')),
  ('cafebazaar_enabled','1',datetime('now')),
  ('blupal_enabled','0',datetime('now')),
  ('bazaar_rsa_public_key','',datetime('now')),
  ('bazaar_sku_3','',datetime('now')),
  ('bazaar_sku_6','',datetime('now')),
  ('bazaar_sku_12','',datetime('now'));
