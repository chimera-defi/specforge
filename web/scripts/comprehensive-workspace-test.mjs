import { chromium } from "@playwright/test";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SCREENSHOT_DIR = "/tmp/workspace-test-screenshots";
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const testIdeas = {
  simple: "A simple task manager",
  medium: "A task manager for remote teams with deadline tracking",
  complex: "A collaborative project management platform with real-time editing, task dependencies, and automated workflows",
  vague: "A mobile app",
  extremelyVague: "An app",
  empty: "",
};

const stages = [
  "start",
  "problem",
  "goals",
  "users",
  "scope",
  "requirements",
  "constraints",
  "ux",
  "success",
  "tasks",
  "nongoals",
];

async function takeScreenshot(page, name) {
  const path = join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path });
  console.log(`  Screenshot: ${path}`);
  return path;
}

async function logPageInfo(page, label) {
  const url = page.url();
  const title = await page.title();
  console.log(`  ${label}:`);
  console.log(`    URL: ${url}`);
  console.log(`    Title: ${title}`);
}

async function findAndClickAIAssist(page, stage) {
  console.log(`  Looking for AI assist button on ${stage} stage...`);

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
        console.log(`    Found with selector: ${selector}`);
        await button.click();
        console.log(`    Clicked AI assist button`);
        return true;
      }
    } catch {
      // Continue to next selector
    }
  }

  console.log(`    AI assist button not found`);
  return false;
}

async function findIdeaInput(page) {
  console.log(`  Looking for idea input field...`);

  const selectors = [
    'textarea[placeholder*="idea"]',
    'textarea[placeholder*="Idea"]',
    'textarea[name="idea"]',
    'input[placeholder*="idea"]',
    '[data-testid="idea-input"]',
  ];

  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      const count = await element.count();
      if (count > 0) {
        console.log(`    Found with selector: ${selector}`);
        return element;
      }
    } catch {
      // Continue to next selector
    }
  }

  // Fallback to first textarea
  const textareas = await page.locator("textarea").count();
  if (textareas > 0) {
    console.log(`    Using first textarea as fallback`);
    return page.locator("textarea").first();
  }

  return null;
}

async function checkFieldPopulation(page) {
  const content = await page.content();
  return {
    problem: content.includes("Problem") || content.includes("problem"),
    goals: content.includes("Goals") || content.includes("goals"),
    users: content.includes("Users") || content.includes("users"),
    scope: content.includes("Scope") || content.includes("scope"),
    requirements: content.includes("Requirements") || content.includes("requirements"),
    tasks: content.includes("Tasks") || content.includes("tasks"),
  };
}

async function testIdea(page, ideaName, idea, testNum) {
  console.log(`\n=== Test ${testNum}: ${ideaName} ===`);
  console.log(`Idea: "${idea}"`);

  // Navigate to start stage
  await page.goto("http://localhost:3000/workspace?stage=start");
  await page.waitForTimeout(2000);

  await logPageInfo(page, "Current page");
  await takeScreenshot(page, `test-${testNum}-${ideaName}-before`);

  // Find and fill idea input
  const ideaInput = await findIdeaInput(page);
  if (!ideaInput) {
    console.log(`  ❌ Could not find idea input field`);
    return { success: false, error: "No idea input field" };
  }

  await ideaInput.fill(idea);
  console.log(`  ✓ Entered idea`);
  await takeScreenshot(page, `test-${testNum}-${ideaName}-idea-entered`);

  // Click AI assist
  const assistClicked = await findAndClickAIAssist(page, "start");
  if (!assistClicked) {
    console.log(`  ❌ Could not find/click AI assist button`);
    return { success: false, error: "No AI assist button" };
  }

  // Wait for response
  console.log(`  Waiting for AI assist response...`);
  await page.waitForTimeout(8000);

  await takeScreenshot(page, `test-${testNum}-${ideaName}-after-assist`);

  // Check field population
  const fields = await checkFieldPopulation(page);
  console.log(`  Field population:`);
  console.log(`    Problem: ${fields.problem}`);
  console.log(`    Goals: ${fields.goals}`);
  console.log(`    Users: ${fields.users}`);
  console.log(`    Scope: ${fields.scope}`);
  console.log(`    Requirements: ${fields.requirements}`);
  console.log(`    Tasks: ${fields.tasks}`);

  const success = fields.problem || fields.goals || fields.users;
  if (success) {
    console.log(`  ✅ SUCCESS: Fields populated`);
  } else {
    console.log(`  ⚠️ WARNING: No fields populated`);
  }

  return { success, fields, idea };
}

