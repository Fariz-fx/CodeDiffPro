import { test, expect } from '@playwright/test';

test.describe('CodeDiff Pro – Complete User Flow Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('CodeDiff Pro')).toBeVisible();
  });

  // ────────────────────────────────────────────────
  // INITIAL LOAD & LAYOUT
  // ────────────────────────────────────────────────
  test('loads two panels with diff highlighting visible', async ({ page }) => {
    const panels = page.locator('textarea');
    await expect(panels).toHaveCount(2);
    // Diff text container should have green/red diff highlights
    const diffHighlights = page.locator('.diff-added, .diff-removed');
    await expect(diffHighlights.first()).toBeVisible({ timeout: 5000 });
  });

  // ────────────────────────────────────────────────
  // PANEL MANAGEMENT
  // ────────────────────────────────────────────────

  test('add and remove panels with boundaries enforced', async ({ page }) => {
    const add = page.getByRole('button', { name: /Add panel/i });
    const remove = page.getByRole('button', { name: /Remove panel/i });
    
    // Starts with 2 panels. Click twice to reach the max of 4.
    await add.click(); // 3 panels
    await add.click(); // 4 panels
    await expect(page.locator('textarea')).toHaveCount(4);
    await expect(add).toBeDisabled(); // Check that it's disabled at max

    // Remove two panels to reach the min of 2.
    await remove.click(); // 3 panels
    await remove.click(); // 2 panels
    await expect(page.locator('textarea')).toHaveCount(2);
    await expect(remove).toBeDisabled(); // Check that it's disabled at min
  });

  // ────────────────────────────────────────────────
  // CODE EDITING & DIFF UPDATE
  // ────────────────────────────────────────────────
  test('editing text updates diff preview in real time', async ({ page }) => {
    const panel = page.locator('textarea').nth(1);
    const originalText = await panel.inputValue();
    const newLineText = 'console.log("New line");';
    await panel.fill(originalText + `\n${newLineText}`);
    const addedLine = page.locator('.diff-added').filter({ hasText: newLineText });
    await expect(addedLine).toBeVisible();
  });

  test('renaming file extension updates syntax highlighting', async ({ page }) => {
    const title = page.getByLabel('Panel Title').nth(1);
    const panel = page.locator('textarea').nth(1);
    await title.fill('file.json');
    await panel.fill('{\n  "key": "value"\n}');
    await expect(title).toHaveValue('file.json');
    // Prism JSON highlighting class should appear in preview
    const jsonHighlight = page.locator('span.token.property');
    await expect(jsonHighlight.first()).toBeVisible();
  });

  // ────────────────────────────────────────────────
  // SIMPLE + AI SUMMARY
  // ────────────────────────────────────────────────
  test('simple summary appears below panels', async ({ page }) => {
    await page.getByRole('button', { name: /Simple Summary/i }).click();
    await expect(page.getByText('Summary of Differences')).toBeVisible();
  });

  test('AI summary triggers API key modal when unset, then saves key', async ({ page }) => {
    await page.getByRole('button', { name: /AI Summary/i }).click();
    const modal = page.getByRole('dialog', { name: /Gemini API Key/i });
    await expect(modal).toBeVisible();
    await modal.getByPlaceholder('Enter your API key').fill('abc123');
    await modal.getByRole('button', { name: /Save Key/i }).click();
    await expect(modal).toBeHidden();
    const stored = await page.evaluate(() => localStorage.getItem('gemini_api_key'));
    expect(stored).toBe('abc123');
  });

  // ────────────────────────────────────────────────
  // FIND & REPLACE
  // ────────────────────────────────────────────────
  test('find, navigate, replace, and replace all works', async ({ page }) => {
    await page.keyboard.press('Control+F');
    const findBox = page.getByPlaceholder('Find');
    await findBox.fill('Greeter');
    const matchInfo = page.locator('text=/of/');
    await expect(matchInfo).toBeVisible();
    await page.getByPlaceholder('Replace').fill('Welcome');
    await page.getByRole('button', { name: /^Replace$/i }).click();
    const val = await page.locator('textarea').first().inputValue();
    expect(val).toContain('Welcome');

    // replace all
    await page.getByRole('button', { name: /Replace All/i }).click();
    const newVal = await page.locator('textarea').first().inputValue();
    expect(newVal).not.toContain('Greeter');
  });

  test('find toggle buttons for case sensitivity and regex work', async ({ page }) => {
    await page.keyboard.press('Control+F');
    const caseBtn = page.getByRole('button', { name: /Toggle Case Sensitive/i });
    const regexBtn = page.getByRole('button', { name: /Toggle Regex/i });
    await caseBtn.click();
    await regexBtn.click();
    await expect(caseBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(regexBtn).toHaveAttribute('aria-pressed', 'true');
  });

  // ────────────────────────────────────────────────
  // THEMES & UI
  // ────────────────────────────────────────────────
  test('switches between Dark, Light, and Solarized themes', async ({ page }) => {
    const select = page.getByLabel('Select color theme');
    for (const theme of ['light', 'solarized', 'dark']) {
      await select.selectOption(theme);
      await expect(page.locator('body')).toHaveClass(new RegExp(`theme-${theme}`));
    }
  });

  // ────────────────────────────────────────────────
  // HELP MODAL
  // ────────────────────────────────────────────────
  test('help modal toggles with ? key and Esc closes it', async ({ page }) => {
    await page.keyboard.press('?');
    const help = page.getByRole('dialog');
    await expect(help).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(help).toBeHidden();
  });

  // ────────────────────────────────────────────────
  // KEYBOARD SHORTCUTS
  // ────────────────────────────────────────────────
  test('keyboard shortcuts trigger corresponding actions', async ({ page }) => {
    await page.keyboard.press('Control+Alt+N'); // add
    await expect(page.locator('textarea')).toHaveCount(3);
    await page.keyboard.press('Control+Alt+W'); // remove
    await expect(page.locator('textarea')).toHaveCount(2);
    await page.keyboard.press('Control+Shift+S'); // AI summary shortcut
    await expect(page.getByRole('dialog', { name: /Gemini API Key/i })).toBeVisible();
  });

  // ────────────────────────────────────────────────
  // SYNCHRONIZED SCROLLING
  // ────────────────────────────────────────────────
  test('scroll in one panel syncs to others', async ({ page }) => {
    const textareas = page.locator('textarea');
    const originalText = await textareas.first().inputValue();
    const longText = originalText + '\n'.repeat(50) + 'End of content.';
    await textareas.first().fill(longText);
    await textareas.nth(1).fill(longText);
    const firstPanelScrollable = page.locator('div.overflow-auto').first();
    await firstPanelScrollable.evaluate(el => el.scrollTo(0, 100));
    await page.waitForTimeout(200); // Wait for scroll event to propagate
    const secondScroll = await page.locator('div.overflow-auto').nth(1)
      .evaluate(el => el.scrollTop);
    expect(secondScroll).toBeGreaterThan(50);
  });

  // ────────────────────────────────────────────────
  // CODE FOLDING
  // ────────────────────────────────────────────────
  test('foldable lines collapse and expand correctly', async ({ page }) => {
    const foldButton = page.locator('button:has-text("▾")').first();
    await expect(foldButton).toBeVisible();
    await foldButton.click();
    const foldedIndicator = page.getByText(/... \d+ lines/);
    await expect(foldedIndicator).toBeVisible();
    await foldedIndicator.click(); // unfold
    await expect(foldedIndicator).toBeHidden();
  });

  // ────────────────────────────────────────────────
  // EDGE CASES & ERROR HANDLING
  // ────────────────────────────────────────────────
  test('handles invalid regex in Find gracefully', async ({ page }) => {
    await page.keyboard.press('Control+F');
    await page.getByPlaceholder('Find').fill('[');
    // Should not crash or hang
    await expect(page.getByText(/No results/i)).toBeVisible();
  });

  test('disables AI button when summarizing', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('gemini_api_key', 'fake-key'));
    // FIX: Intercept the network request to the AI service to control its response
    await page.route('**/v1beta/models/gemini-1.5-flash:generateContent**', async route => {
        // Simulate a delay before failing to make the loading state observable
        await new Promise(resolve => setTimeout(resolve, 100));
        await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: { message: 'API key not valid' } }),
        });
  });
  const aiBtn = page.getByRole('button', { name: /AI Summary/i });
    aiBtn.click();

    await expect(aiBtn).toBeDisabled();
    await expect(aiBtn).toBeEnabled({ timeout: 2000 }); // Assert it becomes enabled again
    await expect(page.getByText(/Failed to generate summary/)).toBeVisible();
  });

  test('saves and reloads API key persistence', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('gemini_api_key', 'persisted-key'));
    await page.reload();
    const stored = await page.evaluate(() => localStorage.getItem('gemini_api_key'));
    expect(stored).toBe('persisted-key');
  });

  // ───────────────────────────────────────────────
  // CLEANUP
  // ────────────────────────────────────────────────
  test('Ctrl+A selects only editable text, not syntax overlay', async ({ page }) => {
  const textarea = page.locator('textarea').first();
    await textarea.click();
    await page.keyboard.press('Control+A');
    const selection = await page.evaluate(() => {
      const el = document.activeElement as HTMLTextAreaElement;
      return el.selectionEnd - el.selectionStart;
    });
    const textLength = await textarea.evaluate((el: HTMLTextAreaElement) => el.value.length);
    expect(selection).toBe(textLength); // full textarea selected
  });


});
