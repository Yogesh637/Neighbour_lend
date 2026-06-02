import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Helper to poll and parse the latest OTP from backend log files
function getLatestOtp(email) {
  const logDir = 'C:\\Users\\dreamz\\.gemini\\antigravity-ide\\brain\\b39d689d-cba9-4a6f-8efc-adb180303ed0\\.system_generated\\tasks';
  if (!fs.existsSync(logDir)) return null;

  const files = fs.readdirSync(logDir)
    .filter(f => f.endsWith('.log'))
    .map(f => ({ name: f, time: fs.statSync(path.join(logDir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);

  for (const fileObj of files) {
    const filePath = path.join(logDir, fileObj.name);
    const content = fs.readFileSync(filePath, 'utf8');
    // Pattern matches: "OTP Code for test@gmail.com: 123456"
    const regex = new RegExp(`OTP Code for ${email.replace('.', '\\.')}: (\\d{6})`);
    const match = content.match(regex);
    if (match) return match[1];
  }
  return null;
}

test.describe('Marketplace Booking & Checkout Flow E2E', () => {
  const uniqueId = Date.now();
  const renterEmail = `renter_${uniqueId}@test.com`;
  const renterPassword = 'password123';
  const itemName = `Tent_${uniqueId}`;

  test('complete renter-owner booking lifecycle', async ({ page }) => {
    // ----------------------------------------------------
    // Step 1: Register Renter
    // ----------------------------------------------------
    await page.goto('/register');
    await page.fill('input[placeholder="Email address"]', renterEmail);
    await page.fill('input[placeholder="Location / Address"]', 'Indiranagar, Bangalore');
    await page.fill('input[placeholder="Password"]', renterPassword);
    await page.click('button[type="submit"]');

    // Wait for verify OTP screen
    await expect(page).toHaveURL('/verify-otp', { timeout: 10000 });
    
    // Poll for the OTP code from the logs
    let otpCode = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      await page.waitForTimeout(1000);
      otpCode = getLatestOtp(renterEmail);
      if (otpCode) break;
    }
    
    // If OTP wasn't found (fallback for local run configurations), use a default/dummy one
    if (!otpCode) {
      console.warn('Could not find OTP in logs. Mocking OTP input...');
      otpCode = '000000'; // Fallback
    }

    await page.fill('input[name="otp"]', otpCode);
    await page.click('button[type="submit"]');

    // Should redirect to marketplace (homepage)
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // Logout renter
    await page.click('text=Logout');
    await expect(page).toHaveURL('/login', { timeout: 10000 });

    // ----------------------------------------------------
    // Step 2: Login Owner (Admin) and Create Listing
    // ----------------------------------------------------
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@gmail.com');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Go to Dashboard
    await page.click('text=Dashboard');
    await expect(page.locator('h2')).toContainText('User Hub');

    // Open add listing modal
    await page.click('text=Lend Item');
    await page.fill('input[placeholder="e.g. Cordless Drill"]', itemName);
    await page.fill('textarea[placeholder*="Provide details"]', 'A premium quality waterproof camping tent.');
    await page.fill('input[placeholder="Price per day"]', '150');
    
    // Setup dialog listener to auto-accept "Item published successfully!" alert
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('published successfully');
      await dialog.accept();
    });

    await page.click('button[type="submit"]');
    
    // Log out Owner
    await page.click('text=Logout');
    await expect(page).toHaveURL('/login', { timeout: 10000 });

    // ----------------------------------------------------
    // Step 3: Login Renter & Reserve Item
    // ----------------------------------------------------
    await page.fill('input[name="email"]', renterEmail);
    await page.fill('input[name="password"]', renterPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Filter by CampingGear category or search
    await page.fill('input[placeholder*="Search by title"]', itemName);
    
    // Find the item card and click on it to open RentModal
    const cardTitle = page.locator(`h3:has-text("${itemName}")`);
    await expect(cardTitle).toBeVisible({ timeout: 15000 });
    await cardTitle.click();

    // Fill dates in RentModal (Check-in/Check-out dates auto-populate, so click reserve)
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('submitted successfully');
      await dialog.accept();
    });

    await page.click('button[type="submit"]'); // Confirm & Reserve button
    
    // Wait for the modal to close
    await page.click('text=Cancel'); // Close/dismiss if needed or wait for backdrop click
    
    // Log out Renter
    await page.click('text=Logout');
    await expect(page).toHaveURL('/login', { timeout: 10000 });

    // ----------------------------------------------------
    // Step 4: Login Owner & Approve Booking Request
    // ----------------------------------------------------
    await page.fill('input[name="email"]', 'admin@gmail.com');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Go to dashboard owner tab
    await page.click('text=Dashboard');
    await page.click('text=Owner Panel');

    // Auto accept request alert
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('approved successfully');
      await dialog.accept();
    });

    // Locate the approve button in pending requests matching the items name
    const approveBtn = page.locator(`div:has-text("${itemName}") >> button:has-text("Approve")`);
    await expect(approveBtn.first()).toBeVisible({ timeout: 15000 });
    await approveBtn.first().click();

    // Log out Owner
    await page.click('text=Logout');

    // ----------------------------------------------------
    // Step 5: Verify Active Rental for Renter
    // ----------------------------------------------------
    await page.fill('input[name="email"]', renterEmail);
    await page.fill('input[name="password"]', renterPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10000 });

    await page.click('text=Dashboard');
    await page.click('text=Renter Panel');

    // Renter should see active or pending rental matching the item name
    const activeRentalRow = page.locator(`table >> text=${itemName}`);
    await expect(activeRentalRow.first()).toBeVisible({ timeout: 10000 });
  });
});
