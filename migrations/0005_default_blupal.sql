-- BluePal is the shared default gateway for app, Mini App and Telegram bot.
INSERT INTO settings(key,value,updated_at) VALUES
  ('payment_provider','blupal',datetime('now')),
  ('blupal_enabled','1',datetime('now')),
  ('cafebazaar_enabled','0',datetime('now'))
ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at;
