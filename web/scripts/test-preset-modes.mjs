import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";
import { join } from "path";

const SCREENSHOT_DIR = "/tmp/preset-mode-test";
mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function takeScreenshot(page, name) {
  const path = join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path });
  console.log(`  Screenshot: ${path}`);
  return path;
}

async function findAIAssistButton(page) {
  const selectors = [
    'button:has-text("Populate fields with assist")',
    'button:has-text("AI Assist")',
    'button:has-text("assist")',
    '[data-testid="ai-assist-button"]',
  ];

  for (const selector of selectors) {
    try {
      const button = page.locator(selector).first();
      const count = await button.count();
      if (count > 0) {
        return button;
      }
    } catch (_e) {
      // Continue
    }
  }
  return null;
}

async function findTextArea(page) {
  const textareas = await page.locator("textarea").count();
  if (textareas > 0) {
    return page.locator("textarea").first();
  }
  return null;
}

async function testPresetMode(page, stage, mode) {
  console.log(`\n=== Testing ${mode} mode on ${stage} stage ===`);

  await page.goto(`http://localhost:3000/workspace?stage=${stage}`);
  await page.waitForTimeout(2000);

  await takeScreenshot(page, `${stage}-${mode}-before`);

  // Find a textarea and add some content
  const textarea = await findTextArea(page);
  if (textarea) {
    const testContent = `Test content for ${stage} stage with ${mode} mode`;
    await textarea.fill(testContent);
    console.log(`  ✓ Entered test content`);
    await takeScreenshot(page, `${stage}-${mode}-content-entered`);
  }

  // Look for AI assist button
  const assistButton = await findAIAssistButton(page);
  if (assistButton) {
    console.log(`  ✓ Found AI assist button`);
    await assistButton.click();
    console.log(`  ✓ Clicked AI assist button`);
    await page.waitForTimeout(5000);
    await takeScreenshot(page, `${stage}-${mode}-after-assist`);

    // Check if content changed
    const content = await page.content();
    const hasChanges = content.includes("Test content") === false;
    console.log(`  Content changed: ${hasChanges}`);

    return { success: true, hasChanges };
  } else {
    console.log(`  ⚠️ AI assist button not found on ${stage} stage`);
    return { success: false, hasChanges: false };
  }
}

async function runPresetModeTest() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  try {
    console.log("=== AI Assist Preset Mode Test ===\n");

    // Login
    console.log("Logging in...");
    await page.goto("http://localhost:3000/login");
    await page.fill('input[name="username"]', "demo");
    await page.fill('input[name="password"]', "demo");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log("✓ Logged in\n");

    // Test block-iteration mode on different stages
    const stagesToTest = ["problem", "goals", "users", "scope", "requirements", "tasks"];
    const mode = "block-iteration";

    for (const stage of stagesToTest) {
      const result = await testPresetMode(page, stage, mode);
      results.push({ stage, mode, ...result });
    }

    // Print summary
    console.log(`\n=== Test Summary ===`);
    console.log(`Total tests: ${results.length}`);
    console.log(`Successful: ${results.filter(r => r.success).length}`);
    console.log(`Failed: ${results.filter(r => !r.success).length}`);

    console.log(`\nDetailed Results:`);
    for (const result of results) {
      console.log(`  ${result.stage} (${result.mode}): ${result.success ? "✅ PASS" : "❌ FAIL"}`);
      if (result.hasChanges !== undefined) {
        console.log(`    Content changed: ${result.hasChanges}`);
      }
    }

  } catch (error) {
    console.error("Test failed with error:", error);
    await page.screenshot({ path: join(SCREENSHOT_DIR, "fatal-error.png") });
  } finally {
    await browser.close();
  }
}

runPresetModeTest();