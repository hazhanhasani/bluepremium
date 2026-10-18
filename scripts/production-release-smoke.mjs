import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

/**
 * Production release drift and read-only health tests.
 * No credentials, mutations, checkout submissions, or database writes.
 */
const BASE = 'https://bluepremium.hazhanhasani4268-0f9.workers.dev';
const built = await readFile(new URL('../src/parts/030.part', import.meta.url), 'utf8');
const expectedBuild = built.match(/\bBP_V6_BUILD_ID\s*=\s*"(v6-[a-f0-9]+)"/)?.[1];
assert.ok(expectedBuild, 'V6 build marker not present in the committed Worker artifact');

async function get(path) {
  const url = new URL(path, BASE);
  assert.equal(url.origin, BASE, 'Requests must stay on the production Worker');
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'error',
        cache: 'no-store',
        headers: { Accept: path.startsWith('/api/') || path === '/health' ? 'application/json' : 'text/html' },
        signal: AbortSignal.timeout(12000),
      });
      return {response, body: await response.text()};
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1200 * (attempt + 1)));
    }
  }
  throw lastError;
}

test('deployed Worker health version matches GitHub main build artifact', async () => {
  const {response, body} = await get('/health');
  assert.equal(response.status, 200);
  const data = JSON.parse(body);
  assert.equal(data.ok, true);
  assert.equal(data.service, 'bluepremium');
  assert.equal(data.ui, expectedBuild, 'Production V6 differs from GitHub main. Deploy the approved Worker build.');
});

test('Telegram Mini App home serves V6, real Telegram SDK, and no preview warning', async () => {
  const {response, body} = await get('/?from=telegram');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-bluepremium-ui'), expectedBuild);
  assert.match(response.headers.get('cache-control') || '', /no-store/i);
  assert.match(body, /telegram-web-app\.js/);
  assert.match(body, /<title>BluePremium \| بلوپرمیوم<\/title>/);
  assert.match(body, /bp-demo/);
});

test('V5 rollback route is retained independently of V6 storefront', async () => {
  const {response, body} = await get('/?legacy=1&tab=premium');
  assert.equal(response.status, 200);
  assert.match(body, /بلوپرمیوم|Blue Premium/i);
  assert.match(body, /Telegram Premium|پرمیوم/i);
  assert.doesNotMatch(body, /<title>BluePremium \| بلوپرمیوم<\/title>/);
});

test('premium plans are priced from the real backend', async () => {
  const {response, body} = await get('/api/plans');
  assert.equal(response.status, 200);
  const data = JSON.parse(body);
  assert.equal(data.ok, true);
  assert.ok(Array.isArray(data.plans) && data.plans.length > 0);
  assert.ok(data.plans.some(p => Number.isSafeInteger(p.id) && Number.isFinite(p.price_toman) && p.price_toman > 0));
});

test('Telegram Stars catalog returns positive-priced product options', async () => {
  const {response, body} = await get('/api/market/catalog?kind=stars');
  assert.equal(response.status, 200);
  const data = JSON.parse(body);
  assert.equal(data.ok, true);
  assert.equal(data.selected, 'stars');
  assert.equal(data.enabled, true);
  assert.ok(Array.isArray(data.products) && data.products.some(p => p.kind === 'stars' && Number.isFinite(p.price_toman) && p.price_toman > 0));
});

test('private /api/me remains protected without Telegram initData', async () => {
  const {response, body} = await get('/api/me');
  assert.equal(response.status, 401);
  const data = JSON.parse(body);
  assert.equal(data.ok, false);
  assert.equal(data.error, 'telegram_auth_required');
});
