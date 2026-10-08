import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const part=async n=>readFile(new URL("../src/parts/"+String(n).padStart(3,"0")+".part",import.meta.url),"utf8");
const [route,admin,marketApi,marketUi]=await Promise.all([part(2),part(10),part(21),part(22)]);

test("admin summary counts Premium and digital orders without counting refunded sales as revenue",()=>{
  assert.match(route,/SELECT status, COUNT\(\*\) count, COALESCE\(SUM\(price_toman\),0\) total FROM orders GROUP BY status/);
  assert.match(route,/SELECT status, COUNT\(\*\) count, COALESCE\(SUM\(price_toman\),0\) total FROM bp_market_orders GROUP BY status/);
  assert.match(route,/breakdown: \{ premium: orders\.results \|\| \[\], market: marketOrders\.results \|\| \[\] \}/);
  assert.match(admin,/statusTotal\('delivered'\)/);
  assert.doesNotMatch(admin,/statusTotal\('refunded'\)/);
});

test("pending KPI excludes unpaid invoices and states their count separately",()=>{
  assert.match(admin,/const needsAttention=/);
  assert.match(admin,/const unpaid=/);
  assert.match(admin,/kPendingHint/);
  assert.match(admin,/فاکتور در انتظار پرداخت/);
});

test("latest ten orders combine both sources without revealing payment tokens",()=>{
  assert.match(route,/SELECT order_code, username AS target, 'premium' AS category/);
  assert.match(route,/SELECT order_code, target, kind AS category/);
  assert.match(route,/ORDER BY created_at DESC LIMIT 10/);
  assert.match(admin,/summary\.recent_orders/);
  assert.doesNotMatch(route,/SELECT \* FROM bp_market_orders\s+UNION ALL/);
});

test("Telegram market health distinguishes raw catalog entries and sellable products",()=>{
  assert.match(marketApi,/sellable_count:sellable\.length/);
  assert.match(marketUi,/health\.sellable_count/);
  assert.match(marketUi,/tg-health-report/);
  assert.match(marketUi,/tg-health-row/);
  assert.match(marketUi,/text-size-adjust:100%/);
});

test("mobile administration protects content from navigation and horizontal overflow",()=>{
  assert.match(admin,/bp-mobile-admin-20261008/);
  assert.match(admin,/padding-bottom:calc\(150px/);
  assert.match(admin,/scroll-snap-type:x proximity/);
  assert.match(admin,/-webkit-text-size-adjust:100%/);
});
