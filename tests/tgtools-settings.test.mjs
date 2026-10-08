import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = await readFile(new URL('../src/parts/021.part', import.meta.url),'utf8');
const ui = await readFile(new URL('../src/parts/022.part', import.meta.url),'utf8');

function setup() {
  const settings=new Map([
    ['market_nft_enabled','0'],
    ['market_nft_profit','15'],
    ['market_steam_enabled','0'],
    ['market_steam_profit','15'],
    ['market_stars_enabled','1'],
    ['market_stars_profit','15']
  ]);
  const changes=[];
  let batches=0;
  const env={DB:{
    prepare:sql=>({bind:(...params)=>({sql,params})}),
    batch:async statements=>{
      batches++;
      for(const p of statements){settings.set(String(p.params[0]),String(p.params[1]));changes.push([...p.params]);}
      return statements.map(()=>({success:true}));
    }
  }};
  const make=new Function('api','requireAdmin','readJson','getSetting','TG_TYPES','tgCache',
    source+';return tgMarketApi;');
  const handler=make(
    (data,status=200)=>({status,...data}),
    async()=>true,
    async request=>request.payload,
    async(db,key,fallback)=>settings.get(key)??fallback,
    ['stars','gift','smm','catalog','nft','steam'],
    new Map()
  );
  const send=(method,payload)=>handler({method,payload},env,
    {pathname:'/api/admin/market/settings'},null);
  return {send,settings,changes,get batchCount(){return batches}};
}

test('unsupported Steam/NFT activation rejects without writing profit',async()=>{
  for(const kind of ['nft','steam']){
    const app=setup();
    const result=await app.send('PATCH',{kind,enabled:true,profit_percent:55});
    assert.equal(result.status,409);
    assert.equal(result.error,'requires_live_quote_support');
    assert.equal(app.settings.get('market_'+kind+'_profit'),'15');
    assert.equal(app.batchCount,0);
  }
});

test('NFT and Steam margins remain independently editable',async()=>{
  for(const kind of ['nft','steam']){
    const app=setup();
    const result=await app.send('PATCH',{kind,profit_percent:30});
    assert.equal(result.ok,true);
    assert.equal(app.settings.get('market_'+kind+'_profit'),'30');
    assert.equal(app.settings.get('market_'+kind+'_enabled'),'0');
    assert.equal(app.batchCount,1);
  }
});

test('Stars enable toggle and profit update use one database batch',async()=>{
  const app=setup();
  const result=await app.send('PATCH',{kind:'stars',enabled:false,profit_percent:12.5});
  assert.equal(result.ok,true);
  assert.equal(app.settings.get('market_stars_enabled'),'0');
  assert.equal(app.settings.get('market_stars_profit'),'12.5');
  assert.equal(app.batchCount,1);
  assert.equal(app.changes.length,2);
});

test('invalid values fail without writes',async()=>{
  for(const body of [
    {kind:'nft',enabled:'true',profit_percent:23},
    {kind:'stars',enabled:false,profit_percent:501},
    {kind:'stars',enabled:false,profit_percent:null}
  ]){
    const app=setup();
    const r=await app.send('PATCH',body);
    assert.equal(r.ok,false);
    assert.equal(app.batchCount,0);
  }
});

test('settings advertise unsupported quote categories',async()=>{
  const app=setup();
  const result=await app.send('GET');
  assert.equal(result.ok,true);
  assert.equal(result.settings.nft.can_enable,false);
  assert.equal(result.settings.steam.can_enable,false);
  assert.equal(result.settings.stars.can_enable,true);
});

test('admin UI hides unsupported enable switch and shows inline feedback',()=>{
  const decorate=new Function(ui+';return tgDecorateAdmin;')();
  const rendered=decorate('<html><body></body></html>');
  const inline=rendered.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(inline);
  assert.doesNotThrow(()=>new Function(inline));
  assert.match(inline,/s\.can_enable!==false/);
  assert.match(inline,/if\(toggle\)body.enabled/);
  assert.match(inline,/tgNotice_/);
  assert.doesNotMatch(inline,/alert\('خطا در ذخیره:/);
});
