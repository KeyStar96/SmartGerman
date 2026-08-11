import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Wenn ein unangemeldeter User aufs Dashboard geht
    await page.goto('/de/dashboard');
    
    // Sollte er auf die Login-Seite umgeleitet werden
    await expect(page).toHaveURL(/.*\/login/);
    
    // Die Login-Seite sollte sichtbar sein
    await expect(page.locator('text=Willkommen zurück')).toBeVisible();
  });

  test('should block access to admin area for unauthenticated users', async ({ page }) => {
    // Wenn ein unangemeldeter User in den Admin-Bereich will
    await page.goto('/de/admin');
    
    // Sollte er ebenfalls auf Login umgeleitet werden
    await expect(page).toHaveURL(/.*\/login/);
  });
});
