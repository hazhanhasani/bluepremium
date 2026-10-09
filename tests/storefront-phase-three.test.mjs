import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const part=async n=>readFile(new URL('../src/parts/'+String(n).padStart(3,'0')+'.part',import.meta.url),'utf8');
const [entry,motion,visual,market,phase]=await Promise.all([part(1),part(27),part(24),part(22),part(25)]);

test('microinteractions mount after the existing storefront and preserve all checkout sections',()=>{
  assert.match(entry,/bpMotionDecorate\(bpMarketPolishDecorate\(bpPhaseOneDecorate\(bpDecorateExperience\(tgDecorateStore\(bpDecorateStoreHtml\(storeHtmlV4\(\)\)\)\)\)\)\)/);
  const render=new Function(motion+';return bpMotionDecorate;')();
  const html=render('<html lang="fa" dir="rtl"><head></head><body><form id="tgCheckout"></form><section id="checkout"></section></body></html>');
  assert.match(html,/id="bp-motion-v1-style"/);
  assert.match(html,/id="tgCheckout"/);
  assert.match(html,/id="checkout"/);
  const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  assert.doesNotThrow(()=>new Function(script));
});

test('Premium pricing remains original and selection is accessible',()=>{
  assert.match(motion,/plans\.querySelectorAll\('\.plan\[data-id\]'\)/);
  assert.match(motion,/plan\.setAttribute\('role','button'\)/);
  assert.match(motion,/plan\.setAttribute\('tabindex','0'\)/);
  assert.match(motion,/plan\.setAttribute\('aria-pressed'/);
  assert.match(motion,/event\.key==='Enter'\|\|event\.key===' '/);
  assert.match(motion,/plan\.click\(\)/);
  assert.match(motion,/replacement\?\.focus\(\{preventScroll:true\}\)/);
  assert.match(visual,/getElementById\('plans'\)/);
});

test('visual feedback never creates or mutates orders, prices or wallet balances',()=>{
  assert.doesNotMatch(motion,/fetch\s*\(|localStorage|sessionStorage|wallet\/purchase|market\/orders|\/api\/admin/);
  assert.doesNotMatch(motion,/price_toman|blupal|INSERT INTO|UPDATE bp_wallet/);
  assert.match(market,/expected_price_toman:selected\.price_toman/);
  assert.match(phase,/fetchJSON\('\/api\/me',token\)/);
});

test('haptics are only attempted with optional Telegram WebApp API',()=>{
  assert.match(motion,/window\.Telegram\?\.WebApp\?\.HapticFeedback/);
  assert.match(motion,/h\.impactOccurred\('selection'\)|pulse\('selection'\)/);
  assert.match(motion,/typeof h\.selectionChanged==='function'/);
  assert.match(motion,/typeof h\.impactOccurred==='function'/);
  assert.match(motion,/nav\.addEventListener\('click'/);
  assert.match(motion,/document\.getElementById\('tgItems'\)/);
});

test('order state highlights are noninvasive and clipboard acknowledgment uses real feedback',()=>{
  assert.match(motion,/MutationObserver\(readStatus\)/);
  assert.match(motion,/statusCache=new WeakMap\(\)/);
  assert.match(motion,/target\.classList\.add\('bp-status-changed'\)/);
  assert.match(motion,/کپی شد/);
  assert.match(motion,/toast\.setAttribute\('role','status'\)/);
  assert.match(motion,/toast\.hidden=true/);
});

test('editorial motion is accessible and disabled when user requests reduced motion',()=>{
  const css=new Function(motion+';return bpMotionCss;')()();
  assert.match(css,/bp-motion-v1/);
  assert.match(css,/bpSelectPop/);
  assert.match(css,/bpEnterScreen/);
  assert.match(css,/focus-visible/);
  assert.match(css,/bpSoftPulse/);
  assert.match(css,/bp-order-fresh/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/animation-duration:\.01ms!important/);
  assert.match(css,/transition-duration:\.01ms!important/);
  assert.match(css,/scroll-behavior:auto!important/);
});
