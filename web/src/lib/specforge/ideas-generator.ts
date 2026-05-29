export type IdeaScaffold = {
  // Core idea
  title: string;
  thesis: string;
  elevatorPitch: string;
  
  // Problem & opportunity
  problem: string;
  currentAlternatives: string;
  whyNow: string;
  
  // User & market
  targetUser: string;
  userSegment: string;
  marketSize: string;
  
  // Solution approach
  solutionApproach: string;
  keyDifferentiator: string;
  
  // Technical architecture
  runtimeTopology: "local-only" | "hosted-only" | "hybrid";
  distributionModel: string;
  agentIntegration: string;
  
  // Scope & phases
  mvpScope: string;
  phase1Features: string;
  futureFeatures: string;
  nonGoals: string;
  
  // UX & Design
  primarySurfaces: string;
  keyScreens: string;
  failureStates: string;
  responsive: string;
  
  // Verification
  acceptanceTests: string;
  successMetrics: string;
  
  // Risks & constraints
  technicalRisks: string;
  constraints: string;
};

export const DEFAULT_IDEA_SCAFFOLD: IdeaScaffold = {
  title: "",
  thesis: "",
  elevatorPitch: "",
  problem: "",
  currentAlternatives: "",
  whyNow: "",
  targetUser: "",
  userSegment: "",
  marketSize: "",
  solutionApproach: "",
  keyDifferentiator: "",
  runtimeTopology: "local-only",
  distributionModel: "",
  agentIntegration: "",
  mvpScope: "",
  phase1Features: "",
  futureFeatures: "",
  nonGoals: "",
  primarySurfaces: "",
  keyScreens: "",
  failureStates: "",
  responsive: "",
  acceptanceTests: "",
  successMetrics: "",
  technicalRisks: "",
  constraints: "",
};

export function normalizeIdeaScaffold(input: Partial<IdeaScaffold>): IdeaScaffold {
  return {
    title: input.title?.trim() || "",
    thesis: input.thesis?.trim() || "",
    elevatorPitch: input.elevatorPitch?.trim() || "",
    problem: input.problem?.trim() || "",
    currentAlternatives: input.currentAlternatives?.trim() || "",
    whyNow: input.whyNow?.trim() || "",
    targetUser: input.targetUser?.trim() || "",
    userSegment: input.userSegment?.trim() || "",
    marketSize: input.marketSize?.trim() || "",
    solutionApproach: input.solutionApproach?.trim() || "",
    keyDifferentiator: input.keyDifferentiator?.trim() || "",
    runtimeTopology: input.runtimeTopology || "local-only",
    distributionModel: input.distributionModel?.trim() || "",
    agentIntegration: input.agentIntegration?.trim() || "",
    mvpScope: input.mvpScope?.trim() || "",
    phase1Features: input.phase1Features?.trim() || "",
    futureFeatures: input.futureFeatures?.trim() || "",
    nonGoals: input.nonGoals?.trim() || "",
    primarySurfaces: input.primarySurfaces?.trim() || "",
    keyScreens: input.keyScreens?.trim() || "",
    failureStates: input.failureStates?.trim() || "",
    responsive: input.responsive?.trim() || "",
    acceptanceTests: input.acceptanceTests?.trim() || "",
    successMetrics: input.successMetrics?.trim() || "",
    technicalRisks: input.technicalRisks?.trim() || "",
    constraints: input.constraints?.trim() || "",
  };
}

function toBulletList(value: string): string[] {
  return value
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^[-*\d.\s]+/, ""));
}

function formatSection(heading: string, content: string, fallback: string = ""): string {
  const trimmed = content.trim();
  if (!trimmed) return `## ${heading}\n\n- ${fallback}\n`;
  
  const bullets = toBulletList(trimmed);
  return `## ${heading}\n\n${bullets.map(b => `- ${b}`).join("\n")}\n`;
}

