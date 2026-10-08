import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const part = await readFile(new URL('../src/parts/004.part', import.meta.url), 'utf8');
const start = part.indexOf('function blupalInvoiceFields(');
const end = part.indexOf('function publicPaymentInstructions(');
assert.ok(start >= 0 && end > start, 'Payment helpers are present');
const factory = new Function('fetch', part.slice(start, end) +
  ';return { blupalInvoiceFields, blupalAmountIsReasonable, blupalHostedPaymentDetails };');

const expectedRial = 41_070_000;
const exactRial = 41_360_581;
const testCard = '6037991234567890'; // Fixture only, never a payment destination.
const html = `<button onclick="copyToClipboard('${testCard}', 'card', this)"></button>
  <button onclick="copyToClipboard('${exactRial}', 'amount', this)"></button>`;

const fakeFetch = async () => ({
  ok: true,
  headers: { get: () => 'text/html; charset=utf-8' },
  text: async () => html,
});
const payment = factory(fakeFetch);

test('invoice parser reads nested payment details', () => {
  const details = payment.blupalInvoiceFields({
    data: { invoice: { invoice_id: 'INV-1', payment_details: {
      card_number: testCard, final_amount: exactRial, amount: expectedRial,
    } } },
  }, expectedRial);
  assert.equal(details.card_number, testCard);
  assert.equal(details.final_amount_rial, exactRial);
});

test('invoice parser never invents exact amount', () => {
  const details = payment.blupalInvoiceFields({ data: { invoice_id: 'INV-2', amount: expectedRial } }, expectedRial);
  assert.equal(details.final_amount_rial, 0);
});

test('hosted invoice card and fee are parsed without redirecting buyer', async () => {
  const p = await payment.blupalHostedPaymentDetails('https://blupal.top/invoice/TEST', expectedRial, exactRial);
  assert.deepEqual(p, { card_number: testCard, final_amount_rial: exactRial });
});

test('rejects untrusted invoice hosts and mismatched amounts', async () => {
  assert.equal(await payment.blupalHostedPaymentDetails('https://blupal.top.evil.example/invoice', expectedRial), null);
  assert.equal(await payment.blupalHostedPaymentDetails('http://blupal.top/invoice', expectedRial), null);
  assert.equal(await payment.blupalHostedPaymentDetails('https://blupal.top/invoice', expectedRial, exactRial + 1), null);
  assert.equal(await payment.blupalHostedPaymentDetails('https://blupal.top/invoice', expectedRial * 0.5, exactRial), null);
});

test('storefront inline script compiles and renders prices', async () => {
  const ui = await readFile(new URL('../src/parts/013.part', import.meta.url), 'utf8');
  const html = new Function('BRAND','BRAND_FA', ui + ';return storeHtmlV4();')('Blue Premium','بلوپرمیوم');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, 'Inline script exists');
  assert.doesNotThrow(() => new Function(script));
  assert.match(script, /fetch\('\/api\/plans/);
  assert.match(script, /\/\\D\+\/g/);
});
