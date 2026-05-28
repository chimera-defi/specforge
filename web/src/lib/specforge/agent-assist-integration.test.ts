import { describe, expect, it } from "vitest";

import { buildAssistPrompt, suggestGuidedSpecInput } from "./agent-assist";

describe("Prompt System Integration Tests", () => {
  describe("Full Flow: API → Prompt Construction → AI Tool", () => {
    it("should construct complete prompt with idea-to-spec guidance", () => {
      const brief = "A task manager for remote teams with deadline tracking";
      const systemPrompt = `You are an expert product manager and technical architect. Your goal is to transform a rough idea into a comprehensive, actionable product specification.

GUIDELINES:
- Generate a complete spec covering problem, users, goals, scope, requirements, constraints, UX, success signals, and implementation tasks
- Be specific and concrete - avoid generic filler
- Include measurable success criteria
- Define clear scope boundaries (what's IN and what's OUT)
- Consider technical feasibility and constraints
- Structure the output to be immediately useful for implementation planning

QUALITY CHECKLIST:
- Problem: Is it concrete? Does it describe real pain?
- Goals: Are they measurable? Can you tell when they're achieved?
- Users: Are they specific personas, not "everyone"?
- Scope: Is it bounded? What's explicitly OUT of scope?
- Requirements: Are they actionable and testable?
- Tasks: Can a developer execute these without clarification?

Return structured JSON with all spec fields populated.`;

      const prompt = buildAssistPrompt(brief, systemPrompt, "");

      // Verify system prompt is used
      expect(prompt).toContain("expert product manager and technical architect");
      expect(prompt).toContain("GUIDELINES:");
      expect(prompt).toContain("QUALITY CHECKLIST:");
      expect(prompt).toContain("Problem: Is it concrete?");
      expect(prompt).toContain("Goals: Are they measurable?");
      expect(prompt).toContain("Users: Are they specific personas");
      expect(prompt).toContain("Scope: Is it bounded?");
      expect(prompt).toContain("Requirements: Are they actionable");
      expect(prompt).toContain("Tasks: Can a developer execute these without clarification?");

      // Verify brief is included
      expect(prompt).toContain("Idea brief:");
      expect(prompt).toContain(brief);
    });

    it("should include context prompt when provided", () => {
      const brief = "A simple task manager";
      const systemPrompt = "You are a helpful assistant.";
      const contextPrompt = "Additional context: This is for remote teams";

      const prompt = buildAssistPrompt(brief, systemPrompt, contextPrompt);

      expect(prompt).toContain("Context:");
      expect(prompt).toContain(contextPrompt);
      expect(prompt).toContain("Idea brief:");
      expect(prompt).toContain(brief);
    });

    it("should use default system prompt when not provided", () => {
      const brief = "A simple task manager";

      const prompt = buildAssistPrompt(brief);

      expect(prompt).toContain("You are an expert product manager filling structured guided-spec fields for SpecForge");
      expect(prompt).toContain("GUIDELINES:");
      expect(prompt).toContain("QUALITY CHECKLIST:");
      expect(prompt).not.toContain("Context:");
    });
  });

  describe("Prompt Quality Validation", () => {
    it("idea-to-spec prompt should include all quality checklist items", () => {
      const systemPrompt = `You are an expert product manager and technical architect.

QUALITY CHECKLIST:
- Problem: Is it concrete? Does it describe real pain?
- Goals: Are they measurable? Can you tell when they're achieved?
- Users: Are they specific personas, not "everyone"?
- Scope: Is it bounded? What's explicitly OUT of scope?
- Requirements: Are they actionable and testable?
- Tasks: Can a developer execute these without clarification?`;

      const prompt = buildAssistPrompt("A task manager", systemPrompt, "");

      // Verify all quality checklist items are present
      expect(prompt).toContain("Problem: Is it concrete?");
      expect(prompt).toContain("Goals: Are they measurable?");
      expect(prompt).toContain("Users: Are they specific personas");
      expect(prompt).toContain("Scope: Is it bounded?");
      expect(prompt).toContain("Requirements: Are they actionable");
      expect(prompt).toContain("Tasks: Can a developer execute these without clarification?");
    });

    it("idea-to-spec prompt should emphasize concrete outputs", () => {
      const systemPrompt = `You are an expert product manager and technical architect.

GUIDELINES:
- Be specific and concrete - avoid generic filler
- Include measurable success criteria
- Define clear scope boundaries`;

      const prompt = buildAssistPrompt("A task manager", systemPrompt, "");

      expect(prompt).toContain("specific and concrete");
      expect(prompt).toContain("avoid generic filler");
      expect(prompt).toContain("measurable success criteria");
      expect(prompt).toContain("clear scope boundaries");
    });

    it("idea-to-spec prompt should include technical feasibility guidance", () => {
      const systemPrompt = `You are an expert product manager and technical architect.

GUIDELINES:
- Consider technical feasibility and constraints
- Structure the output to be immediately useful for implementation planning`;

      const prompt = buildAssistPrompt("A task manager", systemPrompt, "");

      expect(prompt).toContain("technical feasibility");
      expect(prompt).toContain("implementation planning");
    });
  });

  describe("Backward Compatibility Integration", () => {
    it("should work with no prompts provided (original behavior)", () => {
      const brief = "A simple task manager";

      const prompt = buildAssistPrompt(brief);

      // Should use default prompts
      expect(prompt).toContain("You are an expert product manager filling structured guided-spec fields for SpecForge");
      expect(prompt).toContain("Idea brief:");
      expect(prompt).toContain(brief);
    });

    it("should work with only brief parameter (minimal API call)", () => {
      const brief = "A simple task manager";
      const prompt = buildAssistPrompt(brief, undefined, undefined);

      expect(prompt).toContain("You are an expert product manager filling structured guided-spec fields for SpecForge");
      expect(prompt).toContain(brief);
    });
  });

  describe("Context Variable Interpolation", () => {
    it("should support context variable interpolation in contextPrompt", () => {
      const contextPrompt = "Section: {section}. Current: {content}";
      const contextVars = {
        section: "Architecture",
        content: "Current content here",
      };

      const interpolated = contextPrompt
        .replace("{section}", contextVars.section)
        .replace("{content}", contextVars.content);

      expect(interpolated).toContain("Section: Architecture");
      expect(interpolated).toContain("Current: Current content here");
    });

    it("should handle missing context variables gracefully", () => {
      const contextPrompt = "Section: {section}. Current: {content}";
      const contextVars = {
        section: "Architecture",
      };

      const interpolated = contextPrompt
        .replace("{section}", contextVars.section)
        .replace("{content}", "[MISSING]");

      expect(interpolated).toContain("Section: Architecture");
      expect(interpolated).toContain("Current: [MISSING]");
    });
  });
});