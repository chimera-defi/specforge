"use client";

import { useMemo, useState, useTransition } from "react";

import { createDocumentAction } from "./actions";
import styles from "./page.module.css";
import type { AgentAssistToolStatus } from "@/lib/specforge/agent-assist";
import {
  DEFAULT_GUIDED_SPEC_INPUT,
  normalizeGuidedSpecInput,
  type GuidedSpecInput,
} from "@/lib/specforge/guided";

type AssistPreset = "idea-to-spec" | "block-iteration" | "clarification-answer" | "design-feedback" | "planning-assist";

const PRESET_SYSTEM_PROMPTS: Record<AssistPreset, string> = {
  "idea-to-spec": `You are an expert product manager and technical architect. Your goal is to transform a rough idea into a comprehensive, actionable product specification.

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

Return structured JSON with all spec fields populated.`,
  "block-iteration": `You are a technical editor helping improve a specific section of a product specification.

GUIDELINES:
- Keep the same structure and tone as the existing content
- Make changes concrete and actionable
- Preserve the original intent while improving clarity and completeness
- Add missing details that would be helpful for implementation
- Remove ambiguity where possible
- Maintain consistency with the rest of the spec

Return the improved section content.`,
  "clarification-answer": `You are a product specification expert helping answer clarification questions.

GUIDELINES:
- Answer the question directly and concisely
- Provide enough detail to resolve the ambiguity
- If the question reveals a gap in the spec, acknowledge it and suggest how to fill it
- Keep answers implementation-focused
- Avoid scope creep - stay within the stated product boundaries

Return the answer.`,
  "design-feedback": `You are a UX/UI design expert providing design review feedback.

GUIDELINES:
- Focus on user experience and interface design
- Evaluate information architecture and content organization
- Check for accessibility and usability issues
- Suggest improvements to visual hierarchy and layout
- Ensure design supports the stated user goals
- Provide concrete, actionable recommendations

Return your design feedback.`,
  "planning-assist": `You are a senior architect helping with implementation planning.

GUIDELINES:
- Break down complex features into manageable tasks
- Identify dependencies between tasks
- Consider technical constraints and feasibility
- Suggest appropriate implementation order
- Highlight potential risks and mitigation strategies
- Ensure tasks are concrete and actionable

Return the implementation plan.`,
};

type Props = {
  initialValues?: Partial<GuidedSpecInput>;
  toolStatuses: AgentAssistToolStatus[];
  cliAssistEnabled: boolean;
  preferredTool: "auto" | "codex_cli" | "claude_cli" | "heuristic";
};

type AssistResponse = {
  tool: "codex_cli" | "claude_cli" | "heuristic";
  fields: GuidedSpecInput;
  notes: string[];
  statuses: AgentAssistToolStatus[];
};

type AssistErrorResponse = {
  error?: string;
  message?: string;
  quota?: {
    limit: number | null;
    used: number;
    remaining: number | null;
  };
};