async function testWorkspacePages(page) {
  console.log(`\n=== Testing Workspace Pages ===`);

  for (const stage of stages) {
    console.log(`\n--- Testing stage: ${stage} ---`);

    await page.goto(`http://localhost:3000/workspace?stage=${stage}`);
    await page.waitForTimeout(2000);

    await logPageInfo(page, stage);
    await takeScreenshot(page, `stage-${stage}`);

    // Check for errors
    const hasError = await page.locator("text=Error").count() > 0;
    if (hasError) {
      console.log(`  ❌ Error found on ${stage} stage`);
    } else {
      console.log(`  ✓ No errors on ${stage} stage`);
    }
  }
}

async function runComprehensiveTest() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  try {
    console.log("=== Comprehensive Workspace Test ===\n");

    // Login
    console.log("Logging in...");
    await page.goto("http://localhost:3000/login");
    await page.fill('input[name="username"]', "demo");
    await page.fill('input[name="password"]', "demo");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log("✓ Logged in\n");

    // Test all workspace pages
    await testWorkspacePages(page);

    // Test different ideas
    let testNum = 1;

    const simpleResult = await testIdea(page, "simple", testIdeas.simple, testNum++);
    results.push({ name: "simple idea", ...simpleResult });

    const mediumResult = await testIdea(page, "medium", testIdeas.medium, testNum++);
    results.push({ name: "medium idea", ...mediumResult });

    const complexResult = await testIdea(page, "complex", testIdeas.complex, testNum++);
    results.push({ name: "complex idea", ...complexResult });

    const vagueResult = await testIdea(page, "vague", testIdeas.vague, testNum++);
    results.push({ name: "vague idea", ...vagueResult });

    const extremelyVagueResult = await testIdea(page, "extremely-vague", testIdeas.extremelyVague, testNum++);
    results.push({ name: "extremely vague idea", ...extremelyVagueResult });

    // Test empty input (should handle gracefully)
    console.log(`\n=== Test ${testNum}: empty input ===`);
    await page.goto("http://localhost:3000/workspace?stage=start");
    await page.waitForTimeout(2000);
    const emptyInput = await findIdeaInput(page);
    if (emptyInput) {
      await emptyInput.fill(testIdeas.empty);
      await takeScreenshot(page, `test-${testNum}-empty-entered`);
      const assistClicked = await findAndClickAIAssist(page, "start");
      if (assistClicked) {
        await page.waitForTimeout(5000);
        await takeScreenshot(page, `test-${testNum}-empty-after-assist`);
      }
    }
    results.push({ name: "empty input", success: assistClicked });

    // Print summary
    console.log(`\n=== Test Summary ===`);
    console.log(`Total tests: ${results.length}`);
    console.log(`Successful: ${results.filter(r => r.success).length}`);
    console.log(`Failed: ${results.filter(r => !r.success).length}`);

    console.log(`\nDetailed Results:`);
    for (const result of results) {
      console.log(`  ${result.name}: ${result.success ? "✅ PASS" : "❌ FAIL"}`);
      if (result.error) console.log(`    Error: ${result.error}`);
      if (result.fields) {
        const populatedCount = Object.values(result.fields).filter(v => v).length;
        console.log(`    Fields populated: ${populatedCount}/6`);
      }
    }

    // Save results to file
    const resultsPath = join(SCREENSHOT_DIR, "test-results.json");
    writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${resultsPath}`);
    console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);

  } catch (error) {
    console.error("Test failed with error:", error);
    await page.screenshot({ path: join(SCREENSHOT_DIR, "fatal-error.png") });
  } finally {
    await browser.close();
  }
}

runComprehensiveTest();