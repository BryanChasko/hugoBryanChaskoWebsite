import { test, expect } from '@playwright/test';

test('Menu items are clickable on mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
  await page.goto('http://localhost:1313/');
  
  // Wait for nav to load
  await page.waitForSelector('#menu', { state: 'visible' });
  
  // Get menu styles
  const menuVisible = await page.locator('#menu').isVisible();
  console.log('Menu visible:', menuVisible);
  
  // Get first menu link
  const firstLink = page.locator('#menu li a').first();
  const href = await firstLink.getAttribute('href');
  const text = await firstLink.textContent();
  const isVisible = await firstLink.isVisible();
  
  console.log(`First menu link: "${text}" -> ${href}`);
  console.log(`Is visible: ${isVisible}`);
  
  // Try to click
  try {
    await firstLink.click();
    console.log('✓ Click successful');
  } catch (e) {
    console.log('✗ Click failed:', e.message);
    throw e;
  }
});
