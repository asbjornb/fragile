import { test, expect } from '@playwright/test';

test.describe('Fragile Game', () => {
  test('should load game with hex grid', async ({ page }) => {
    await page.goto('/');
    
    // Check page title and header
    await expect(page).toHaveTitle(/Fragile/);
    await expect(page.locator('h1')).toHaveText('Fragile');
    
    // Check game container exists
    const gameContainer = page.locator('#game-container');
    await expect(gameContainer).toBeVisible();
    
    // Check canvas is rendered (PixiJS creates a canvas)
    const canvas = gameContainer.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Basic size check - canvas should have meaningful dimensions
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox?.width).toBeGreaterThan(200);
    expect(canvasBox?.height).toBeGreaterThan(200);
  });

  test('should render console logs for hex grid', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));
    
    await page.goto('/');
    
    // Wait a moment for rendering
    await page.waitForTimeout(1000);
    
    // Check that hex rendering logs appear
    expect(logs.some(log => log.includes('Container dimensions:'))).toBe(true);
    expect(logs.some(log => log.includes('PIXI app created:'))).toBe(true);
    expect(logs.some(log => log.includes('Rendered') && log.includes('hexes'))).toBe(true);
  });
});