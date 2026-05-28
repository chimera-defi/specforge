"use client";

/**
 * AIAssistButton
 *
 * Reusable AI assist button component with configurable prompts and guidance
 * for different contexts (idea-to-spec, block iteration, clarifications, etc.).
 * 
 * ## Usage Examples
 * 
 * ### Idea-to-Spec Mode (default guidance included)
 * ```tsx
 * <AIAssistButton
 *   mode="inline"
 *   preset="idea-to-spec"
 *   toolStatuses={toolStatuses}
 *   onAssist={async (tool, input, systemPrompt, contextPrompt) => {
 *     // API receives all prompts
 *     await fetch('/api/agent/assist', {
 *       method: 'POST',
 *       body: JSON.stringify({ tool, input, systemPrompt, contextPrompt }),
 *     });
 *   }}
 * />
 * ```
 * 
 * ### Custom Prompt Mode with Context Variables
 * ```tsx
 * <AIAssistButton
 *   mode="inline"
 *   label="Iterate with AI"
 *   systemPrompt="You are a technical reviewer. Focus on code quality."
 *   contextPrompt="Section: {sectionHeading}. Current content: {currentContent}"
 *   contextVars={{ sectionHeading: "Architecture", currentContent: "..." }}
 *   toolStatuses={toolStatuses}
 *   onAssist={handleAssist}
 * />
 * ```
 * 
 * ### Block Iteration Mode
 * ```tsx
 * <AIAssistButton
 *   mode="inline"
 *   preset="block-iteration"
 *   contextPrompt="Section: {heading}. Current: {content}"
 *   contextVars={{ heading: "Architecture", content: "..." }}
 *   toolStatuses={toolStatuses}
 *   onAssist={handleIteration}
 * />
 * ```
 * 
 * ## Preset Modes
 * 
 * - `idea-to-spec`: Generate full spec from idea (includes comprehensive default guidance)
 * - `block-iteration`: Iterate on a specific document section
 * - `clarification-answer`: Answer a clarification question
 * - `design-feedback`: Provide design review feedback
 * - `planning-assist`: Help with planning stage questions
 * - `custom`: Use fully custom prompts
 * 
 * Each preset includes appropriate default system and context prompts.
 * Use `systemPrompt` and `contextPrompt` props to override defaults.
 * 
 * ## Context Variables
 * 
 * Use `{variableName}` in contextPrompt to interpolate values from contextVars.
 * This allows dynamic prompt construction based on runtime state.
 */

import { useState } from "react";

export type AIAssistMode = "inline" | "panel" | "simple";

export type AIAssistTool = "auto" | "codex_cli" | "claude_cli" | "devin_cli" | "heuristic";

export type AIAssistPreset = 
  | "idea-to-spec"
  | "block-iteration"
  | "clarification-answer"
  | "design-feedback"
  | "planning-assist"
  | "custom";

type ToolStatus = {
  id: AIAssistTool;
  label: string;
  available: boolean;
  detail: string;
};

// Default prompts for each preset
const PRESET_PROMPTS: Record<
  AIAssistPreset,
  { systemPrompt: string; contextPrompt: string; placeholder: string; defaultLabel: string }
