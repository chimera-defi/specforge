import { chromium } from "@playwright/test";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runBrowserTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("Navigating to homepage...");
    await page.goto("http://localhost:3000");

    const title = await page.title();
    console.log("Page title:", title);

    // Take screenshot
    await page.screenshot({ path: "/tmp/browser-test-1.png" });
    console.log("Screenshot saved to /tmp/browser-test-1.png");

    // Try to navigate to workspace
    console.log("Navigating to workspace...");
    await page.goto("http://localhost:3000/workspace");

    const currentUrl = page.url();
    console.log("Current URL:", currentUrl);

    // Check if redirected to login
    if (currentUrl.includes("/login")) {
      console.log("Redirected to login - attempting demo login");

      // Fill in demo credentials
      await page.fill('input[name="username"]', "demo");
      await page.fill('input[name="password"]', "demo");
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForNavigation({ timeout: 5000 });

      const afterLoginUrl = page.url();
      console.log("After login URL:", afterLoginUrl);

      // Take screenshot after login
      await page.screenshot({ path: "/tmp/browser-test-2.png" });
      console.log("Screenshot saved to /tmp/browser-test-2.png");
    }

    // Get page content
    const bodyText = await page.content();
    console.log("Body text preview:", bodyText.substring(0, 500));

    // Look for AI assist button or guided draft builder
    const hasAIAssist = await page.getByText("Populate fields with assist").count();
    console.log("AI assist button count:", hasAIAssist);

    const hasGuidedDraft = await page.getByText("Guided Draft Builder").count();
    console.log("Guided Draft Builder count:", hasGuidedDraft);

    // Take final screenshot
    await page.screenshot({ path: "/tmp/browser-test-3.png" });
    console.log("Screenshot saved to /tmp/browser-test-3.png");

    console.log("Browser test completed successfully");
  } catch (error) {
    console.error("Browser test failed:", error);
    await page.screenshot({ path: "/tmp/browser-test-error.png" });
  } finally {
    await browser.close();
  }
}

runBrowserTest();