export function GuidedDraftBuilder({
  initialValues,
  toolStatuses,
  cliAssistEnabled,
  preferredTool,
}: Props) {
  const [fields, setFields] = useState<GuidedSpecInput>(() =>
    normalizeGuidedSpecInput(initialValues ?? DEFAULT_GUIDED_SPEC_INPUT),
  );
  const [brief, setBrief] = useState("");
  const [tool, setTool] = useState<"auto" | "codex_cli" | "claude_cli" | "heuristic">(
    preferredTool,
  );
  const [assistPreset, setAssistPreset] = useState<AssistPreset>("idea-to-spec");
  const [assistNotes, setAssistNotes] = useState<string[]>([]);
  const [assistSource, setAssistSource] = useState<string>("No assist run yet.");
  const [isPending, startTransition] = useTransition();

  const availableToolCount = useMemo(
    () => toolStatuses.filter((status) => status.available).length,
    [toolStatuses],
  );

  function updateField<K extends keyof GuidedSpecInput>(key: K, value: GuidedSpecInput[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function populateFromAssist() {
    if (!brief.trim()) {
      setAssistNotes(["Add a short idea brief before asking the agent assist to populate fields."]);
      return;
    }

    startTransition(async () => {
      // Use the system prompt from the selected preset
      const systemPrompt = PRESET_SYSTEM_PROMPTS[assistPreset];

      const response = await fetch("/api/agent/assist", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          brief,
          tool,
          systemPrompt,
          contextPrompt: "",
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as AssistErrorResponse | null;
        setAssistSource("Assist failed");
        if (response.status === 429 && errorPayload?.quota) {
          setAssistNotes([
            errorPayload.message ??
              "This workspace has used its included assist quota. Keep editing manually or upgrade the plan.",
            `Assist runs used: ${errorPayload.quota.used}/${errorPayload.quota.limit ?? "unlimited"}.`,
          ]);
          return;
        }
        setAssistNotes(["The assist request failed. Keep editing manually or retry."]);
        return;
      }

      const payload = await response.json().catch(() => null) as AssistResponse | null;
      if (!payload?.fields) {
        setAssistSource("Assist failed");
        setAssistNotes(["The assist returned an unexpected response. Keep editing manually or retry."]);
        return;
      }
      setFields(payload.fields);
      setAssistSource(
        payload.tool === "heuristic"
          ? "Built-in fallback populated the fields."
          : `${payload.tool.replaceAll("_", " ")} populated the fields.`,
      );
      setAssistNotes(payload.notes);
    });
  }

  return (
    <form action={createDocumentAction} className={styles.form} data-testid="create-document-form">
      <input type="hidden" name="mode" value="guided" />

      <details className={styles.wizardSection} open>
        <summary className={styles.disclosureSummary}>
          <span>Agent assist</span>
          <span>
            {cliAssistEnabled ? `${availableToolCount} tools available` : "Fallback only"}
          </span>
        </summary>
        <div className={styles.disclosureBody}>
          <p className={styles.context}>
            Use a rough brief to populate the guided fields. In local mode, SpecForge can reuse
            existing server-side Codex or Claude Code CLI logins. In hosted mode, the browser still
            never receives provider secrets.
          </p>
          <p className={styles.context}>
            Current default runtime:{" "}
            <strong>{tool === "auto" ? "auto-select" : tool.replaceAll("_", " ")}</strong>.
            Change it from the workspace session panel if you want SpecForge to keep preferring a
            specific local CLI.
          </p>
          <label>
            Idea brief
            <textarea
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              rows={5}
              placeholder="Describe the product, users, workflow, and what should ship first."
              data-testid="agent-assist-brief"
            />
          </label>
          <label>
            Assist runtime
            <select
              value={tool}
              onChange={(event) =>
                setTool(
                  event.target.value as "auto" | "codex_cli" | "claude_cli" | "heuristic",
                )
              }
              className={styles.selectInput}
            >
              <option value="auto">Auto-select the best local assist</option>
              <option value="codex_cli">Codex CLI</option>
              <option value="claude_cli">Claude Code CLI</option>
              <option value="heuristic">Built-in fallback</option>
            </select>
          </label>
          <label>
            Assist preset
            <select
              value={assistPreset}
              onChange={(event) =>
                setAssistPreset(event.target.value as AssistPreset)
              }
              className={styles.selectInput}
            >
              <option value="idea-to-spec">Idea to Spec (full spec generation)</option>
              <option value="block-iteration">Block Iteration (improve section)</option>
              <option value="clarification-answer">Clarification Answer</option>
              <option value="design-feedback">Design Feedback</option>
              <option value="planning-assist">Planning Assist</option>
            </select>
          </label>
          <div className={styles.inlineActions}>
            <button type="button" onClick={populateFromAssist} disabled={isPending}>
              {isPending ? "Generating..." : "Populate fields with assist"}
            </button>
          </div>
          <div className={styles.showcaseList}>
            {toolStatuses.map((status) => (
              <article key={status.id} className={styles.showcaseCard}>
                <div className={styles.patchHeader}>
                  <strong>{status.label}</strong>
                  <span className={styles.badge}>{status.available ? "available" : "unavailable"}</span>
                </div>
                <p className={styles.context}>{status.detail}</p>
              </article>
            ))}
          </div>
          <div className={styles.actorCard}>
            <strong>{assistSource}</strong>
            <ul className={styles.readinessList}>
              {assistNotes.length > 0 ? (
                assistNotes.map((note) => <li key={note}>{note}</li>)
              ) : (
                <li>Review and tighten the generated fields before creating the draft.</li>
              )}
            </ul>
          </div>
        </div>
      </details>

      <label>
        Title
        <input
          name="title"
          value={fields.title}
          onChange={(event) => updateField("title", event.target.value)}
          data-testid="create-document-title"
        />
      </label>
      <details className={styles.wizardSection} open>
        <summary className={styles.disclosureSummary}>
          <span>Why this exists</span>
          <span>Problem and goals</span>
        </summary>
        <div className={styles.disclosureBody}>
          <label>
            Problem
            <textarea
              name="problem"
              rows={4}
              value={fields.problem}
              onChange={(event) => updateField("problem", event.target.value)}
            />
          </label>
          <label>
            Goals
            <textarea
              name="goals"
              rows={4}
              value={fields.goals}
              onChange={(event) => updateField("goals", event.target.value)}
            />
          </label>
          <label>
            Users
            <textarea
              name="users"
              rows={3}
              value={fields.users}
              onChange={(event) => updateField("users", event.target.value)}
            />
          </label>
        </div>
      </details>
      <details className={styles.wizardSection} open>
        <summary className={styles.disclosureSummary}>
          <span>What we will build</span>
          <span>Scope and boundaries</span>
        </summary>
        <div className={styles.disclosureBody}>
          <label>
            Scope
            <textarea
              name="scope"
              rows={4}
              value={fields.scope}
              onChange={(event) => updateField("scope", event.target.value)}
            />
          </label>
          <label>
            Requirements
            <textarea
              name="requirements"
              rows={4}
              value={fields.requirements}
              onChange={(event) => updateField("requirements", event.target.value)}
            />
          </label>
          <label>
            Non-goals
            <textarea
              name="non_goals"
              rows={3}
              value={fields.nonGoals}
              onChange={(event) => updateField("nonGoals", event.target.value)}
            />
          </label>
        </div>
      </details>
      <details className={styles.wizardSection}>
        <summary className={styles.disclosureSummary}>
          <span>Experience design</span>
          <span>UX pack and edge cases</span>
        </summary>
        <div className={styles.disclosureBody}>
          <p className={styles.context}>
            SpecForge should not leave UI or workflow design implicit. Describe the primary
            surfaces, key screens, important states, failure paths, and mobile expectations. If
            this spec is API-only or CLI-only, state that explicitly here.
          </p>
          <label>
            UX pack
            <textarea
              name="ux_pack"
              rows={5}
              value={fields.uxPack}
              onChange={(event) => updateField("uxPack", event.target.value)}
            />
          </label>
        </div>
      </details>
      <details className={styles.wizardSection}>
        <summary className={styles.disclosureSummary}>
          <span>Delivery guardrails</span>
          <span>Constraints and tasks</span>
        </summary>
        <div className={styles.disclosureBody}>
          <label>
            Constraints
            <textarea
              name="constraints"
              rows={4}
              value={fields.constraints}
              onChange={(event) => updateField("constraints", event.target.value)}
            />
          </label>
          <label>
            Success signals
            <textarea
              name="success_signals"
              rows={3}
              value={fields.successSignals}
              onChange={(event) => updateField("successSignals", event.target.value)}
            />
          </label>
          <label>
            Initial tasks
            <textarea
              name="tasks"
              rows={4}
              value={fields.tasks}
              onChange={(event) => updateField("tasks", event.target.value)}
            />
          </label>
        </div>
      </details>
      <button type="submit">Create guided draft</button>
    </form>
  );
}