> = {
  "idea-to-spec": {
    systemPrompt: `You are an expert product manager and technical architect. Your goal is to transform a rough idea into a comprehensive, actionable product specification.

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
    contextPrompt: "",
    placeholder: "Describe your product idea in a few sentences (what it does, who it's for, why it matters)...",
    defaultLabel: "Generate spec from idea",
  },
  "block-iteration": {
    systemPrompt: `You are a technical editor helping improve a specific section of a product specification.

GUIDELINES:
- Keep the same structure and tone as the existing content
- Make changes concrete and actionable
- Preserve the original intent while improving clarity and completeness
- Add missing details that would be helpful for implementation
- Remove ambiguity where possible
- Maintain consistency with the rest of the spec

Return the improved section content.`,
    contextPrompt: "",
    placeholder: "Describe what to change in this section (e.g., 'Make the success criteria more specific', 'Add technical constraints')...",
    defaultLabel: "Iterate with AI",
  },
  "clarification-answer": {
    systemPrompt: `You are a product specification expert helping answer clarification questions.

GUIDELINES:
- Answer the question directly and concisely
- Provide enough detail to resolve the ambiguity
- If the question reveals a gap in the spec, acknowledge it and suggest how to fill it
- Keep answers implementation-focused
- Avoid scope creep - stay within the stated product boundaries

Return a clear, actionable answer that can be written into the spec.`,
    contextPrompt: "",
    placeholder: "Describe the clarification answer...",
    defaultLabel: "Get AI answer",
  },
  "design-feedback": {
    systemPrompt: `You are a UX/UI design reviewer providing feedback on design specifications.

GUIDELINES:
- Focus on user experience and usability
- Identify potential friction points or confusing elements
- Suggest improvements that align with the product goals
- Consider accessibility and responsive design
- Be specific about what to change and why
- Balance creativity with practicality

Return specific, actionable design feedback.`,
    contextPrompt: "",
    placeholder: "Describe what aspect of the design to review...",
    defaultLabel: "Get design feedback",
  },
  "planning-assist": {
    systemPrompt: `You are a senior technical architect helping answer planning stage questions.

GUIDELINES:
- Provide concrete, specific answers to planning questions
- Consider technical feasibility and trade-offs
- Reference industry best practices where appropriate
- Keep answers aligned with the stated product scope
- Highlight any risks or dependencies
- Make recommendations that can be implemented in the current iteration

Return clear, actionable planning answers.`,
    contextPrompt: "",
    placeholder: "Provide context about the planning stage and your question...",
    defaultLabel: "Get planning help",
  },
  "custom": {
    systemPrompt: "",
    contextPrompt: "",
    placeholder: "Describe what you need help with...",
    defaultLabel: "AI Assist",
  },
};

/**
 * Interpolate context variables into a prompt template
 * Replaces {variableName} with values from contextVars
 */
function resolveContextPrompt(
  template: string,
  contextVars?: Record<string, string>,
): string {
  if (!template || !contextVars) return template;
  
  let result = template;
  for (const [key, value] of Object.entries(contextVars)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}

type Props = {
  /** Mode determines the UI behavior */
  mode?: AIAssistMode;
  /** Preset mode for default prompts (overrides custom prompts if not provided) */
  preset?: AIAssistPreset;
  /** Custom system prompt (overrides preset if provided) */
  systemPrompt?: string;
  /** Custom context/prompt to inject (supports {var} interpolation) */
  contextPrompt?: string;
  /** Additional context variables for dynamic prompt interpolation */
  contextVars?: Record<string, string>;
  /** Button label (overrides preset default) */
  label?: string;
  /** Button icon (optional) */
  icon?: React.ReactNode;
  /** Available AI tools */
  toolStatuses: ToolStatus[];
  /** Currently selected tool */
  selectedTool?: AIAssistTool;
  /** Callback when tool selection changes */
  onToolChange?: (tool: AIAssistTool) => void;
  /** Callback when assist is triggered - receives all prompts */
  onAssist: (
    tool: AIAssistTool,
    input: string,
    systemPrompt: string,
    contextPrompt: string,
  ) => Promise<void>;
  /** Placeholder for input field (overrides preset) */
  placeholder?: string;
  /** Whether CLI assist is enabled */
  cliAssistEnabled?: boolean;
  /** CSS class for the button */
  className?: string;
  /** Additional button styles */
  style?: React.CSSProperties;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Initial expanded state for inline mode */
  defaultOpen?: boolean;
  /** Show the system prompt in the UI (for debugging/visibility) */
  showSystemPrompt?: boolean;
};

export function AIAssistButton({
  mode = "inline",
  preset = "custom",
  systemPrompt: customSystemPrompt,
  contextPrompt: customContextPrompt,
  contextVars,
  label: customLabel,
  icon,
  toolStatuses,
  selectedTool = "auto",
  onToolChange,
  onAssist,
  placeholder: customPlaceholder,
  cliAssistEnabled = true,
  className,
  style,
  disabled = false,
  loading = false,
  defaultOpen = false,
  showSystemPrompt = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // Resolve prompts from preset or custom values
  const presetConfig = PRESET_PROMPTS[preset];
  const finalSystemPrompt = customSystemPrompt ?? presetConfig.systemPrompt;
  const finalContextPrompt = resolveContextPrompt(
    customContextPrompt ?? presetConfig.contextPrompt,
    contextVars,
  );
  const finalPlaceholder = customPlaceholder ?? presetConfig.placeholder;
  const finalLabel = customLabel ?? presetConfig.defaultLabel;

  const availableToolCount = toolStatuses.filter((t) => t.available).length;

  async function handleAssist() {
    if (!input.trim() || isPending) return;

    setIsPending(true);
    setError(null);
    setResult(null);

    try {
      await onAssist(selectedTool, input.trim(), finalSystemPrompt, finalContextPrompt);
      setResult(`${selectedTool === "heuristic" ? "Built-in fallback" : selectedTool} completed successfully.`);
      setInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsPending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleAssist();
    }
  }

  // Simple mode - just a button
  if (mode === "simple") {
    return (
    <button
      type="button"
      onClick={() => void handleAssist()}
      disabled={disabled || loading}
      className={className}
      style={{
        padding: "0.3rem 0.75rem",
        borderRadius: "999px",
        background: loading ? "rgba(28,26,23,0.15)" : "#1c1a17",
        color: loading ? "#6b7280" : "#fffbf6",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        fontSize: "0.78rem",
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: "0.35rem",
        ...style,
      }}
      title={finalSystemPrompt ? `System prompt: ${finalSystemPrompt.slice(0, 100)}...` : undefined}
    >
      {icon}
      {loading ? "Processing..." : finalLabel}
    </button>
  );
  }

  // Inline mode - expands to show input
  if (mode === "inline") {
    return (
    <div
      style={{
        marginTop: "0.5rem",
        borderTop: open ? "1px solid rgba(28,26,23,0.08)" : "none",
        paddingTop: open ? "0.75rem" : 0,
      }}
    >
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setError(null);
          setResult(null);
        }}
        disabled={disabled}
        className={className}
        style={{
          padding: "0.3rem 0.75rem",
          borderRadius: "999px",
          background: open ? "rgba(28,26,23,0.08)" : "transparent",
          color: "#1c1a17",
          border: "1px solid rgba(28,26,23,0.15)",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: "0.78rem",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          opacity: disabled ? 0.5 : 1,
          ...style,
        }}
        title={finalLabel}
      >
        {icon || <span style={{ opacity: 0.7 }}>✦</span>}
        {finalLabel}
      </button>

      {open ? (
        <div
          style={{
            marginTop: "0.65rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.78rem",
              opacity: 0.6,
            }}
          >
            {cliAssistEnabled
              ? `${availableToolCount} AI tools available`
              : "Fallback mode only"}
          </p>

          {showSystemPrompt && finalSystemPrompt && (
            <div
              style={{
                padding: "0.5rem",
                background: "rgba(28,26,23,0.04)",
                borderRadius: "6px",
                fontSize: "0.75rem",
                opacity: 0.7,
              }}
            >
              <strong>System prompt:</strong> {finalSystemPrompt.slice(0, 200)}...
            </div>
          )}

          {finalContextPrompt && (
            <div
              style={{
                padding: "0.5rem",
                background: "rgba(28,26,23,0.04)",
                borderRadius: "6px",
                fontSize: "0.75rem",
                opacity: 0.7,
              }}
            >
              <strong>Context:</strong> {finalContextPrompt.slice(0, 200)}...
            </div>
          )}

          {onToolChange && (
            <label>
              <select
                value={selectedTool}
                onChange={(e) =>
                  onToolChange(e.target.value as AIAssistTool)
                }
                disabled={!cliAssistEnabled}
                style={{
                  padding: "0.4rem 0.6rem",
                  borderRadius: "6px",
                  border: "1px solid rgba(28,26,23,0.15)",
                  background: "rgba(255,251,246,0.9)",
                  fontSize: "0.82rem",
                  width: "100%",
                }}
              >
                <option value="auto">Auto-select</option>
                {toolStatuses.map((tool) => (
                  <option
                    key={tool.id}
                    value={tool.id}
                    disabled={!tool.available}
                  >
                    {tool.label} {tool.available ? "" : "(unavailable)"}
                  </option>
                ))}
              </select>
            </label>
          )}

          <textarea
            rows={3}
            placeholder={finalPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            style={{
              resize: "vertical",
              padding: "0.55rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid rgba(28,26,23,0.15)",
              background: "rgba(255,251,246,0.9)",
              fontSize: "0.82rem",
              fontFamily: "inherit",
            }}
          />

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={handleAssist}
              disabled={isPending || !input.trim()}
              style={{
                padding: "0.55rem 0.9rem",
                borderRadius: "999px",
                background:
                  isPending || !input.trim() ? "rgba(28,26,23,0.15)" : "#1c1a17",
                color: isPending || !input.trim() ? "#6b7280" : "#fffbf6",
                border: "none",
                cursor: isPending || !input.trim() ? "not-allowed" : "pointer",
                fontSize: "0.82rem",
                fontWeight: 500,
              }}
            >
              {isPending ? "Processing..." : "Send"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                padding: "0.55rem 0.9rem",
                borderRadius: "999px",
                background: "transparent",
                color: "#1c1a17",
                border: "1px solid rgba(28,26,23,0.15)",
                cursor: "pointer",
                fontSize: "0.82rem",
              }}
            >
              Cancel
            </button>
          </div>

          {error ? (
            <p
              style={{
                margin: 0,
                fontSize: "0.8rem",
                color: "#dc2626",
                padding: "0.4rem 0.65rem",
                background: "rgba(220,38,38,0.06)",
                borderRadius: "6px",
              }}
            >
              {error}
            </p>
          ) : null}

          {result ? (
            <p
              style={{
                margin: 0,
                fontSize: "0.8rem",
                color: "#16a34a",
                padding: "0.4rem 0.65rem",
                background: "rgba(22,163,74,0.06)",
                borderRadius: "6px",
              }}
            >
              {result}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
  }

  // Panel mode - shows tool selection and brief input
  return (
    <div className={className} style={style}>
      <div
        style={{
          padding: "0.75rem",
          borderRadius: "8px",
          border: "1px solid rgba(28,26,23,0.15)",
          background: "rgba(255,251,246,0.9)",
        }}
      >
        <p
          style={{
            margin: "0 0 0.75rem 0",
            fontSize: "0.82rem",
            opacity: 0.7,
          }}
        >
          {cliAssistEnabled
            ? `${availableToolCount} AI tools available`
            : "Fallback mode only"}
        </p>

        {showSystemPrompt && finalSystemPrompt && (
          <div
            style={{
              padding: "0.5rem",
              background: "rgba(28,26,23,0.04)",
              borderRadius: "6px",
              fontSize: "0.75rem",
              opacity: 0.7,
              marginBottom: "0.5rem",
            }}
          >
            <strong>System prompt:</strong> {finalSystemPrompt.slice(0, 200)}...
          </div>
        )}

        {finalContextPrompt && (
          <div
            style={{
              padding: "0.5rem",
              background: "rgba(28,26,23,0.04)",
              borderRadius: "6px",
              fontSize: "0.75rem",
              opacity: "0.7",
              marginBottom: "0.5rem",
            }}
          >
            <strong>Context:</strong> {finalContextPrompt.slice(0, 200)}...
          </div>
        )}

        {onToolChange && (
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            AI Tool
            <select
              value={selectedTool}
              onChange={(e) => onToolChange(e.target.value as AIAssistTool)}
              disabled={!cliAssistEnabled}
              style={{
                padding: "0.4rem 0.6rem",
                borderRadius: "6px",
                border: "1px solid rgba(28,26,23,0.15)",
                background: "#fff",
                fontSize: "0.82rem",
                width: "100%",
              }}
            >
              <option value="auto">Auto-select</option>
              {toolStatuses.map((tool) => (
                <option
                  key={tool.id}
                  value={tool.id}
                  disabled={!tool.available}
                >
                  {tool.label} {tool.available ? "" : "(unavailable)"}
                </option>
              ))}
            </select>
          </label>
        )}

        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Input
          <textarea
            rows={4}
            placeholder={finalPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            style={{
              resize: "vertical",
              padding: "0.55rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid rgba(28,26,23,0.15)",
              background: "#fff",
              fontSize: "0.82rem",
              fontFamily: "inherit",
              width: "100%",
            }}
          />
        </label>

        <button
          type="button"
          onClick={handleAssist}
          disabled={isPending || !input.trim()}
          style={{
            padding: "0.55rem 0.9rem",
            borderRadius: "999px",
            background: isPending || !input.trim() ? "rgba(28,26,23,0.15)" : "#1c1a17",
            color: isPending || !input.trim() ? "#6b7280" : "#fffbf6",
            border: "none",
            cursor: isPending || !input.trim() ? "not-allowed" : "pointer",
            fontSize: "0.82rem",
            fontWeight: 500,
          }}
        >
          {isPending ? "Processing..." : finalLabel}
        </button>

        {error ? (
          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontSize: "0.8rem",
              color: "#dc2626",
              padding: "0.4rem 0.65rem",
              background: "rgba(220,38,38,0.06)",
              borderRadius: "6px",
            }}
          >
            {error}
          </p>
        ) : null}

        {result ? (
          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontSize: "0.8rem",
              color: "#16a34a",
              padding: "0.4rem 0.65rem",
              background: "rgba(22,163,74,0.06)",
              borderRadius: "6px",
            }}
          >
            {result}
          </p>
        ) : null}

        {toolStatuses.length > 0 && (
          <div
            style={{
              marginTop: "0.75rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid rgba(28,26,23,0.08)",
            }}
          >
            {toolStatuses.map((tool) => (
              <div
                key={tool.id}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0",
                  opacity: tool.available ? 1 : 0.5,
                }}
              >
                <strong>{tool.label}</strong>: {tool.detail}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}