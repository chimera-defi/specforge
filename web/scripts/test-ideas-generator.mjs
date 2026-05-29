#!/usr/bin/env node

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function testIdeasGenerator() {
  console.log('=== Ideas Generator API Test ===\n');

  const testScaffold = {
    title: "Test Idea",
    thesis: "This is a test idea for the ideas generator",
    elevatorPitch: "A quick test of the ideas generator API",
    problem: "Need to test the API",
    currentAlternatives: "Manual testing",
    whyNow: "Now is the time",
    targetUser: "Developers",
    userSegment: "Technical users",
    marketSize: "Large",
    solutionApproach: "Build it",
    keyDifferentiator: "Fast",
    runtimeTopology: "local-only",
    distributionModel: "NPM package",
    agentIntegration: "CLI tool",
    mvpScope: "Basic functionality",
    phase1Features: "Core features",
    futureFeatures: "Advanced features",
    nonGoals: "Everything else",
    primarySurfaces: "CLI",
    keyScreens: "Terminal",
    failureStates: "Errors",
    responsive: "N/A",
    acceptanceTests: "Run tests",
    successMetrics: "Test pass",
    technicalRisks: "None",
    constraints: "Time",
  };

  try {
    const response = await fetch(`${API_URL}/api/ideas/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testScaffold),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('✓ API call successful');
    console.log('\n=== Generated Idea ===');
    console.log('Title:', data.idea.title);
    console.log('Idea markdown length:', data.idea.markdown.length);
    console.log('\n=== Generated Spec ===');
    console.log('Title:', data.spec.title);
    console.log('Spec markdown length:', data.spec.markdown.length);
    console.log('\n=== Metadata ===');
    console.log('Idea metadata:', JSON.stringify(data.idea.metadata, null, 2));
    console.log('Spec metadata:', JSON.stringify(data.spec.metadata, null, 2));

    console.log('\n✓ Ideas generator API test PASSED');
    process.exit(0);
  } catch (error) {
    console.error('✗ Ideas generator API test FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testIdeasGenerator();