-- Attach historic in-bot orders to the new Telegram customer accounts.
INSERT OR IGNORE INTO bp_users(telegram_id,username,display_name)
SELECT DISTINCT SUBSTR(device_id,4),'','' FROM orders
WHERE SUBSTR(device_id,1,3)='tg:'
  AND LENGTH(SUBSTR(device_id,4)) BETWEEN 4 AND 20
  AND SUBSTR(device_id,4) NOT GLOB '*[^0-9]*';

UPDATE orders SET telegram_user_id=SUBSTR(device_id,4)
WHERE telegram_user_id IS NULL
  AND SUBSTR(device_id,1,3)='tg:'
  AND LENGTH(SUBSTR(device_id,4)) BETWEEN 4 AND 20
  AND SUBSTR(device_id,4) NOT GLOB '*[^0-9]*';
