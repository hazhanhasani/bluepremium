import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../src/parts/021.part',import.meta.url),'utf8');
const ui=await readFile(new URL('../src/parts/022.part',import.meta.url),'utf8');

function setup({stored=true,key='secret-never-returned',walletOk=true,smmOk=false}={}){
  const paths=[],requests=[];
  const make=new Function('api','requireAdmin','getProviderSecret','tgRequest','tgList','tgProducts','bpName',
    source+';return tgMarketApi;');
  const db={prepare:sql=>{
    paths.push(sql);
    if(sql.includes('provider_secrets'))return {bind:()=>({first:async()=>stored?{present:1}:null})};
    if(sql.includes('bp_market_orders'))return {all:async()=>({results:[{kind:'stars',status:'delivered',total:1}]})};
    throw Error('unexpected SQL in health check: '+sql);
  }};
  const market=make(
    (data,status=200)=>({status,...data}),
    async()=>true,
    async()=>key,
    async(_key,method,path)=>{
      requests.push(path);
      if(path==='/api/wallet')return {ok:walletOk,http_status:walletOk?200:401,data:{balanceTon:3}};
      return {ok:smmOk,http_status:smmOk?200:403,data:smmOk?{items:[{id:1}]}:{},message:'forbidden'};
    },
    d=>d.items||[],
    async()=>[],
    x=>String(x||'')
  );
  return {paths,requests,run:()=>market({method:'GET'},{DB:db},
    {pathname:'/api/admin/market/health'},null)};
}

test('a shared key remains configured when SMM endpoint refuses access',async()=>{
  const app=setup(),r=await app.run();
  assert.equal(r.ok,true);
  assert.equal(r.provider.configured,true);
  assert.equal(r.provider.tgtools.stored,true);
  assert.equal(r.provider.tgtools.key_state,'configured');
  assert.equal(r.provider.tgtools.connected,true);
  assert.equal(r.provider.tgtools.shared_with_premium,true);
  assert.equal(r.provider.smm.status,'provider_error');
  assert.deepEqual(app.requests,['/api/wallet','/api/Purchase/smm/bundles?lang=fa']);
  assert.equal(JSON.stringify(r).includes('secret-never-returned'),false);
});

test('stored but unreadable encrypted key is never called missing',async()=>{
  const app=setup({stored:true,key:''}),r=await app.run();
  assert.equal(r.provider.tgtools.key_state,'decryption_failed');
  assert.equal(r.provider.tgtools.stored,true);
  assert.equal(r.provider.configured,false);
  assert.equal(app.requests.length,0);
});

test('only an absent key reports missing',async()=>{
  const app=setup({stored:false,key:''}),r=await app.run();
  assert.equal(r.provider.tgtools.key_state,'missing');
  assert.equal(r.provider.tgtools.stored,false);
});

test('key registration differs from permission/connection failures',async()=>{
  const r=await setup({stored:true,key:'configured',walletOk:false}).run();
  assert.equal(r.provider.tgtools.configured,true);
  assert.equal(r.provider.tgtools.connected,false);
  assert.equal(r.provider.tgtools.http_status,401);
});

test('mobile status text explains the single shared TG Tools key',()=>{
  assert.match(ui,/ثبت‌شده · مشترک با پرمیوم/);
  assert.match(ui,/کلید مشترک TG Tools/);
  assert.match(ui,/خطای کاتالوگ SMM به معنی ثبت‌نشدن کلید نیست/);
  assert.match(ui,/ذخیره‌شده · مشکل در بازیابی کلید/);
});
