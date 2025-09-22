import { test, expect } from '@playwright/test';

test.describe('Video Upload', () => {
  test('should open upload modal when upload button is clicked', async ({ page }) => {
    await page.goto('/');
    
    // Click upload button
    const uploadButton = page.getByRole('button', { name: /upload/i });
    await uploadButton.click();
    
    // Check if upload modal is visible
    const uploadModal = page.locator('[data-testid="upload-modal"]');
    await expect(uploadModal).toBeVisible();
  });

  test('should close upload modal when close button is clicked', async ({ page }) => {
    await page.goto('/');
    
    // Open upload modal
    const uploadButton = page.getByRole('button', { name: /upload/i });
    await uploadButton.click();
    
    // Close upload modal
    const closeButton = page.getByRole('button', { name: /close/i });
    await closeButton.click();
    
    // Check if upload modal is hidden
    const uploadModal = page.locator('[data-testid="upload-modal"]');
    await expect(uploadModal).not.toBeVisible();
  });

  test('should show file input when upload area is clicked', async ({ page }) => {
    await page.goto('/');
    
    // Open upload modal
    const uploadButton = page.getByRole('button', { name: /upload/i });
    await uploadButton.click();
    
    // Check if file input is present
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
  });

  test('should validate file type', async ({ page }) => {
    await page.goto('/');
    
    // Open upload modal
    const uploadButton = page.getByRole('button', { name: /upload/i });
    await uploadButton.click();
    
    // Check file input accepts video files
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('accept', /video/);
  });
});
