import { test as base, expect } from '@playwright/test';

// Extend the base test with custom fixtures
export const test = base.extend({
  // Add a custom fixture that waits for the app to be ready
  page: async ({ page }, use) => {
    // Navigate to the page
    await page.goto('/index.html');
    
    // Wait for critical elements to be available
    await page.waitForSelector('#teamName');
    await page.waitForSelector('#captain');
    await page.waitForSelector('.color-option');
    
    await use(page);
  }
});

export { expect }; 