-- Blue Premium customer identity, auditable wallet and referral system.
CREATE TABLE IF NOT EXISTS bp_users (
  telegram_id TEXT PRIMARY KEY,
  username TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  balance_toman INTEGER NOT NULL DEFAULT 0 CHECK(balance_toman >= 0),
  referred_by TEXT REFERENCES bp_users(telegram_id),
  referral_rewarded INTEGER NOT NULL DEFAULT 0 CHECK(referral_rewarded IN (0,1)),
  blocked INTEGER NOT NULL DEFAULT 0 CHECK(blocked IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(referred_by IS NULL OR referred_by <> telegram_id)
);
CREATE INDEX IF NOT EXISTS idx_bp_users_referrer ON bp_users(referred_by);
CREATE INDEX IF NOT EXISTS idx_bp_users_created ON bp_users(created_at);

CREATE TABLE IF NOT EXISTS bp_wallet_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL REFERENCES bp_users(telegram_id),
  delta_toman INTEGER NOT NULL CHECK(delta_toman <> 0),
  kind TEXT NOT NULL CHECK(kind IN ('admin_credit','admin_debit','purchase','referral','refund')),
  actor TEXT NOT NULL DEFAULT 'system',
  reason TEXT NOT NULL DEFAULT '',
  related_user TEXT,
  order_code TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bp_wallet_ledger_user ON bp_wallet_ledger(telegram_id,id DESC);

-- A single ledger INSERT is the atomic balance-changing operation.
CREATE TRIGGER IF NOT EXISTS trg_bp_wallet_apply AFTER INSERT ON bp_wallet_ledger
BEGIN
  UPDATE bp_users SET balance_toman=balance_toman+NEW.delta_toman,
    updated_at=CURRENT_TIMESTAMP
    WHERE telegram_id=NEW.telegram_id AND balance_toman+NEW.delta_toman>=0;
  SELECT CASE WHEN changes()!=1 THEN RAISE(ABORT,'insufficient_wallet_balance') END;
  UPDATE bp_users SET referral_rewarded=1
    WHERE telegram_id=NEW.related_user AND NEW.kind='referral';
END;

CREATE TABLE IF NOT EXISTS bp_forced_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  invite_url TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE orders ADD COLUMN telegram_user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_bp_orders_customer ON orders(telegram_user_id,id DESC);
INSERT OR IGNORE INTO settings(key,value,updated_at) VALUES
  ('referral_bonus_toman','0',CURRENT_TIMESTAMP),
  ('telegram_bot_menu_version','3',CURRENT_TIMESTAMP);
