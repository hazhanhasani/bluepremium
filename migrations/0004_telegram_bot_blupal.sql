-- Standard Telegram bot purchase flow + BluePal
CREATE TABLE IF NOT EXISTS telegram_bot_sessions (
  chat_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  state TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telegram_bot_sessions_updated_at
  ON telegram_bot_sessions(updated_at);

INSERT OR IGNORE INTO settings(key,value,updated_at) VALUES
  ('telegram_bot_blupal_enabled','1',datetime('now'));
