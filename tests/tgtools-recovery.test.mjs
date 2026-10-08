import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const readPart=async i=>readFile(new URL('../src/parts/'+String(i).padStart(3,'0')+'.part',import.meta.url),'utf8');

test('NFT browsing uses documented marketplace feed and filters unsellable rentals',async()=>{
  const s=await readPart(23);
  assert.match(s,/\/api\/marketplace\/feed\?offset=0&limit=40/);
  assert.match(s,/row\.isBuyAvailable!==true/);
  assert.doesNotMatch(s,/\/api\/marketplace\/browse/);
  const funcs=new Function('getSetting','getProviderSecret','tgRequest','tgTonAddress','bpName',s+';return {tgNftBrowse};')(
    async()=> '1',async()=> 'key',
    async()=>({ok:true,data:{items:[
      {nftAddress:'0:'+'1'.repeat(64),nftName:'Rental only',isBuyAvailable:false,platformSalePriceTon:4},
      {nftAddress:'0:'+'2'.repeat(64),nftName:'Sale',isBuyAvailable:true,platformSalePriceTon:5}
    ]}}),
    a=>/^0:[a-f0-9]{64}$/i.test(a)?a:'',String
  );
  const items=await funcs.tgNftBrowse({DB:{}});
  assert.equal(items.length,1);
  assert.equal(items[0].title,'Sale');
});

test('failed-wallet refund requires no provider transaction and a ledger purchase',async()=>{
  const s=await readPart(23);
  assert.match(s,/tgAdminRefundFailedWallet/);
  assert.match(s,/provider_transaction_id IS NULL/);
  assert.match(s,/status IN \('failed','refund_required'\)/);
  assert.match(s,/idempotency_key='purchase:'\|\|o\.order_code/);
  assert.match(s,/INSERT OR IGNORE INTO bp_wallet_ledger/);
  assert.match(s,/idempotency_key=\?/);
  const fn=new Function('bpName','telegramSendMessage','bpPrice','telegramEscapeHtml',
    s+';return tgAdminRefundFailedWallet')(
      (v,n)=>String(v||'').slice(0,n),async()=>{},String,String
    );
  const noOrder={DB:{prepare:()=>({bind:()=>({first:async()=>null})})}};
  const result=await fn(noOrder,10,'Confirmed no delivery');
  assert.equal(result.ok,false);
  assert.equal(result.error,'refund_not_allowed');
});

test('refund endpoint checks admin authorization and explicit no-delivery acknowledgement',async()=>{
  const [routes,ui]=await Promise.all([readPart(21),readPart(22)]);
  assert.match(routes,/requireAdmin\(request,env\)/);
  assert.match(routes,/confirm_no_delivery!==true/);
  assert.match(routes,/tgAdminRefundFailedWallet/);
  assert.match(ui,/data-tg-refund/);
  assert.match(ui,/confirm_no_delivery:true/);
});

test('provider checks and payload construction precede irreversible claimed order status',async()=>{
  const s=await readPart(20);
  const part=s.slice(s.indexOf('async function tgMarketDeliver('),s.indexOf('async function tgReconcileOrder('));
  assert.ok(part.indexOf('const apiKey=await getProviderSecret')<part.indexOf('const claimed=await'));
  assert.ok(part.indexOf('const action=tgFulfillmentInput(order)')<part.indexOf('const claimed=await'));
  assert.match(part,/tgStopBeforeProvider\(env,order,'provider_not_configured'\)/);
});

test('SMM uses the documented Purchase endpoint with key authentication',async()=>{
  const s=await readPart(20);
  assert.match(s,/\/api\/Purchase\/smm\/bundles\?lang=fa/);
  assert.match(s,/kind==='smm'\)/);
  assert.match(s,/data\?\.data\?\.services/);
});
