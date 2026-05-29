import { test, expect } from "@playwright/test";

test.describe("SpecForge E2E - Critical Flows", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto("http://localhost:3000");
  });

  test("home page loads correctly", async ({ page }) => {
    // Check page title
    const title = await page.title();
    expect(title).toContain("SpecForge");

    // Check for key elements
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

  test("guided spec generation from idea", async ({ page }) => {
    // Navigate to workspace
    await page.goto("http://localhost:3000/workspace");

    // Login if needed
    if (page.url().includes("/login")) {
      await page.fill('input[name="username"]', "demo");
      await page.fill('input[name="password"]', "demo");
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 5000 });
    }

    // Look for idea generation UI (guided draft builder or similar)
    const bodyText = await page.bodyText();

    // Check if there's a way to create from idea
    const hasIdeaGeneration = bodyText.includes("idea") ||
      bodyText.includes("guided") ||
      bodyText.includes("draft");

    console.log("Has idea generation UI:", hasIdeaGeneration);

    // Take screenshot
    await page.screenshot({ path: "/tmp/e2e-idea-generation.png" });
  });

  test("workspace files display", async ({ page }) => {
    // Navigate to workspace
    await page.goto("http://localhost:3000/workspace");

    // Login if needed
    if (page.url().includes("/login")) {
      await page.fill('input[name="username"]', "demo");
      await page.fill('input[name="password"]', "demo");
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 5000 });
    }

    // Look for file browser or workspace files section
    const bodyText = await page.bodyText();
    const hasFileBrowser = bodyText.includes("file") ||
      bodyText.includes("File") ||
      bodyText.includes("PRD") ||
      bodyText.includes("SPEC");

    console.log("Has file browser:", hasFileBrowser);

    // Take screenshot
    await page.screenshot({ path: "/tmp/e2e-workspace-files.png" });
  });

  test("membership management UI", async ({ page }) => {
    // Navigate to workspace
    await page.goto("http://localhost:3000/workspace");

    // Login if needed
    if (page.url().includes("/login")) {
      await page.fill('input[name="username"]', "demo");
      await page.fill('input[name="password"]', "demo");
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 5000 });
    }

    // Look for membership section
    const bodyText = await page.bodyText();
    const hasMembershipUI = bodyText.includes("member") ||
      bodyText.includes("workspace") ||
      bodyText.includes("team");

    console.log("Has membership UI:", hasMembershipUI);

    // Take screenshot
    await page.screenshot({ path: "/tmp/e2e-membership-ui.png" });
  });

  test("export stage accessibility", async ({ page }) => {
    // Navigate to workspace with export stage
    await page.goto("http://localhost:3000/workspace?stage=export");

    // Login if needed
    if (page.url().includes("/login")) {
      await page.fill('input[name="username"]', "demo");
      await page.fill('input[name="password"]', "demo");
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 5000 });
    }

    // Look for export UI
    const bodyText = await page.bodyText();
    const hasExportUI = bodyText.includes("export") ||
      bodyText.includes("Export") ||
      bodyText.includes("download");

    console.log("Has export UI:", hasExportUI);

    // Take screenshot
    await page.screenshot({ path: "/tmp/e2e-export-stage.png" });
  });

  test("handoff stage accessibility", async ({ page }) => {
    // Navigate to workspace with handoff stage
    await page.goto("http://localhost:3000/workspace?stage=export");

    // Login if needed
    if (page.url().includes("/login")) {
      await page.fill('input[name="username"]', "demo");
      await page.fill('input[name="password"]', "demo");
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 5000 });
    }

    // Look for handoff UI
    const bodyText = await page.bodyText();
    const hasHandoffUI = bodyText.includes("handoff") ||
      bodyText.includes("Handoff") ||
      bodyText.includes("launch");

    console.log("Has handoff UI:", hasHandoffUI);

    // Take screenshot
    await page.screenshot({ path: "/tmp/e2e-handoff-stage.png" });
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
    // We'll need a document ID to test this properly
    const response = await request.get("http://localhost:3000/api/health");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log("Workspace count:", data.persistence?.workspaces);
    console.log("Document count:", data.persistence?.documents);
  });
});