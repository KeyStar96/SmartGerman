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

  test('keeps confirmation tokens instead of treating ?lang= as a legacy homepage', async ({
    page,
  }) => {
    await page.goto('/auth/confirm?token_hash=ungueltig&type=signup&lang=de');

    await expect(page).toHaveURL(/\/de\/login\?status=/);
    await expect(page).not.toHaveURL(/\/de\/?$/);
    await expect(page.getByRole('status')).toBeVisible();
  });

  test('PKCE callback path also keeps the one-time code', async ({ page }) => {
    await page.goto('/auth/callback?code=ungueltig&lang=de');

    await expect(page).toHaveURL(/\/de\/login\?status=/);
    await expect(page).not.toHaveURL(/\/de\/?$/);
    await expect(page.getByRole('status')).toBeVisible();
  });
});
