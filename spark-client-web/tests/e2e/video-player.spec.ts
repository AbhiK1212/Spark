import { test, expect } from '@playwright/test';

test.describe('Video Player', () => {
  test('should load video player page', async ({ page }) => {
    // Mock video data
    await page.route('**/getVideos', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          filename: 'test-video.mp4',
          title: 'Test Video',
          description: 'Test Description',
          status: 'processed',
          duration: 120,
          thumbnailUrl: 'https://example.com/thumb.jpg',
          views: 0,
          uid: 'test-user'
        }])
      });
    });

    await page.goto('/watch/test-video');
    
    // Check if video player is visible
    const videoPlayer = page.locator('video');
    await expect(videoPlayer).toBeVisible();
  });

  test('should display video title and description', async ({ page }) => {
    // Mock video data
    await page.route('**/getVideos', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          filename: 'test-video.mp4',
          title: 'Test Video Title',
          description: 'Test Video Description',
          status: 'processed',
          duration: 120,
          thumbnailUrl: 'https://example.com/thumb.jpg',
          views: 0,
          uid: 'test-user'
        }])
      });
    });

    await page.goto('/watch/test-video');
    
    // Check if title and description are visible
    await expect(page.getByText('Test Video Title')).toBeVisible();
    await expect(page.getByText('Test Video Description')).toBeVisible();
  });

  test('should show loading state while video loads', async ({ page }) => {
    await page.goto('/watch/test-video');
    
    // Check for loading indicators
    const loadingSpinner = page.locator('[data-testid="video-loading"]');
    await expect(loadingSpinner).toBeVisible();
  });

  test('should display error message when video fails to load', async ({ page }) => {
    // Mock video data with invalid URL
    await page.route('**/getVideos', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          filename: 'test-video.mp4',
          title: 'Test Video',
          description: 'Test Description',
          status: 'failed',
          duration: 0,
          thumbnailUrl: 'https://example.com/thumb.jpg',
          views: 0,
          uid: 'test-user'
        }])
      });
    });

    await page.goto('/watch/test-video');
    
    // Check for error message
    await expect(page.getByText(/unavailable|error|failed/i)).toBeVisible();
  });
});
