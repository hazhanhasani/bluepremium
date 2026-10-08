import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function part(n) {
  return readFile(new URL("../src/parts/"+String(n).padStart(3,"0")+".part", import.meta.url),"utf8");
}

test("all new backend helpers are syntactically valid",async()=>{
  const feature=await part(18),ui=await part(19);
  assert.doesNotThrow(()=>new Function(feature+"\n"+ui));
  assert.match(feature,/bpValidateTelegramInitData/);
  assert.match(feature,/getChatMember/);
  assert.match(feature,/bpWalletBuy/);
  assert.match(feature,/bpReferralCredit/);
});

test("account and administration overlays compile as standalone scripts",async()=>{
  const ui=await part(19);
  const api=new Function(ui+";return {bpDecorateAdminHtml,bpDecorateStoreHtml};")();
  const html=api.bpDecorateAdminHtml("<html><body><div id='app'></div></body></html>");
  const storefront=api.bpDecorateStoreHtml("<html><head></head><body><div id='checkout'></div></body></html>");
  for(const page of [html,storefront]){
    const scripts=[...page.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    assert.equal(scripts.length,1);
    assert.doesNotThrow(()=>new Function(scripts[0][1]));
  }
  assert.match(storefront,/telegram\.org\/js\/telegram-web-app\.js/);
  assert.match(html,/api\/admin\/customers/);
  assert.match(html,/api\/admin\/channels/);
});

test("wallet ledger schema requires immutable audited operations and nonnegative balances",async()=>{
  const sql=await readFile(new URL("../migrations/0007_customer_wallet_referrals.sql",import.meta.url),"utf8");
  assert.match(sql,/balance_toman INTEGER NOT NULL DEFAULT 0 CHECK\(balance_toman >= 0\)/);
  assert.match(sql,/idempotency_key TEXT NOT NULL UNIQUE/);
  assert.match(sql,/CREATE VIEW IF NOT EXISTS bp_wallet_balances/);
  const wallet=await part(18);
  assert.match(wallet,/INSERT INTO bp_wallet_ledger/);
  assert.match(wallet,/WHERE \(SELECT balance_toman FROM bp_wallet_balances WHERE telegram_id=\?\)>=\?/);
});

test("wallet and referral endpoints require authenticated identity or admin",async()=>{
  const part1=await part(1),feature=await part(18);
  assert.match(part1,/bpFeatureApi\(request, env, url, ctx\)/);
  assert.match(feature,/bpValidateTelegramInitData\(env,request\)/);
  assert.match(feature,/requireAdmin\(request,env\)/);
  assert.match(feature,/idempotency_key/);
});

test("referral credits require actual delivered orders",async()=>{
  const feature=await part(18);
  assert.match(feature,/order\.status !== "delivered"/);
  assert.match(feature,/NOT EXISTS\(SELECT 1 FROM bp_wallet_ledger WHERE idempotency_key/);
  assert.match(feature,/"referral:"\+person\.telegram_id/);
});
