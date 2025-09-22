import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the main heading is visible
    await expect(page.getByText('Upload, process, and share videos instantly!')).toBeVisible();
    
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Spark/);
  });

  test('should display video cards when videos are available', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if video cards container exists
    const videoGrid = page.locator('[data-testid="video-grid"]');
    await expect(videoGrid).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    await page.goto('/');
    
    // Check for loading indicators
    const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    await expect(loadingSpinner).toBeVisible();
  });

  test('should display empty state when no videos', async ({ page }) => {
    // Mock empty response
    await page.route('**/getVideos', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/');
    
    // Wait for empty state to appear
    await expect(page.getByText('No videos yet')).toBeVisible();
  });

  test('should handle authentication state', async ({ page }) => {
    await page.goto('/');
    
    // Check if sign in button is visible when not authenticated
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await expect(signInButton).toBeVisible();
  });
});
