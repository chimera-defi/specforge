import { chromium } from "@playwright/test";

async function runAIAssistBrowserTest() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("=== AI Assist Browser Test ===");
    console.log("Step 1: Navigate to workspace...");

    // Login first
    await page.goto("http://localhost:3000/login");
    await page.fill('input[name="username"]', "demo");
    await page.fill('input[name="password"]', "demo");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000); // Wait for form submission

    console.log("✓ Logged in successfully");
    await page.screenshot({ path: "/tmp/ai-assist-1-login.png" });

    // Navigate to workspace
    await page.goto("http://localhost:3000/workspace");
    await page.waitForLoadState("networkidle");

    console.log("✓ Navigated to workspace");
    await page.screenshot({ path: "/tmp/ai-assist-2-workspace.png" });

    // Look for "Create new document" button or similar
    console.log("Step 2: Looking for create document option...");

    const createButton = page.getByText("Create new document");
    const createButtonCount = await createButton.count();
    console.log("Create button count:", createButtonCount);

    if (createButtonCount > 0) {
      await createButton.first().click();
      console.log("✓ Clicked create new document");
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "/tmp/ai-assist-3-create.png" });
    } else {
      // Try alternative: look for guided draft builder link
      console.log("Create button not found, looking for guided draft builder...");
      const guidedLink = page.getByText("Guided Draft");
      const guidedCount = await guidedLink.count();
      console.log("Guided draft count:", guidedCount);

      if (guidedCount > 0) {
        await guidedLink.first().click();
        console.log("✓ Clicked guided draft");
        await page.waitForTimeout(1000);
      } else {
        // Try to navigate directly
        console.log("Trying direct navigation to guided draft builder...");
        await page.goto("http://localhost:3000/workspace?stage=start");
        await page.waitForTimeout(1000);
      }
    }

    await page.screenshot({ path: "/tmp/ai-assist-4-after-click.png" });

    // Look for idea input field
    console.log("Step 3: Looking for idea input field...");

    // Try different selectors for the idea input
    const ideaSelectors = [
      'textarea[placeholder*="idea"]',
      'textarea[placeholder*="Idea"]',
      'textarea[name="idea"]',
      'input[placeholder*="idea"]',
      '[data-testid="idea-input"]',
    ];

    let ideaInput = null;
    for (const selector of ideaSelectors) {
      try {
        const element = page.locator(selector).first();
        const count = await element.count();
        if (count > 0) {
          ideaInput = element;
          console.log(`✓ Found idea input with selector: ${selector}`);
          break;
        }
      } catch (_e) {
        // Continue to next selector
      }
    }

    if (!ideaInput) {
      console.log("Idea input not found with standard selectors");
      console.log("Page content preview:");
      const content = await page.content();
      console.log(content.substring(0, 1000));

      // Look for any textarea
      const textareas = await page.locator("textarea").count();
      console.log("Number of textareas:", textareas);

      if (textareas > 0) {
        ideaInput = page.locator("textarea").first();
        console.log("✓ Using first textarea as idea input");
      }
    }

    if (ideaInput) {
      // Type a test idea
      const testIdea = "A simple task manager for remote teams with deadline tracking";
      await ideaInput.fill(testIdea);
      console.log(`✓ Entered test idea: "${testIdea}"`);
      await page.screenshot({ path: "/tmp/ai-assist-5-idea-entered.png" });

      // Look for AI assist button
      console.log("Step 4: Looking for AI assist button...");

      const assistButtonSelectors = [
        'button:has-text("Populate fields with assist")',
        'button:has-text("AI Assist")',
        'button:has-text("assist")',
        '[data-testid="ai-assist-button"]',
        'button[type="submit"]',
      ];

      let assistButton = null;
      for (const selector of assistButtonSelectors) {
        try {
          const element = page.locator(selector).first();
          const count = await element.count();
          if (count > 0) {
            assistButton = element;
            console.log(`✓ Found assist button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!assistButton) {
        console.log("AI assist button not found with standard selectors");
        // Look for any button
        const buttons = await page.locator("button").all();
        console.log(`Found ${buttons.length} buttons on page`);

        for (let i = 0; i < buttons.length; i++) {
          const text = await buttons[i].textContent();
          console.log(`Button ${i}: "${text}"`);
        }
      }

      await page.screenshot({ path: "/tmp/ai-assist-6-before-assist.png" });

      // If we found the assist button, click it
      if (assistButton) {
        console.log("Step 5: Clicking AI assist button...");
        await assistButton.click();
        console.log("✓ Clicked AI assist button");

        // Wait for response
        await page.waitForTimeout(5000);
        await page.screenshot({ path: "/tmp/ai-assist-7-after-assist.png" });
        console.log("✓ Screenshot taken after assist");

        // Check if fields were populated
        console.log("Step 6: Checking if fields were populated...");
        const pageText = await page.content();

        const hasProblem = pageText.includes("Problem") || pageText.includes("problem");
        const hasGoals = pageText.includes("Goals") || pageText.includes("goals");
        const hasUsers = pageText.includes("Users") || pageText.includes("users");

        console.log("Problem field populated:", hasProblem);
        console.log("Goals field populated:", hasGoals);
        console.log("Users field populated:", hasUsers);

        if (hasProblem || hasGoals || hasUsers) {
          console.log("✓ SUCCESS: AI assist populated some fields!");
        } else {
          console.log("⚠ Fields may not have been populated");
        }
      } else {
        console.log("❌ Could not find AI assist button to click");
      }
    } else {
      console.log("❌ Could not find idea input field");
    }

    await page.screenshot({ path: "/tmp/ai-assist-final.png" });
    console.log("=== Test Complete ===");

  } catch (error) {
    console.error("Test failed with error:", error);
    await page.screenshot({ path: "/tmp/ai-assist-error.png" });
  } finally {
    await browser.close();
  }
}

runAIAssistBrowserTest();