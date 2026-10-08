import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const load=async n=>readFile(new URL("../src/parts/"+String(n).padStart(3,"0")+".part",import.meta.url),"utf8");

test("Stars pricing derives from live provider packages and never guessed amounts",async()=>{
  const src=await load(20);
  const fn=new Function("getSetting","getProviderSecret","tgRequest","bpName","normalizeUsername",src+";return {tgProducts,tgPrice,tgDestination,tgPublic};");
  const settings={"market_stars_enabled":"1","last_ton_toman":"250000","market_stars_profit":"20","rounding":"1000"};
  const helpers=fn(async(db,key,def)=>settings[key]??def,async()=>null,async()=>({ok:true,data:{
    packages:[{qty:50,ton:0.5},{qty:100,ton:1.05},{qty:25,ton:0.3},{qty:1000,ton:0}]
  }}),v=>String(v||""),v=>String(v||"").replace(/^@/,""));
  const env={DB:{}};
  const items=await helpers.tgProducts(env,"stars");
  assert.deepEqual(items.map(x=>x.quantity),[50,100]);
  assert.equal(items[0].price_toman,150000);
  assert.equal(items[1].price_toman,315000);
  assert.equal(helpers.tgDestination("stars","@user123"),"user123");
  assert.equal(helpers.tgDestination("smm","file:///etc/passwd"),"");
  assert.equal(helpers.tgPublic({order_code:"BP-TEST",kind:"stars",title:"50",quantity:50,price_toman:10000,status:"paid",target:"user"}).payment_instructions,undefined);
});

test("provider APIs cover Stars, Telegram gifts, SMM and digital catalog",async()=>{
  const s=await load(20);
  assert.match(s,/\/api\/purchase\/stars/);
  assert.match(s,/\/api\/purchase\/gift'/);
  assert.match(s,/\/api\/purchase\/smm'/);
  assert.match(s,/\/api\/catalog\/buy/);
  assert.match(s,/trackingCode:order\.order_code/);
  assert.match(s,/idempotency_key/);
  assert.match(s,/provider_uncertain/);
  assert.match(s,/getProviderSecret/);
});

test("card transfers never display external BluePal checkout links",async()=>{
  const backend=await load(20),ui=await load(22);
  assert.match(backend,/blupalHostedPaymentDetails/);
  assert.match(backend,/blupalAmountIsReasonable/);
  assert.match(backend,/detail\.status!=='PAID'/);
  assert.doesNotMatch(ui,/window\.open\([^)]*blupal|location\.href\s*=\s*[^;]*blupal/i);
});

test("TGTools admin and storefront browser scripts compile",async()=>{
  const content=await load(22);
  const helpers=new Function(content+";return {tgDecorateStore,tgDecorateAdmin};")();
  for(const html of [helpers.tgDecorateStore("<html><body></body></html>"),helpers.tgDecorateAdmin("<html><body></body></html>")]){
    const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    assert.ok(script);
    assert.doesNotThrow(()=>new Function(script));
  }
});

test("routes, webhook, cron and Telegram bot are integrated",async()=>{
  const [route,cron,bot,api]=await Promise.all([load(1),load(2),load(17),load(21)]);
  assert.match(route,/tgMarketApi\(request, env, url, ctx\)/);
  assert.match(cron,/tgMarketMaintenance\(env\)/);
  assert.match(cron,/tgReconcileOrder\(env,market\)/);
  assert.match(bot,/tgBotMarketMenu/);
  assert.match(bot,/tgBotMarketPay/);
  assert.match(api,/requireAdmin\(request,env\)/);
  assert.match(api,/bpValidateTelegramInitData\(env,request\)/);
});

test("new products have isolated schema and per-category toggles",async()=>{
  const sql=await readFile(new URL("../migrations/0009_tgtools_market.sql",import.meta.url),"utf8");
  assert.match(sql,/CREATE TABLE IF NOT EXISTS bp_market_orders/);
  assert.match(sql,/public_token_hash TEXT NOT NULL/);
  assert.match(sql,/market_stars_enabled','1'/);
  assert.match(sql,/market_nft_enabled','0'/);
  assert.match(sql,/market_steam_enabled','0'/);
});
