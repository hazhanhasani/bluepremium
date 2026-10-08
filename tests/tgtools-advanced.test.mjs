import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const parts=await Promise.all([20,21,22,23].map(n=>
  readFile(new URL('../src/parts/'+n.toString().padStart(3,'0')+'.part',import.meta.url),'utf8')));
const [market,api,ui,advanced]=parts;

test('Steam live quote uses provider priceTon and fixed amount, no invented totals',async()=>{
  const quote=new Function('getProviderSecret','tgRequest','tgPrice',advanced+';return tgLiveQuote')(
    async()=> 'test-key',
    async(_key,method,path)=>({ok:method==='GET'&&path.includes('/api/steam-topup/quote?currency=RUB&amount=100'),
      data:{currency:'RUB',amountLocal:100,priceTon:0.75}}),
    async(_env,kind,ton)=>Math.round(ton*100000));
  const out=await quote({},'steam','RUB:100');
  assert.equal(out.price_toman,75000);
  assert.equal(out.target_type,'steam_login');
  assert.equal(await quote({},'steam','RUB:-10'),null);
});

test('NFT buy requires exact contract and a quote marked canBuy',async()=>{
  const address='EQ'+'A'.repeat(46);
  const quote=new Function('getProviderSecret','tgRequest','tgPrice',advanced+';return {tgLiveQuote,tgFulfillmentInput,tgTonAddress}')(
    async()=> 'test-key',async()=>({ok:true,data:{canBuy:true,totalPriceTon:3.12}}),
    async()=>1560000);
  const out=await quote.tgLiveQuote({},'nft',address);
  assert.equal(out.ton,3.12);
  assert.equal(await quote.tgLiveQuote({},'nft','invalid'),null);
  assert.equal(quote.tgTonAddress(address),address);
  const buy=quote.tgFulfillmentInput({kind:'nft',sku:address,target:'EQ'+'B'.repeat(46),order_code:'BP-A'});
  assert.equal(buy.path,'/api/marketplace/buy/auto');
  assert.equal(buy.body.clientOrderId,'BP-A');
});

test('catalog flattens exact denominated variants, not category floor price',async()=>{
  const apiMock=new Function('getSetting','getProviderSecret','tgRequest','bpName',market+
    ';return tgProducts;')(
    async(_db,key,def)=>({'market_catalog_enabled':'1','last_ton_toman':'500000','market_catalog_profit':'10','rounding':'1000'}[key]??def),
    async()=>null,
    async()=>({ok:true,data:{items:[{name:'Test Store',requiresPlayerId:false,
      variants:[{productId:41,label:'10 USD',priceTon:0.5},{productId:42,label:'20 USD',priceTon:1},
      {productId:42,label:'duplicate',priceTon:1}]}]}}),
    v=>String(v||''));
  const products=await apiMock({DB:{}},'catalog');
  assert.equal(products.length,2);
  assert.deepEqual(products.map(x=>x.sku),['41','42']);
  assert.deepEqual(products.map(x=>x.price_toman),[275000,550000]);
});

test('excluded sold-out Telegram gifts and unavailable prices',async()=>{
  const products=new Function('getSetting','getProviderSecret','tgRequest','bpName',market+
    ';return tgProducts;')(
    async(_db,key,def)=>({'market_gift_enabled':'1','last_ton_toman':'500000','market_gift_profit':'10','rounding':'1000'}[key]??def),
    async()=>null,
    async()=>({ok:true,data:[
      {giftId:'101',name:'Sold',soldOut:true,priceTon:0.2},
      {giftId:'102',name:'Available',soldOut:false,priceTon:0.3}
    ]}),
    v=>String(v||''));
  const rows=await products({DB:{}},'gift');
  assert.deepEqual(rows.map(x=>x.sku),['102']);
});

test('Steam and NFT provider routes use exact documented endpoint',()=>{
  const build=new Function(advanced+';return {tgFulfillmentInput,tgOrderDetailRoute};')();
  assert.equal(build.tgFulfillmentInput({kind:'steam',sku:'RUB:100',target:'login'}).path,'/api/steam-topup/buy');
  assert.equal(build.tgOrderDetailRoute({kind:'steam',provider_transaction_id:'78'}),'/api/fazer/orders/78');
  assert.equal(build.tgOrderDetailRoute({kind:'nft',provider_transaction_id:'2'}),'/api/marketplace/orders/2');
  assert.equal(build.tgFulfillmentInput({kind:'smm',sku:'12',quantity:100,target:'https://example.com',provider_payload:'{}'}).path,'/api/Purchase/smm');
});

test('wallet refund before remote submission has idempotency key',()=>{
  assert.match(advanced,/refund:\x27\+order\.order_code/);
  assert.match(advanced,/INSERT OR IGNORE INTO bp_wallet_ledger/);
  assert.match(advanced,/status=\x27refunded\x27/);
  assert.match(market,/await tgStopBeforeProvider\(env,order,preflight\.error\)/);
});

test('new price and checkout routes require fresh quote',()=>{
  assert.match(api,/path===\x27\/api\/market\/quote\x27/);
  assert.match(market,/const customerQuoted=Number\(input\.expected_price_toman/);
  assert.match(market,/price_changed/);
  assert.match(ui,/استعلام قیمت لحظه‌ای/);
  assert.match(ui,/expected_price_toman:selected\.price_toman/);
});
