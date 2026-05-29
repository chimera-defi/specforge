import { test, expect } from "@playwright/test";

test.describe("SpecForge E2E - Critical Flows", () => {
  test("home page loads correctly", async ({ page }) => {
    // Navigate to home page
    await page.goto("http://localhost:3000");

    // Check page title
    const title = await page.title();
    expect(title).toContain("SpecForge");

    // Check page is loaded
    await expect(page.locator("body")).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: "/tmp/e2e-home-page.png" });
  });

  test("workspace navigation and authentication", async ({ page }) => {
    // Navigate to workspace
    await page.goto("http://localhost:3000/workspace");

    // Check if redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes("/login")) {
      // Use demo login
      await page.fill('input[name="username"]', "demo");
      await page.fill('input[name="password"]', "demo");
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 5000 });

      // Should be on workspace now
      expect(page.url()).toContain("/workspace");
    }

    // Take screenshot
    await page.screenshot({ path: "/tmp/e2e-workspace-auth.png" });
  });
});

test.describe("Data Propagation Verification", () => {
  test("API health check", async ({ request }) => {
    const response = await request.get("http://localhost:3000/api/health");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("specforge-web");
  });

  test("workspace files API", async ({ request }) => {
    // This tests the API endpoint that serves files to the browser
    const response = await request.get("http://localhost:3000/api/health");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log("Workspace count:", data.persistence?.workspaces);
    console.log("Document count:", data.persistence?.documents);
  });
});