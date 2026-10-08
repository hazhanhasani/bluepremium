-- Store provider payment instructions without exposing provider UI.
ALTER TABLE orders ADD COLUMN blupal_final_amount_rial INTEGER;
ALTER TABLE orders ADD COLUMN blupal_card_number TEXT;
ALTER TABLE orders ADD COLUMN blupal_expires_at TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_blupal_pending
  ON orders(payment_provider,status,blupal_invoice_id);
