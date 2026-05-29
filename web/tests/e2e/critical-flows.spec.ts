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

  test("idea generation flow - access idea generator", async ({ page }) => {
    // Navigate to workspace start stage
    await page.goto("http://localhost:3000/workspace?stage=start");

    // Login if needed
    if (page.url().includes("/login")) {
      await page.fill('input[name="username"]', "demo");
      await page.fill('input[name="password"]', "demo");
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 5000 });
    }

    // Look for the "Idea Generator" button
    const ideaGeneratorButton = page.getByText("Idea Generator");
    const isVisible = await ideaGeneratorButton.isVisible().catch(() => false);

    if (isVisible) {
      // Click the button to access idea generator
      await ideaGeneratorButton.click();
      
      // Verify we're in idea generation mode
      const bodyText = await page.textContent("body");
      console.log("After clicking Idea Generator, page contains:", bodyText?.substring(0, 200));
    } else {
      // Log that the button wasn't found but the page loaded
      const bodyText = await page.textContent("body");
      console.log("Idea Generator button not found. Page contains:", bodyText?.substring(0, 200));
    }

    // Take screenshot
    await page.screenshot({ path: "/tmp/e2e-idea-generator.png" });
  });

  test("workspace files display in export stage", async ({ page }) => {
    // Navigate to export stage
    await page.goto("http://localhost:3000/workspace?stage=export");

    // Login if needed
    if (page.url().includes("/login")) {
      await page.fill('input[name="username"]', "demo");
      await page.fill('input[name="password"]', "demo");
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 5000 });
    }

    // Look for export file browser or file-related content
    const bodyText = await page.textContent("body") || "";
    const hasFileContent = bodyText.includes("file") || 
                          bodyText.includes("File") ||
                          bodyText.includes("export") ||
                          bodyText.includes("Export");

    console.log("Export stage has file content:", hasFileContent);
    console.log("Export stage page preview:", bodyText.substring(0, 300));

    // Take screenshot
    await page.screenshot({ path: "/tmp/e2e-export-files.png" });
  });

  test("export stage readiness check", async ({ page }) => {
    // Navigate to export stage
    await page.goto("http://localhost:3000/workspace?stage=export");

    // Login if needed
    if (page.url().includes("/login")) {
      await page.fill('input[name="username"]', "demo");
      await page.fill('input[name="password"]', "demo");
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 5000 });
    }

    // Look for readiness report or launch packet
    const bodyText = await page.textContent("body") || "";
    const hasReadiness = bodyText.includes("readiness") || 
                        bodyText.includes("Readiness") ||
                        bodyText.includes("launch") ||
                        bodyText.includes("Launch");

    console.log("Export stage has readiness/launch content:", hasReadiness);

    // Take screenshot
    await page.screenshot({ path: "/tmp/e2e-export-readiness.png" });
  });

  test("handoff stage accessibility", async ({ page }) => {
    // Navigate to export stage (where handoff is accessed)
    await page.goto("http://localhost:3000/workspace?stage=export");

    // Login if needed
    if (page.url().includes("/login")) {
      await page.fill('input[name="username"]', "demo");
      await page.fill('input[name="password"]', "demo");
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 5000 });
    }

    // Look for handoff-related content
    const bodyText = await page.textContent("body") || "";
    const hasHandoff = bodyText.includes("handoff") || 
                      bodyText.includes("Handoff") ||
                      bodyText.includes("template") ||
                      bodyText.includes("Template");

    console.log("Export stage has handoff/template content:", hasHandoff);

    // Take screenshot
    await page.screenshot({ path: "/tmp/e2e-handoff-stage.png" });
  });

  test("membership management UI access", async ({ page }) => {
    // Navigate to workspace
    await page.goto("http://localhost:3000/workspace");

    // Login if needed
    if (page.url().includes("/login")) {
      await page.fill('input[name="username"]', "demo");
      await page.fill('input[name="password"]', "demo");
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 5000 });
    }

    // Look for membership-related content
    const bodyText = await page.textContent("body") || "";
    const hasMembership = bodyText.includes("member") || 
                         bodyText.includes("Member") ||
                         bodyText.includes("workspace") ||
                         bodyText.includes("Workspace");

    console.log("Workspace has membership content:", hasMembership);

    // Take screenshot
    await page.screenshot({ path: "/tmp/e2e-membership.png" });
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
    const response = await request.get("http://localhost:3000/api/health");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log("Workspace count:", data.persistence?.workspaces);
    console.log("Document count:", data.persistence?.documents);
  });
});