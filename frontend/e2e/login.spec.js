import { test, expect } from '@playwright/test';

test.describe('Login E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('should render login page correctly', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Welcome Back');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Login');
  });

  test('should show validation error messages on empty submission', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show error on incorrect credentials login', async ({ page }) => {
    await page.fill('input[name="email"]', 'wronguser@gmail.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Check if error banner or notification appears
    const errorMsg = page.locator('text=Invalid credentials').or(page.locator('text=User not found'));
    await expect(errorMsg.first()).toBeVisible({ timeout: 15000 });
  });

  test('should log in successfully with seeded admin account', async ({ page }) => {
    await page.fill('input[name="email"]', 'admin@gmail.com');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard and show navbar or search bar
    await expect(page).toHaveURL('/', { timeout: 15000 });
    // Check for user initials avatar or logout/dashboard buttons
    await expect(page.locator('nav')).toBeVisible();
  });
});