export function buildIdeaMarkdown(scaffold: IdeaScaffold): string {
  return [
    `# ${scaffold.title || "Untitled Idea"}`,
    "",
    "## Thesis",
    scaffold.thesis || "- [Your thesis - what is this and why does it matter?]",
    "",
    "## Elevator Pitch",
    scaffold.elevatorPitch || "- [30-second pitch - what problem do you solve and for whom?]",
    "",
    "## Problem",
    formatSection("Current State", scaffold.currentAlternatives, "What are people using now?"),
    "",
    formatSection("The Problem", scaffold.problem, "What's broken or missing?"),
    "",
    "## Why Now",
    formatSection("Timing", scaffold.whyNow, "Why is this the right moment? What changed?"),
    "",
    "## User & Market",
    formatSection("Target User", scaffold.targetUser, "Who specifically is this for?"),
    "",
    formatSection("User Segment", scaffold.userSegment, "Which segment of users?"),
    "",
    formatSection("Market Size", scaffold.marketSize, "How big is the opportunity?"),
    "",
    "## Solution",
    formatSection("Approach", scaffold.solutionApproach, "How will you solve it?"),
    "",
    formatSection("Key Differentiator", scaffold.keyDifferentiator, "What makes you different?"),
    "",
    "## Technical Architecture",
    "",
    `**Runtime Topology:** ${scaffold.runtimeTopology}`,
    "",
    formatSection("Distribution Model", scaffold.distributionModel, "How will users run this?"),
    "",
    formatSection("Agent Integration", scaffold.agentIntegration, "How do AI agents work with this?"),
    "",
    "## Scope & Phases",
    formatSection("MVP Scope", scaffold.mvpScope, "What's the minimum viable version?"),
    "",
    formatSection("Phase 1 Features", scaffold.phase1Features, "What's in the first release?"),
    "",
    formatSection("Future Features", scaffold.futureFeatures, "What comes later?"),
    "",
    formatSection("Non-Goals", scaffold.nonGoals, "What are you explicitly NOT doing?"),
    "",
    "## UX & Design",
    formatSection("Primary Surfaces", scaffold.primarySurfaces, "What are the main interfaces?"),
    "",
    formatSection("Key Screens", scaffold.keyScreens, "What are the critical screens?"),
    "",
    formatSection("Failure States", scaffold.failureStates, "What can go wrong and how do you handle it?"),
    "",
    formatSection("Responsive", scaffold.responsive, "Mobile, desktop, or both?"),
    "",
    "## Verification",
    formatSection("Acceptance Tests", scaffold.acceptanceTests, "How do you verify it works?"),
    "",
    formatSection("Success Metrics", scaffold.successMetrics, "How do you measure success?"),
    "",
    "## Risks & Constraints",
    formatSection("Technical Risks", scaffold.technicalRisks, "What could go wrong technically?"),
    "",
    formatSection("Constraints", scaffold.constraints, "What are your limitations?"),
  ].join("\n");
}

export function ideaToGuidedSpecInput(scaffold: IdeaScaffold): {
  guided: import("./guided").GuidedSpecInput;
  metadata: Record<string, string>;
} {
  return {
    guided: {
      title: scaffold.title,
      problem: `${scaffold.problem}\n\nCurrent alternatives:\n${scaffold.currentAlternatives}`,
      goals: [
        scaffold.mvpScope,
        "Build a minimum extensible product",
        "Enable agent-assisted development",
      ].filter(Boolean).join("\n"),
      users: [
        scaffold.targetUser,
        scaffold.userSegment,
      ].filter(Boolean).join("\n"),
      scope: [
        scaffold.phase1Features,
        scaffold.solutionApproach,
      ].filter(Boolean).join("\n"),
      requirements: [
        scaffold.primarySurfaces,
        scaffold.keyScreens,
        scaffold.failureStates,
        scaffold.acceptanceTests,
      ].filter(Boolean).join("\n"),
      constraints: [
        scaffold.technicalRisks,
        scaffold.constraints,
        `Runtime topology: ${scaffold.runtimeTopology}`,
        `Distribution: ${scaffold.distributionModel}`,
      ].filter(Boolean).join("\n"),
      uxPack: [
        `Primary surfaces: ${scaffold.primarySurfaces}`,
        `Key screens: ${scaffold.keyScreens}`,
        `Failure states: ${scaffold.failureStates}`,
        `Responsive: ${scaffold.responsive}`,
      ].filter(Boolean).join("\n"),
      successSignals: scaffold.successMetrics,
      tasks: scaffold.acceptanceTests,
      nonGoals: scaffold.nonGoals,
    },
    metadata: {
      runtime_topology: scaffold.runtimeTopology,
      distribution_model: scaffold.distributionModel,
      agent_integration: scaffold.agentIntegration,
      market_size: scaffold.marketSize,
      creation_mode: "idea_scaffold",
    },
  };
}