import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'انتخاب سرویس' })).toBeVisible();
});

test('the reference-composition is product-first with four independent service cards', async ({ page }) => {
  await expect(page.locator('.bp-card')).toHaveCount(4);
  await expect(page.getByRole('navigation', { name: 'ناوبری اصلی' }).getByRole('button')).toHaveCount(5);
  await expect(page.locator('.bp-hero')).toBeVisible();
  await expect(page.getByRole('button', { name: /مشاهده اشتراک/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /مشاهده استارز/ })).toBeVisible();
  await page.screenshot({ path: `test-results/reference-composition-${test.info().project.name}.png`, fullPage: true });
});

test('Premium and Stars tabs are functional yet can never initiate a live purchase', async ({ page }) => {
  await page.getByRole('button', { name: /مشاهده اشتراک/ }).click();
  await expect(page.getByRole('heading', { name: 'اشتراک تلگرام پرمیوم' })).toBeVisible();
  await page.getByRole('button', { name: '۳ ماهه' }).click();
  await expect(page.getByRole('status')).toContainText('پروتوتایپ نمایشی');
  await expect(page.getByRole('button', { name: /خرید در نسخه نمایشی غیرفعال است/ })).toBeDisabled();

  await page.getByRole('navigation', { name: 'ناوبری اصلی' }).getByRole('button', { name: 'استارز' }).click();
  await expect(page.getByRole('heading', { name: 'استارز تلگرام' })).toBeVisible();
  await page.getByRole('button', { name: '۲۵۰ استارز' }).click();
  await expect(page.getByRole('button', { name: /پرداخت غیرفعال/ })).toBeDisabled();
});

test('gift and digital cards open accessible dialogs and close on Escape', async ({ page }) => {
  await page.getByRole('button', { name: /مشاهده هدایا/ }).click();
  const dialog = page.getByRole('dialog', { name: 'هدایای تلگرام' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'بستن' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: /مشاهده فروشگاه/ }).click();
  await expect(page.getByRole('dialog', { name: 'فروشگاه دیجیتال' })).toBeVisible();
  await page.getByRole('button', { name: 'بستن' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('account and order history show no mock balances or fabricated real orders', async ({ page }) => {
  await page.getByRole('button', { name: 'کیف پول' }).click();
  await expect(page.getByText('موجودی کیف پول')).toBeVisible();
  await expect(page.getByText('—', { exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'ناوبری اصلی' }).getByRole('button', { name: 'سفارش‌ها' }).click();
  await expect(page.getByRole('heading', { name: 'سفارش‌های من' })).toBeVisible();
  await expect(page.getByText(/به حساب تلگرام یا تاریخچه سفارش‌ها متصل نیست/)).toBeVisible();
});

test('layout remains within viewport without horizontal overflow', async ({ page }) => {
  await page.evaluate(() => document.fonts.ready);
  const { width, scrollWidth } = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(width + 1);
  await expect(page.locator('.bp-nav')).toBeInViewport();
});

test('the demo has no browser payment or account network calls', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', req => {
    if (/\/api\/|invoices|checkout|blupal|tgtools/i.test(req.url())) requests.push(req.url());
  });
  await page.getByRole('button', { name: /مشاهده اشتراک/ }).click();
  await page.getByRole('button', { name: '۶ ماهه' }).click();
  await page.getByRole('navigation', { name: 'ناوبری اصلی' }).getByRole('button', { name: 'حساب من' }).click();
  expect(requests).toEqual([]);
});
