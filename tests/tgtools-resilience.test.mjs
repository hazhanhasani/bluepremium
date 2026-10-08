import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const market=await readFile(new URL('../src/parts/020.part',import.meta.url),'utf8');
const api=await readFile(new URL('../src/parts/021.part',import.meta.url),'utf8');
const admin=await readFile(new URL('../src/parts/022.part',import.meta.url),'utf8');

function deliveryHarness(key,action) {
  const calls=[];
  const mocks={
    tgPreflightDelivery:async()=>({ok:true}),
    getProviderSecret:async()=>key,
    tgFulfillmentInput:()=>action,
    tgStopBeforeProvider:async(_env,order,reason)=>{calls.push(['safeRefund',order.id,reason])}
  };
  const deliver=new Function(...Object.keys(mocks),market+';return tgMarketDeliver;')(...Object.values(mocks));
  const env={DB:{
    prepare:sql=>({
      bind:(...args)=>({run:async()=>{calls.push(['database',sql,args]);return {meta:{changes:1}}}})
    })
  }};
  return {deliver,env,calls};
}

test('missing provider key stops paid purchase before provider claim',async()=>{
  const h=deliveryHarness('',{path:'/api/purchase/stars',body:{amount:50}});
  await h.deliver(h.env,{id:17,status:'paid',payment_provider:'wallet'});
  assert.deepEqual(h.calls.map(x=>x[0]),['safeRefund']);
  assert.equal(h.calls[0][2],'provider_not_configured');
});

test('missing provider action also stops before provider claim',async()=>{
  const h=deliveryHarness('demo',null);
  await h.deliver(h.env,{id:18,status:'paid',payment_provider:'wallet'});
  assert.deepEqual(h.calls.map(x=>x[0]),['safeRefund']);
});

test('stale provider_submitting never auto retries provider POST',()=>{
  assert.match(market,/provider_submitting' AND updated_at<\?/);
  assert.match(market,/submission_interrupted/);
  assert.match(market,/provider_uncertain' AND provider_transaction_id IS NOT NULL/);
  assert.match(market,/WHERE status='provider_submitting' AND updated_at<\?/);
});

test('gift card delivery requires an actual code unless player topup',()=>{
  assert.match(market,/const requiresCode=order\.kind==='catalog'&&!order\.target/);
  assert.match(market,/if\(state==='completed'&&requiresCode&&!delivery\)return/);
});

test('SMM uses documented authenticated endpoint and numeric service ID',()=>{
  assert.match(market,/smm:'\/api\/Purchase\/smm\/bundles\?lang=fa'/);
  assert.match(market,/kind==='smm'&&!\/\^\\d\{1,10\}\$\//);
  assert.match(market,/tgRequest\(apiKey,'GET',path,null,kind==='smm'\)/);
});

test('admin health status is protected and does not leak API keys',()=>{
  assert.match(api,/path==='\/api\/admin\/market\/health'/);
  assert.match(api,/requireAdmin\(request,env\)/);
  assert.match(api,/configured:!!key/);
  assert.doesNotMatch(api,/api_key:key/);
  assert.match(admin,/tgMarketHealth/);
  assert.match(admin,/سفارش‌های نیازمند رسیدگی/);
});
