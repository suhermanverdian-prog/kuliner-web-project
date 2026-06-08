import { test, expect } from '@playwright/test';

test.describe('Visual Regression & Contrast Audit (KEN OS)', () => {
  const pagesToTest = [
    { name: 'Dashboard', path: '/' },
    { name: 'Kasir', path: '/kasir' },
    { name: 'Menu', path: '/menu' },
    { name: 'Laporan', path: '/laporan' }
  ];

  for (const p of pagesToTest) {
    test(`Visual test for ${p.name}`, async ({ page }) => {
      await page.goto(p.path);
      // Tunggu animasi/skeletons selesai (KEN OS menggunakan delay minimal untuk skeleton)
      await page.waitForTimeout(1000); 
      
      // Ambil screenshot penuh untuk komparasi Visual Regression
      await expect(page).toHaveScreenshot(`${p.name.toLowerCase()}-full-page.png`, { fullPage: true });
    });
  }
});
