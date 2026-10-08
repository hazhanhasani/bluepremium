-- Telegram bot settings
INSERT OR IGNORE INTO settings(key,value,updated_at) VALUES
  ('telegram_bot_enabled','0',datetime('now')),
  ('telegram_admin_id','',datetime('now')),
  ('telegram_bot_username','',datetime('now')),
  ('telegram_bot_webhook_url','',datetime('now'));
