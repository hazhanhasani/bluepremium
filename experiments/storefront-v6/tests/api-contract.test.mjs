import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';

const path = new URL('../src/lib/bluepremium-api.ts', import.meta.url);
const original = await readFile(path, 'utf8');

async function boot({ enabled = true, configuredOrigin = 'https://shop.example.test', pageOrigin = 'https://shop.example.test', initData = 'signed_test_fixture' } = {}) {
  const config = JSON.stringify({ VITE_ENABLE_LIVE_READS: enabled ? 'true' : 'false', VITE_API_ORIGIN: configuredOrigin });
  const code = original.replaceAll('import.meta.env', config);
  const js = ts.transpileModule(code, {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  globalThis.window = {location:{origin:pageOrigin},Telegram:{WebApp:{initData}}};
  const tag = Buffer.from(js).toString('base64');
  return import('data:text/javascript;base64,' + tag);
}
function json(payload,status=200) {
  return new Response(JSON.stringify(payload),{status,headers:{'content-type':'application/json'}});
}
const sample = {display_name:'Test User',username:'test',balance_toman:85000,referral_count:1,transactions:[],orders:[]};

test('preview mode never calls the backend and never exposes an authenticated session', async () => {
  const api=await boot({enabled:false});
  let sent=0;const prior=globalThis.fetch;
  globalThis.fetch=async()=>{sent++;throw new Error('must not fetch')};
  try{
    assert.equal(api.hasTrustedSameOriginApi(),false);
    await assert.rejects(api.loadPlans(new AbortController().signal),/preview_mode/);
    assert.equal(sent,0);
  } finally{globalThis.fetch=prior}
});

test('cross-origin configuration is rejected before forwarding signed Telegram initData',async()=>{
  const api=await boot({configuredOrigin:'https://attacker.example.test'});
  let sent=0;const prior=globalThis.fetch;
  globalThis.fetch=async()=>{sent++;throw new Error('forbidden')};
  try{
    assert.equal(api.hasTrustedSameOriginApi(),false);
    await assert.rejects(api.loadMember(new AbortController().signal),/preview_mode/);
    assert.equal(sent,0);
  }finally{globalThis.fetch=prior}
});

test('public plan and Stars reads accept only positive real API prices and use GET',async()=>{
  const api=await boot();
  const calls=[];const prior=globalThis.fetch;
  globalThis.fetch=async(url,opts)=>{
    calls.push({url,method:opts.method,auth:opts.headers['X-Telegram-Init-Data']});
    if(url.endsWith('/api/plans'))return json({ok:true,plans:[
      {id:1,months:3,title:'3 Months',price_toman:500000},
      {id:2,months:6,title:'Fake',price_toman:0}
    ]});
    if(url.includes('/api/market/catalog?kind=stars'))return json({ok:true,enabled:true,products:[
      {sku:'star_100',kind:'stars',title:'100 stars',quantity:100,price_toman:150000},
      {sku:'bad',kind:'stars',title:'Unavailable',price_toman:-1}
    ]});
    throw new Error('unexpected path');
  };
  try {
    assert.equal(api.hasTrustedSameOriginApi(),true);
    const plans=await api.loadPlans(new AbortController().signal);
    const stars=await api.loadStars(new AbortController().signal);
    assert.deepEqual(plans.map(p=>p.price_toman),[500000]);
    assert.deepEqual(stars.products.map(p=>p.sku),['star_100']);
    assert.equal(calls.length,2);
    assert.ok(calls.every(c=>c.method==='GET'&&c.auth===undefined));
  }finally{globalThis.fetch=prior}
});

test('mandatory-channel gate discards all private wallet and order values',async()=>{
  const api=await boot();
  let requests=[];const prior=globalThis.fetch;
  globalThis.fetch=async(url,opts)=>{
    requests.push({url,method:opts.method,header:opts.headers['X-Telegram-Init-Data']});
    return json({ok:true,user:sample,required_channels:[{title:'Join first'}]});
  };
  try {
    const account=await api.loadMember(new AbortController().signal);
    assert.equal(account.state,'join_required');
    assert.equal(account.user,null);
    assert.deepEqual(account.marketOrders,[]);
    assert.equal(requests.length,1);
    assert.equal(requests[0].header,'signed_test_fixture');
  }finally{globalThis.fetch=prior}
});

test('signed same-origin requests can read verified wallet and both order collections',async()=>{
  const api=await boot();
  let requests=[];const prior=globalThis.fetch;
  globalThis.fetch=async(url,opts)=>{
    requests.push({url,method:opts.method,header:opts.headers['X-Telegram-Init-Data']});
    if(url.endsWith('/api/me'))return json({ok:true,user:sample,required_channels:[]});
    return json({ok:true,orders:[{code:'BP-TEST',status:'paid',price_toman:500,created_at:'2026-10-18T00:00:00Z'}]});
  };
  try{
    const result=await api.loadMember(new AbortController().signal);
    assert.equal(result.state,'member');
    assert.equal(result.user.balance_toman,85000);
    assert.equal(result.marketOrders.length,1);
    assert.deepEqual(requests.map(x=>x.method),['GET','GET']);
    assert.ok(requests.every(x=>x.url.startsWith('https://shop.example.test/api/') && x.header==='signed_test_fixture'));
  }finally{globalThis.fetch=prior}
});

test('guest has no authenticated calls and malformed API data never becomes a real price',async()=>{
  const api=await boot({initData:''});
  let requested=0;const prior=globalThis.fetch;
  globalThis.fetch=async()=>{requested++;return json({ok:true,plans:[{id:1,months:3,title:'bad',price_toman:'100'}]})};
  try{
    const guest=await api.loadMember(new AbortController().signal);
    assert.equal(guest.state,'guest');assert.equal(guest.user,null);
    assert.equal(requested,0);
    const plans=await api.loadPlans(new AbortController().signal);
    assert.deepEqual(plans,[]);
  }finally{globalThis.fetch=prior}
});
