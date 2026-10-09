import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const load=async n=>readFile(new URL('../src/parts/'+String(n).padStart(3,'0')+'.part',import.meta.url),'utf8');
const [ui,api,account,market]=await Promise.all([load(24),load(1),load(19),load(22)]);

test('custom editorial identity replaces the generic blue gradient UI',()=>{
  const css=new Function(ui+';return bpExperienceCss;')()();
  assert.match(css,/#F7F4EE/);
  assert.match(css,/#30262D/);
  assert.match(css,/#F5D2C3/);
  assert.match(css,/#CBDCD0/);
  assert.match(css,/#FAEEE0/);
  assert.match(css,/body\.bp-shell-v3/);
  assert.match(css,/\.bp-market-view \.tg-store/);
  assert.match(css,/\.bp-app-nav/);
  assert.match(css,/\.bp-quick-icon \.bp-art/);
  assert.match(css,/\.tg-item-art/);
  assert.match(css,/prefers-reduced-motion/);
});

test('Persian font is loaded with local accessible fallback',()=>{
  const decorator=new Function(ui+';return bpDecorateExperience;')();
  const output=decorator('<html lang="fa" dir="rtl"><head></head><body></body></html>');
  assert.match(output,/fonts\.googleapis\.com/);
  assert.match(output,/Vazirmatn/);
  assert.match(output,/Segoe UI/);
  assert.match(output,/bp-experience-v4/);
  const code=output.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(code);
  assert.doesNotThrow(()=>new Function(code));
});

test('feature cards and sections use authored SVG illustrations, not emojis',()=>{
  const source=ui.slice(ui.indexOf('function bpExperienceClient()'));
  for(const type of ['premium','stars','gift','catalog','nft','steam','orders','account']){
    assert.match(source,new RegExp("type==='"+type+"'|"+type+":"));
  }
  assert.match(source,/class="bp-art bp-art-/);
  assert.match(source,/const art=\(type,variant='full'\)/);
  assert.match(source,/art\('premium'\)/);
  assert.match(source,/art\('stars'\)/);
  assert.match(source,/art\('gift'\)/);
  assert.match(source,/art\('nft'\)/);
  assert.match(source,/art\('steam'\)/);
  assert.doesNotMatch(source,/[👑⭐🎁💎🎮📦👤]/u);
});

test('runtime inserts stable artwork in price cards without changing cart state',()=>{
  assert.match(ui,/new MutationObserver\(drawProducts\)/);
  assert.match(ui,/\.tg-item:not\(\[data-bp-art\]\)/);
  assert.match(ui,/card\.dataset\.bpArt='1'/);
  assert.match(ui,/wrapper\.innerHTML=art\(kind\)/);
  assert.doesNotMatch(ui,/fetch\(['"]\/api\/market\/orders/);
  assert.match(api,/bpDecorateExperience\(tgDecorateStore/);
});

test('sales logic and six tab navigation remain intact',()=>{
  assert.match(ui,/data-bp-go="premium"/);
  assert.match(ui,/data-bp-go="stars"/);
  assert.match(ui,/for\(const name of \['home','premium','market','orders','account'\]\)/);
  assert.match(ui,/window\.bpOpenTab=/);
  assert.match(ui,/panel\.orders\.appendChild\(marketOrder\)/);
  assert.match(account,/bp_account/);
  assert.match(market,/tgStoreClient/);
});
