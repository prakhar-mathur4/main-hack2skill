import { test, expect } from '@playwright/test';

test.describe('Mental Wellness Tracker E2E Flows', () => {
  
  test('Dashboard and Seeding Flow', async ({ page }) => {
    // 1. Visit the home page
    await page.goto('/');

    // 2. Verify title is set
    await expect(page).toHaveTitle(/MindCare/);

    // 3. Verify onboarding card exists (since database is empty at first visit)
    await expect(page.locator('text=A Fresh Start to Mental Balance')).toBeVisible();

    // 4. Click 'Seed Demo History' to populate data
    const seedBtn = page.locator('button:has-text("Seed Demo History")');
    if (await seedBtn.isVisible()) {
      await seedBtn.click();
      
      // Wait for the data to populate and charts to load (welcome banner shifts)
      await expect(page.locator('text=Log Your First Day')).not.toBeVisible();
      await expect(page.locator('text=Mood Score')).toBeVisible();
      await expect(page.locator('text=Stress Level')).toBeVisible();
      await expect(page.locator('text=Burnout Score')).toBeVisible();
    }
  });

  test('Result Support Mode Toggling', async ({ page }) => {
    await page.goto('/');

    // Find the Result Support toggle
    const toggleBtn = page.locator('button[title*="Result"]');
    await expect(toggleBtn).toBeVisible();

    // Click to toggle
    await toggleBtn.click();
    
    // Check that header text updates to "Result Season Mode Active" or similar
    await expect(page.locator('text=Result Season Mode Active')).toBeVisible();
  });

  test('Journal Write Flow', async ({ page }) => {
    // 1. Navigate to the journal page
    await page.goto('/journal');

    // 2. Locate textarea and type mock entry
    const textarea = page.locator('textarea[placeholder*="anxious"]');
    await expect(textarea).toBeVisible();
    await textarea.fill('Writing E2E tests is satisfying. Feel confident about this code.');

    // 3. Click submit
    const submitBtn = page.locator('button:has-text("Save & Analyze Entry")');
    await submitBtn.click();

    // 4. Verify that the entry details display and show AI insights summary
    await expect(page.locator('text=Journal Workspace')).toBeVisible();
    await expect(page.locator('text=Sentiment')).toBeVisible();
  });
});
