import { chromium } from "@playwright/test";

async function testDraftCanvasFix() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(msg.text());
    console.log(`[Browser Console] ${msg.text()}`);
  });

  try {
    console.log("=== Testing Draft Canvas Fix ===\n");

    // Login
    console.log("Step 1: Logging in...");
    await page.goto("http://localhost:3000/login");
    await page.fill('input[name="username"]', "demo");
    await page.fill('input[name="password"]', "demo");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log("✓ Logged in");
    await page.screenshot({ path: "/tmp/draft-fix-1-login.png" });

    // Navigate to workspace
    console.log("\nStep 2: Navigating to workspace...");
    await page.goto("http://localhost:3000/workspace");
    await page.waitForTimeout(2000);
    console.log("✓ Navigated to workspace");
    await page.screenshot({ path: "/tmp/draft-fix-2-workspace.png" });

    // Navigate to draft stage
    console.log("\nStep 3: Navigating to draft stage...");
    await page.goto("http://localhost:3000/workspace?stage=draft");
    await page.waitForTimeout(3000);
    console.log("✓ Navigated to draft stage");
    await page.screenshot({ path: "/tmp/draft-fix-3-draft-stage.png" });

    // Check if there's a document
    const content = await page.content();
    const hasCreateMessage = content.includes("Create a document first");
    
    if (hasCreateMessage) {
      console.log("\n  No document found - creating one...");
      
      // Go back to start stage
      await page.goto("http://localhost:3000/workspace?stage=start");
      await page.waitForTimeout(2000);
      
      // Find idea input
      const textarea = page.locator("textarea").first();
      const testIdea = "A simple task manager for remote teams";
      await textarea.fill(testIdea);
      console.log(`  ✓ Entered idea: "${testIdea}"`);
      await page.screenshot({ path: "/tmp/draft-fix-4-idea-entered.png" });

      // Click AI assist
      const assistButton = page.locator('button:has-text("Populate fields with assist")').first();
      await assistButton.click();
      console.log("  ✓ Clicked AI assist button");
      await page.waitForTimeout(8000);
      await page.screenshot({ path: "/tmp/draft-fix-5-after-assist.png" });

      // Find and click the create button with better selector
      const createButton = page.locator('button').filter({ hasText: /^Create document$/i });
      const createCount = await createButton.count();
      console.log(`  Create button count: ${createCount}`);
      
      if (createCount > 0) {
        await createButton.first().click();
        console.log("  ✓ Clicked create button");
        await page.waitForTimeout(3000);
        await page.screenshot({ path: "/tmp/draft-fix-6-after-create.png" });

        // Navigate to draft stage again
        console.log("\nStep 4: Navigating to draft stage...");
        await page.goto("http://localhost:3000/workspace?stage=draft");
        await page.waitForTimeout(3000);
        console.log("✓ Navigated to draft stage");
        await page.screenshot({ path: "/tmp/draft-fix-7-draft-stage.png" });
      }
    } else {
      console.log("\n  Document already exists");
    }

    // Check if document content is loaded
    console.log("\nStep 5: Checking document content...");
    const draftContent = await page.content();
    const hasEditor = draftContent.includes("specforgeEditor");
    const hasContent = draftContent.length > 1000;
    
    // Wait for sync state to be "live"
    console.log("  Waiting for editor to sync...");
    await page.waitForTimeout(5000);
    
    // Try to get editor text
    let editorText = "";
    let editorHtml = "";
    try {
      editorText = await page.locator(".specforgeEditor").textContent() || "";
      editorHtml = await page.locator(".specforgeEditor").innerHTML() || "";
    } catch (e) {
      console.log("  Could not get editor text");
    }

    console.log(`  Editor present: ${hasEditor}`);
    console.log(`  Page content length: ${draftContent.length}`);
    console.log(`  Editor text length: ${editorText.length}`);
    console.log(`  Editor HTML length: ${editorHtml.length}`);
    console.log(`  Editor text preview: ${editorText.substring(0, 300)}`);
    console.log(`  Editor HTML preview: ${editorHtml.substring(0, 500)}`);

    // Check sync state
    const hasLiveState = draftContent.includes("live") || draftContent.includes("Live room synced");
    const hasSyncedState = draftContent.includes("synced");
    console.log(`  Sync state (live): ${hasLiveState}`);
    console.log(`  Sync state (synced): ${hasSyncedState}`);

    // Check for document info section
    const hasDocumentInfo = draftContent.includes("Document info");
    const hasSections = draftContent.includes("Sections:");
    const hasBlocks = draftContent.includes("Blocks:");
    console.log(`  Document info section: ${hasDocumentInfo}`);
    console.log(`  Sections count displayed: ${hasSections}`);
    console.log(`  Blocks count displayed: ${hasBlocks}`);

    await page.screenshot({ path: "/tmp/draft-fix-8-final.png" });

    // Summary
    console.log("\n=== Test Summary ===");
    const contentLoaded = hasContent && (editorText.length > 100 || editorHtml.length > 500);
    console.log(`Document content loaded: ${contentLoaded ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`Document info displayed: ${hasDocumentInfo ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`Editor present: ${hasEditor ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`Editor HTML length: ${editorHtml.length}`);
    console.log(`Editor text length: ${editorText.length}`);

    if (contentLoaded) {
      console.log("\n✅ SUCCESS: The empty draft fix is working!");
    } else {
      console.log("\n❌ FAIL: Document content is still empty");
    }

  } catch (error) {
    console.error("Test failed:", error);
    await page.screenshot({ path: "/tmp/draft-fix-error.png" });
  } finally {
    await browser.close();
  }
}

testDraftCanvasFix();