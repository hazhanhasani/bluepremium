import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const part=async n=>readFile(new URL('../src/parts/'+String(n).padStart(3,'0')+'.part',import.meta.url),'utf8');

test('reboot layer is mounted after Midnight Luxe without removing purchase controls',async()=>{
 const [route,refinement]=await Promise.all([part(1),part(29)]);
 assert.match(route,/bpRefineDecorate\(bpMidnightDecorate\(/);
 const decorator=new Function(refinement+';return bpRefineDecorate;')();
 const markup='<html lang="fa" dir="rtl"><head></head><body><section id="checkout"></section><button id="buy"></button></body></html>';
 const result=decorator(markup);
 assert.match(result,/bp-refine-v51/);
 assert.match(result,/id="checkout"/);
 assert.match(result,/id="buy"/);
 const client=result.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(client);
 assert.doesNotThrow(()=>new Function(client));
});

test('four real product pathways and five visible tabs use existing route handlers',async()=>{
 const code=await part(29);
 assert.match(code,/data-bp-go="premium"/);
 assert.match(code,/data-bp-go="stars"/);
 assert.match(code,/data-bp-kind="gift"/);
 assert.match(code,/data-bp-kind="catalog"/);
 assert.match(code,/grid\.appendChild\(card\)/);
 assert.match(code,/bp-v5-service-card/);
 assert.match(code,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(code,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(code,/\[data-bp-tab=\\"catalog\\"\]\{display:none!important\}/);
 assert.match(code,/window\.bpOpenTab/);
});

test('visual refinement never changes money, API requests, accounts or payment logic',async()=>{
 const code=await part(29);
 assert.doesNotMatch(code,/fetch\s*\(|localStorage|sessionStorage|INSERT INTO|UPDATE bp_wallet|payment_provider|blupalRequest|tgQuoteButton/);
 assert.match(code,/prefers-reduced-motion/);
 assert.match(code,/focus-visible|bp-v5-wallet/);
 assert.match(code,/Telegram\?\.WebApp\?\.initDataUnsafe\?\.user/);
 assert.match(code,/textContent/);
});
