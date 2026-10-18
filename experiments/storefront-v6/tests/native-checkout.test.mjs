import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const source=await readFile(new URL('../src/lib/native-checkout.ts',import.meta.url),'utf8');
const stub=source.replace(/import\s+\{[\s\S]*?\}\s+from\s+'\.\/bluepremium-api';/,"const hasTrustedSameOriginApi=()=>globalThis.__sameOrigin;");
assert.ok(!stub.includes("from './bluepremium-api'"),'Import stub failed');

async function boot({live=true,token='signed_example',origin='https://shop.example.test'}={}) {
  globalThis.__sameOrigin=live;
  globalThis.location={protocol:new URL(origin).protocol,origin};
  globalThis.window={location:globalThis.location,Telegram:{WebApp:{initData:token}}};
  const js=ts.transpileModule(stub,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64')+'#'+Math.random());
}
const plan={id:7,months:3,title:'3 months',price_toman:590000};
const product={sku:'stars-100',kind:'stars',title:'100 stars',price_toman:129000,target_type:'username'};
const reply=(data,status=201)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});

test('preview never calls a real purchase API',async()=>{
  const x=await boot({live:false});
  let count=0;const prev=globalThis.fetch;globalThis.fetch=async()=>{count++;throw Error('Unexpected request')};
  try{
    await assert.rejects(x.createPremiumPurchase(plan,'valid_user','blupal'),/preview_mode/);
    assert.equal(count,0);
  }finally{globalThis.fetch=prev}
});
test('Premium purchase posts signed same-origin original API and displays verified invoice',async()=>{
  const x=await boot();const prev=globalThis.fetch;const calls=[];
  globalThis.fetch=async(path,opts)=>{
    calls.push({path,opts});
    return reply({ok:true,order:{code:'BP-12345678901234',status:'awaiting_payment',price_toman:590000,
      payment_instructions:{type:'card_transfer',card_number:'1234567812345678',amount_rial:5900000}}});
  };
  try{
    const output=await x.createPremiumPurchase(plan,'@valid_user','blupal');
    assert.equal(output.code,'BP-12345678901234');
    assert.equal(output.payment_instructions.amount_rial,5900000);
    assert.equal(calls.length,1);
    assert.equal(calls[0].path,'/api/orders');
    assert.equal(calls[0].opts.method,'POST');
    assert.equal(calls[0].opts.headers['X-Telegram-Init-Data'],'signed_example');
    assert.deepEqual(JSON.parse(calls[0].opts.body),{plan_id:7,username:'valid_user',device_id:'web-v6'});
  }finally{globalThis.fetch=prev}
});
test('wallet is blocked without signed Telegram initData',async()=>{
  const x=await boot({token:''});const prev=globalThis.fetch;let count=0;
  globalThis.fetch=async()=>{count++;throw Error('Unexpected')};
  try{
    await assert.rejects(x.createPremiumPurchase(plan,'valid_user','wallet'),/telegram_auth_required/);
    await assert.rejects(x.createMarketPurchase(product,'stars','valid_user','wallet'),/telegram_auth_required/);
    assert.equal(count,0);
  }finally{globalThis.fetch=prev}
});
test('Stars checkout uses original marketplace API with server-side price confirmation',async()=>{
  const x=await boot();const prev=globalThis.fetch;let actual;
  globalThis.fetch=async(path,opts)=>{actual={path,opts};return reply({ok:true,order:{code:'BP-ABCDEF12345678',status:'processing'}})};
  try{
    const output=await x.createMarketPurchase(product,'stars','@valid_user','wallet');
    assert.equal(output.status,'processing');
    assert.equal(actual.path,'/api/market/orders');
    assert.equal(JSON.parse(actual.opts.body).expected_price_toman,129000);
    assert.equal(JSON.parse(actual.opts.body).target,'@valid_user');
    assert.equal(JSON.parse(actual.opts.body).payment,'wallet');
  }finally{globalThis.fetch=prev}
});
test('invalid recipients, prices, server errors and malformed orders never appear successful',async()=>{
  const x=await boot();const prev=globalThis.fetch;
  globalThis.fetch=async()=>reply({ok:false,error:'price_changed'},409);
  try{
    await assert.rejects(x.createPremiumPurchase(plan,'bad','blupal'),/invalid_username/);
    await assert.rejects(x.createPremiumPurchase(plan,'valid_user','blupal'),/price_changed/);
    await assert.rejects(x.createMarketPurchase({...product,price_toman:0},'stars','valid_user','blupal'),/price_unavailable/);
    globalThis.fetch=async()=>reply({ok:true,order:{code:'bad-code',status:'paid'}});
    await assert.rejects(x.createPremiumPurchase(plan,'valid_user','blupal'),/invalid_api_response/);
  }finally{globalThis.fetch=prev}
});
test('gift catalog is read-only and filters prices below zero',async()=>{
  const x=await boot();const prev=globalThis.fetch;const calls=[];
  globalThis.fetch=async(path,opts)=>{
    calls.push({path,opts});
    return reply({ok:true,enabled:true,products:[
      {sku:'gift-1',title:'Gift',kind:'gift',price_toman:200000,target_type:'username'},
      {sku:'bad',title:'Fake',kind:'gift',price_toman:-1}]},200);
  };
  try{
    const out=await x.loadMarketCatalog('gift',new AbortController().signal);
    assert.deepEqual(out.products.map(p=>p.sku),['gift-1']);
    assert.equal(calls[0].opts.method,'GET');
    assert.equal(calls[0].path,'/api/market/catalog?kind=gift');
  }finally{globalThis.fetch=prev}
});
