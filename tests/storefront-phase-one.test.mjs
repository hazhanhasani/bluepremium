import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const part=async n=>readFile(new URL('../src/parts/'+String(n).padStart(3,'0')+'.part',import.meta.url),'utf8');
const [routes,profile,market,visual,phase]=await Promise.all([part(1),part(19),part(20),part(24),part(25)]);

test('phase one is layered over existing verified checkout and not a replacement',()=>{
  assert.match(routes,/bpPhaseOneDecorate\(bpDecorateExperience\(tgDecorateStore\(bpDecorateStoreHtml\(storeHtmlV4\(\)\)\)\)\)/);
  const decorate=new Function(phase+';return bpPhaseOneDecorate;')();
  const html=decorate('<html><head></head><body><div id="checkout"></div><div id="tgOrder"></div></body></html>');
  assert.match(html,/id="bp-phase-one-style"/);
  assert.match(html,/id="checkout"/);
  assert.match(html,/id="tgOrder"/);
  const script=html.match(/<script>([\s\S]+?)<\/script>/)?.[1];
  assert.ok(script);
  assert.doesNotThrow(()=>new Function(script));
});

test('home has real wallet and latest order links connected to existing tabs',()=>{
  assert.match(phase,/bp-overview-card wallet/);
  assert.match(phase,/bp-overview-card orders/);
  assert.match(phase,/نمای سریع آخرین سفارش ثبت‌شده/);
  assert.match(phase,/navigate\('account'\)/);
  assert.match(phase,/navigate\('orders'\)/);
  assert.match(phase,/navigate\('premium'\)/);
  assert.match(phase,/navigate\('stars'\)/);
  assert.match(visual,/window\.bpOpenTab=/);
});

test('wallet timeline uses only authenticated API data and does not write ledger',()=>{
  assert.match(phase,/fetchJSON\('\/api\/me',token\)/);
  assert.match(phase,/state\.user\.transactions/);
  assert.match(phase,/bp-timeline-row/);
  assert.match(phase,/new Intl\.DateTimeFormat\('fa-IR-u-ca-persian'/);
  assert.match(profile,/bp:account-updated/);
  assert.match(profile,/bpAccountSnapshot=/);
  assert.doesNotMatch(phase,/localStorage|sessionStorage/);
  assert.doesNotMatch(phase,/wallet\/purchase|\/api\/admin\/|INSERT INTO|UPDATE bp_wallet/);
});

test('unified order history is filtered by paid statuses without exposing tokens',()=>{
  assert.match(phase,/fetchJSON\('\/api\/market\/my-orders',token\)/);
  assert.match(phase,/state\.user\?\.orders/);
  assert.match(phase,/state\.market\.map/);
  assert.match(phase,/state\.filter==='delivered'/);
  assert.match(phase,/state\.filter==='pending'/);
  assert.match(phase,/state\.filter==='issue'/);
  assert.match(phase,/orderItems\.replaceChildren/);
  assert.match(market,/created_at:order\.created_at/);
  assert.doesNotMatch(phase,/order\.token|initDataUnsafe|public_token_hash|blupal_final_amount/);
});

test('fail-closed if Telegram session or join membership not satisfied',()=>{
  assert.match(phase,/if\(!token\)\{state\.guest=true/);
  assert.match(phase,/if\(pending\.length\)/);
  assert.match(phase,/state\.market=\[\];state\.error='join_required'/);
  assert.match(phase,/state\.market=\[\];state\.error='profile_unavailable'/);
  assert.match(phase,/for\(const \[key,label\]of options\)/);
});

test('phase one follows warm editorial system with keyboard and mobile layouts',()=>{
  const styles=new Function(phase+';return bpPhaseOneCss;')()();
  assert.match(styles,/#F7E6D9/);
  assert.match(styles,/#E6EDE4/);
  assert.match(styles,/#FFFDF9/);
  assert.match(styles,/bp-order-row/);
  assert.match(styles,/bp-overview/);
  assert.match(styles,/focus-visible/);
  assert.match(styles,/max-width:650px/);
  assert.match(styles,/prefers-reduced-motion/);
});
