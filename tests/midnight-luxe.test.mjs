import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const part = async n => readFile(new URL('../src/parts/' + String(n).padStart(3, '0') + '.part', import.meta.url), 'utf8');

test('midnight visual layer decorates storefront without moving or deleting purchase DOM', async () => {
  const code = await part(28);
  const decorate = new Function(code + ';return bpMidnightDecorate;')();
  const markup = '<html lang="fa" dir="rtl"><head></head><body><main class="shell"><section id="checkout"><button id="buy">Buy</button></section><section id="bp_account"></section><nav class="bp-app-nav" aria-label="منو"></nav></main></body></html>';
  const output = decorate(markup);
  assert.match(output, /id="bp-midnight-v5"/);
  assert.match(output, /id="checkout"/);
  assert.match(output, /id="buy"/);
  assert.match(output, /id="bp_account"/);
  assert.match(output, /aria-label="منو"/);
  assert.equal((output.match(/<style/g) || []).length, 1);
});

test('new skin respects current navigation, original illustrations and small screens', async () => {
  const code = await part(28);
  const css = new Function(code + ';return bpMidnightCss;')()();
  const route = await part(1);
  assert.match(route, /bpMidnightDecorate\(bpMotionDecorate\(/);
  assert.match(css, /\.bp-app-nav button\[aria-current="page"\]/);
  assert.match(css, /\.bp-quick-card/);
  assert.match(css, /\.bp-category/);
  assert.match(css, /\.bp-hero-art/);
  assert.match(css, /\.bp-market-product/);
  assert.match(css, /@media\(max-width:355px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /focus-visible/);
  assert.doesNotMatch(code, /fetch\s*\(|localStorage|sessionStorage|wallet\/purchase|\/api\/orders/);
});
