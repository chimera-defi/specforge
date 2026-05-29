import type { GuidedSpecInput } from "./guided";
import { validateFields, toSection } from "../utils/sanitize";

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
  releaseStage: "alpha" | "beta" | "production";
  
  // Scope & phases
  mvpScope: string;
  phase1Features: string;
  futureFeatures: string;
  futureWork: string;
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
  
  // Business & competition
  competitiveAnalysis: string;
  businessModel: string;
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
  releaseStage: "alpha",
  mvpScope: "",
  phase1Features: "",
  futureFeatures: "",
  futureWork: "",
  nonGoals: "",
  primarySurfaces: "",
  keyScreens: "",
  failureStates: "",
  responsive: "",
  acceptanceTests: "",
  successMetrics: "",
  technicalRisks: "",
  constraints: "",
  competitiveAnalysis: "",
  businessModel: "",
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
    releaseStage: input.releaseStage || "alpha",
    mvpScope: input.mvpScope?.trim() || "",
    phase1Features: input.phase1Features?.trim() || "",
    futureFeatures: input.futureFeatures?.trim() || "",
    futureWork: input.futureWork?.trim() || "",
    nonGoals: input.nonGoals?.trim() || "",
    primarySurfaces: input.primarySurfaces?.trim() || "",
    keyScreens: input.keyScreens?.trim() || "",
    failureStates: input.failureStates?.trim() || "",
    responsive: input.responsive?.trim() || "",
    acceptanceTests: input.acceptanceTests?.trim() || "",
    successMetrics: input.successMetrics?.trim() || "",
    technicalRisks: input.technicalRisks?.trim() || "",
    constraints: input.constraints?.trim() || "",
    competitiveAnalysis: input.competitiveAnalysis?.trim() || "",
    businessModel: input.businessModel?.trim() || "",
  };
}

export type IdeaValidationError = {
  field: string;
  message: string;
};

export function validateIdeaScaffold(scaffold: IdeaScaffold): IdeaValidationError[] {
  return validateFields(scaffold, {
    title: { minLength: 3, example: "e.g., 'My Awesome Product'" },
    thesis: { minLength: 10, example: "what is this and why it matters?" },
    problem: { minLength: 10, example: "what's broken or missing?" },
    targetUser: { minLength: 5, example: "who specifically is this for?" },
    solutionApproach: { minLength: 10, example: "how will you solve it?" },
  });
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
    toSection("Current State", scaffold.currentAlternatives, "What are people using now?"),
    "",
    toSection("The Problem", scaffold.problem, "What's broken or missing?"),
    "",
    "## Why Now",
    toSection("Timing", scaffold.whyNow, "Why is this the right moment? What changed?"),
    "",
    "## User & Market",
    toSection("Target User", scaffold.targetUser, "Who specifically is this for?"),
    "",
    toSection("User Segment", scaffold.userSegment, "Which segment of users?"),
    "",
    toSection("Market Size", scaffold.marketSize, "How big is the opportunity?"),
    "",
    "## Solution",
    toSection("Approach", scaffold.solutionApproach, "How will you solve it?"),
    "",
    toSection("Key Differentiator", scaffold.keyDifferentiator, "What makes you different?"),
    "",
    "## Technical Architecture",
    "",
    `**Runtime Topology:** ${scaffold.runtimeTopology}`,
    "",
    `**Release Stage:** ${scaffold.releaseStage}`,
    "",
    toSection("Distribution Model", scaffold.distributionModel, "How will users run this?"),
    "",
    toSection("Agent Integration", scaffold.agentIntegration, "How do AI agents work with this?"),
    "",
    "## Scope & Phases",
    toSection("MVP Scope", scaffold.mvpScope, "What's the minimum viable version?"),
    "",
    toSection("Phase 1 Features", scaffold.phase1Features, "What's in the first release?"),
    "",
    toSection("Future Features", scaffold.futureFeatures, "What comes later?"),
    "",
    toSection("Future Work", scaffold.futureWork, "What's the longer-term vision?"),
    "",
    toSection("Non-Goals", scaffold.nonGoals, "What are you explicitly NOT doing?"),
    "",
    "## UX & Design",
    toSection("Primary Surfaces", scaffold.primarySurfaces, "What are the main interfaces?"),
    "",
    toSection("Key Screens", scaffold.keyScreens, "What are the critical screens?"),
    "",
    toSection("Failure States", scaffold.failureStates, "What can go wrong and how do you handle it?"),
    "",
    toSection("Responsive", scaffold.responsive, "Mobile, desktop, or both?"),
    "",
    "## Verification",
    toSection("Acceptance Tests", scaffold.acceptanceTests, "How do you verify it works?"),
    "",
    toSection("Success Metrics", scaffold.successMetrics, "How do you measure success?"),
    "",
    "## Risks & Constraints",
    toSection("Technical Risks", scaffold.technicalRisks, "What could go wrong technically?"),
    "",
    toSection("Constraints", scaffold.constraints, "What are your limitations?"),
  ].join("\n");
}

export function ideaToGuidedSpecInput(scaffold: IdeaScaffold): {
  guided: GuidedSpecInput;
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