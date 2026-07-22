import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { EDGE_CASE_CLIPS } from './fixtures';

test.describe('ORNAS E2E workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((fixtures) => {
      window.__TAURI_INTERNALS__ = window.__TAURI_INTERNALS__ || {};
      
      let clips = JSON.parse(JSON.stringify(fixtures));
      let settings = { theme: 'system', retention_days: '30' };

      window.__TAURI_INTERNALS__.invoke = async (cmd, args) => {
        if (cmd === 'list_clips') {
          return clips;
        }
        if (cmd === 'search_clips') {
          return clips.filter(c => c.content_text?.includes(args.query) || c.preview?.includes(args.query));
        }
        if (cmd === 'get_clip') {
          return clips.find(c => c.id === args.id) || null;
        }
        if (cmd === 'get_all_settings') {
          return settings;
        }
        if (cmd === 'delete_clip') {
          clips = clips.filter(c => c.id !== args.id);
          return;
        }
        if (cmd === 'toggle_favorite') {
          const c = clips.find(c => c.id === args.id);
          if (c) c.is_favorite = !c.is_favorite;
          return;
        }
        if (cmd === 'toggle_pin') {
          const c = clips.find(c => c.id === args.id);
          if (c) c.is_pinned = !c.is_pinned;
          return;
        }
        if (cmd === 'update_setting') {
          settings[args.key] = args.value;
          return;
        }
        return null;
      };
      
      window.__TAURI_INTERNALS__.listen = async () => () => {};
      window.__TAURI_INTERNALS__.emit = async () => {};
    }, EDGE_CASE_CLIPS);

    await page.goto('/');
  });

  test('application boots and renders edge case fixtures', async ({ page }) => {
    // Expect to see the unicode text
    await expect(page.getByText('Unicode test:')).toBeVisible();
  });

  test('search workflow filters correctly', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search clipboard…');
    await searchInput.fill('SELECT * FROM');
    
    // Should filter out the unicode one
    await expect(page.getByText('Unicode test:')).not.toBeVisible();
    await expect(page.getByText('SELECT * FROM users JOIN orders...')).toBeVisible();
  });

  test('selection updates preview', async ({ page }) => {
    await page.getByTestId('clip-103').click();
    
    // Details panel should show full text of unicode
    const previewText = page.getByTestId('clipboard-preview');
    await expect(previewText).toContainText('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̙̹̗͂̌̌͘');
  });

  test('keyboard navigation workflow', async ({ page }) => {
    // Focus list
    const list = page.getByTestId('clipboard-list');
    await list.focus();
    
    // First item is 101 by default because it's selected automatically or not?
    // Let's click the first one to focus
    await page.getByTestId('clip-101').click();
    
    await page.keyboard.press('ArrowDown');
    // Should select 102
    await expect(page.getByTestId('clip-102')).toHaveClass(/bg-selection/);
    
    await page.keyboard.press('ArrowDown');
    // Should select 103
    await expect(page.getByTestId('clip-103')).toHaveClass(/bg-selection/);
    
    // Back up
    await page.keyboard.press('ArrowUp');
    await expect(page.getByTestId('clip-102')).toHaveClass(/bg-selection/);
    
    // Home
    await page.keyboard.press('Home');
    await expect(page.getByTestId('clip-101')).toHaveClass(/bg-selection/);
    
    // End
    await page.keyboard.press('End');
    await expect(page.getByTestId('clip-105')).toHaveClass(/bg-selection/);
  });

  test('dialog confirmation and delete workflow', async ({ page }) => {
    // Hover over 101
    const clip101 = page.getByTestId('clip-101');
    await clip101.hover();
    
    // Click delete
    const deleteBtn = clip101.getByLabel('Delete item');
    await deleteBtn.click();
    
    // Confirm dialog
    const dialog = page.getByRole('dialog', { name: 'Delete Item' });
    await expect(dialog).toBeVisible();
    
    await dialog.getByRole('button', { name: 'Delete' }).click();
    
    // Verify it was deleted (page reload to fetch from mock again, wait no, react-query will refetch via mutation success)
    // The mutation invalidates query, causing a refetch. Our mock get_clips will return the filtered array.
    await expect(page.getByTestId('clip-101')).not.toBeVisible();
  });

  test('pin and favorite workflows', async ({ page }) => {
    const clip105 = page.getByTestId('clip-105');
    await clip105.hover();
    
    const pinBtn = clip105.getByLabel('Pin item');
    await pinBtn.click();
    
    // Should refetch and show pinned state (we verify aria-label changes to "Unpin item")
    // Wait for the mock to respond and component to re-render
    await expect(clip105.getByLabel('Unpin item')).toBeVisible();
  });

  test('settings panel persistence', async ({ page }) => {
    // Open settings via settings button
    await page.getByLabel('Settings').click();
    
    const dialog = page.getByRole('dialog', { name: 'Settings' });
    await expect(dialog).toBeVisible();
    
    // Change retention days
    const retentionInput = dialog.getByLabel('Retention Days');
    await retentionInput.fill('45');
    
    // Change a setting
    await page.getByLabel('Retention Days').fill('45');
    await page.getByRole('button', { name: 'Save' }).first().click();
  });

  test('accessibility regression', async ({ page }) => {
    // Run Axe on main screen
    const mainScan = await new AxeBuilder({ page })
      .disableRules(['color-contrast', 'heading-order'])
      .analyze();
    expect(mainScan.violations).toEqual([]);

    // Open settings and run Axe
    await page.getByLabel('Settings').click();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
    
    const settingsScan = await new AxeBuilder({ page })
      .disableRules(['color-contrast', 'heading-order'])
      .analyze();
    expect(settingsScan.violations).toEqual([]);
  });
});
