import { test, expect } from "@playwright/test";

test.describe("Idea-to-Spec Flow - Browser Testing", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto("http://localhost:3000");
  });

  test("should navigate to workspace and access guided draft builder", async ({
    page,
  }) => {
    // Check if we're on the homepage
    const title = await page.title();
    console.log("Page title:", title);

    // Try to access workspace directly
    await page.goto("http://localhost:3000/workspace");

    // Check if we're redirected to login
    const currentUrl = page.url();
    console.log("Current URL:", currentUrl);

    if (currentUrl.includes("/login")) {
      console.log("Redirected to login - attempting demo login");

      // Try demo credentials
      await page.fill('input[name="username"]', "demo");
      await page.fill('input[name="password"]', "demo");
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForNavigation({ timeout: 5000 });

      const loginUrl = page.url();
      console.log("After login URL:", loginUrl);
    }

    // Take a screenshot
    await page.screenshot({ path: "/tmp/idea-to-spec-1.png" });
  });

  test("should test AI assist button with idea-to-spec prompt", async ({
    page,
  }) => {
    // Try to access workspace
    await page.goto("http://localhost:3000/workspace");

    // Check if redirected to login
    if (page.url().includes("/login")) {
      // Login with demo credentials
      await page.fill('input[name="username"]', "demo");
      await page.fill('input[name="password"]', "demo");
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 5000 });
    }

    // Take screenshot after login
    await page.screenshot({ path: "/tmp/idea-to-spec-2.png" });

    // Look for guided draft builder or AI assist button
    const pageContent = await page.content();
    console.log("Page content length:", pageContent.length);

    // Look for text indicating we're in the workspace
    const bodyText = await page.bodyText();
    console.log("Body text preview:", bodyText.substring(0, 500));

    // Screenshot for debugging
    await page.screenshot({ path: "/tmp/idea-to-spec-3.png" });
  });
});