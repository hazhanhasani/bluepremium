-- TG Tools commerce: heterogeneous products never reuse Premium plan_ids.
CREATE TABLE IF NOT EXISTS bp_market_orders (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 order_code TEXT NOT NULL UNIQUE,
 public_token_hash TEXT NOT NULL,
 telegram_user_id TEXT REFERENCES bp_users(telegram_id),
 kind TEXT NOT NULL CHECK(kind IN ('stars','gift','smm','catalog','nft','steam')),
 sku TEXT NOT NULL,
 title TEXT NOT NULL,
 target TEXT NOT NULL,
 quantity INTEGER NOT NULL DEFAULT 1,
 price_toman INTEGER NOT NULL CHECK(price_toman>0),
 quoted_ton REAL NOT NULL CHECK(quoted_ton>0),
 provider_payload TEXT NOT NULL,
 payment_provider TEXT NOT NULL CHECK(payment_provider IN ('wallet','blupal')),
 status TEXT NOT NULL,
 blupal_invoice_id TEXT UNIQUE,
 payment_url TEXT,
 blupal_card_number TEXT,
 blupal_final_amount_rial INTEGER,
 provider_transaction_id TEXT,
 provider_error TEXT,
 delivery_code TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 paid_at TEXT,
 delivered_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_bp_market_status ON bp_market_orders(status,id);
CREATE INDEX IF NOT EXISTS idx_bp_market_customer ON bp_market_orders(telegram_user_id,id);
CREATE INDEX IF NOT EXISTS idx_bp_market_provider_id ON bp_market_orders(kind,provider_transaction_id);
INSERT OR IGNORE INTO settings(key,value,updated_at) VALUES
 ('market_stars_enabled','1',CURRENT_TIMESTAMP),
 ('market_gift_enabled','0',CURRENT_TIMESTAMP),
 ('market_smm_enabled','0',CURRENT_TIMESTAMP),
 ('market_catalog_enabled','0',CURRENT_TIMESTAMP),
 ('market_nft_enabled','0',CURRENT_TIMESTAMP),
 ('market_steam_enabled','0',CURRENT_TIMESTAMP),
 ('market_stars_profit','15',CURRENT_TIMESTAMP),
 ('market_gift_profit','15',CURRENT_TIMESTAMP),
 ('market_smm_profit','15',CURRENT_TIMESTAMP),
 ('market_catalog_profit','15',CURRENT_TIMESTAMP),
 ('market_nft_profit','15',CURRENT_TIMESTAMP),
 ('market_steam_profit','15',CURRENT_TIMESTAMP);
