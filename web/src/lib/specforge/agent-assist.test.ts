import { describe, expect, it } from "vitest";

import { buildAssistPrompt, buildHeuristicSuggestion } from "./agent-assist";

describe("buildAssistPrompt", () => {
  it("uses default system prompt when none provided", () => {
    const prompt = buildAssistPrompt("A simple task manager");
    expect(prompt).toContain("You are an expert product manager");
    expect(prompt).toContain("A simple task manager");
    expect(prompt).not.toContain("Context:");
  });

  it("uses custom system prompt when provided", () => {
    const customPrompt = "Custom system prompt for testing";
    const prompt = buildAssistPrompt("A task manager", customPrompt);
    expect(prompt).toContain(customPrompt);
    expect(prompt).not.toContain("You are an expert product manager");
  });

  it("does not include context when not provided", () => {
    const prompt = buildAssistPrompt("A task manager", "Custom prompt");
    expect(prompt).not.toContain("Context:");
  });

  it("includes context when provided", () => {
    const prompt = buildAssistPrompt(
      "A task manager",
      "Custom prompt",
      "Additional context for testing",
    );
    expect(prompt).toContain("Context:");
    expect(prompt).toContain("Additional context for testing");
  });

  it("always includes the brief at the end", () => {
    const brief = "A collaborative spec workspace";
    const prompt = buildAssistPrompt(brief);
    expect(prompt).toContain("Idea brief:");
    expect(prompt).toContain(brief);
  });

  it("handles empty context prompt gracefully", () => {
    const prompt = buildAssistPrompt("A task manager", "Custom prompt", "");
    expect(prompt).not.toContain("Context:");
  });
});

describe("buildHeuristicSuggestion", () => {
  it("turns a rough brief into non-empty guided fields", () => {
    const suggestion = buildHeuristicSuggestion(
      "A collaborative spec workspace for founders and engineers that keeps AI patches reviewable and exports a clean build handoff.",
    );

    expect(suggestion.tool).toBe("heuristic");
    expect(suggestion.fields.title).toContain("Collaborative Spec Workspace");
    expect(suggestion.fields.problem.length).toBeGreaterThan(10);
    expect(suggestion.fields.requirements).toContain("reviewable");
    expect(suggestion.fields.users).toContain("Engineer");
    expect(suggestion.notes.length).toBeGreaterThan(0);
  });

  it("accepts optional system and context prompts without breaking", () => {
    const suggestion = buildHeuristicSuggestion(
      "A collaborative spec workspace",
      "Custom system prompt",
      "Custom context prompt",
    );

    expect(suggestion.tool).toBe("heuristic");
    expect(suggestion.fields.title).toContain("Collaborative Spec Workspace");
    expect(suggestion.fields.problem.length).toBeGreaterThan(10);
  });
});
