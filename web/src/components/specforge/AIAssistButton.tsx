"use client";

/**
 * AIAssistButton
 *
 * Reusable AI assist button component that can be used in different contexts.
 * 
 * ## Usage Examples
 * 
 * ### Inline Mode (expands to show input)
 * ```tsx
 * <AIAssistButton
 *   mode="inline"
 *   label="Iterate with AI"
 *   toolStatuses={toolStatuses}
 *   selectedTool="auto"
 *   onToolChange={(tool) => setSelectedTool(tool)}
 *   onAssist={async (tool, input) => {
 *     // Call your API endpoint
 *     await fetch('/api/ai/assist', {
 *       method: 'POST',
 *       body: JSON.stringify({ tool, input }),
 *     });
 *   }}
 *   placeholder="Describe what to change..."
 *   cliAssistEnabled={true}
 * />
 * ```
 * 
 * ### Panel Mode (shows tool selection and input)
 * ```tsx
 * <AIAssistButton
 *   mode="panel"
 *   label="Populate fields with AI"
 *   toolStatuses={toolStatuses}
 *   selectedTool="auto"
 *   onAssist={async (tool, input) => {
 *     // Handle AI assist
 *   }}
 *   placeholder="Describe your idea..."
 * />
 * ```
 * 
 * ### Simple Mode (just a button)
 * ```tsx
 * <AIAssistButton
 *   mode="simple"
 *   label="AI Assist"
 *   onAssist={async (tool, input) => {
 *     // Handle AI assist with predefined input
 *   }}
 *   loading={isLoading}
 * />
 * ```
 * 
 * ## Required API Endpoints
 * 
 * To use this component, you'll need to implement API endpoints that:
 * 1. Accept the tool type and input text
 * 2. Call the appropriate AI CLI (Codex, Claude, Devin, or heuristic)
 * 3. Return the result to update your UI
 * 
 * See existing implementations:
 * - `/api/agent/assist` - Used by guided-draft-builder
 * - `/api/documents/[id]/sections/[blockId]/iterate` - Used by IterateWithAI
 * 
 * ## Future Integration Points
 * 
 * Consider adding AIAssistButton to:
 * - ClarificationQueue - Help draft clarification answers
 * - SprintPlanningPanel - Assist with planning stage answers
 * - document-workspace - Document-level AI assist
 * - design-handoff-panel - AI-powered design feedback
 * 
 * Each integration will require a corresponding API endpoint.
 */

import { useState } from "react";

export type AIAssistMode = "inline" | "panel" | "simple";

export type AIAssistTool = "auto" | "codex_cli" | "claude_cli" | "devin_cli" | "heuristic";

type ToolStatus = {
  id: AIAssistTool;
  label: string;
  available: boolean;
  detail: string;
};

type Props = {
  /** Mode determines the UI behavior */
  mode?: AIAssistMode;
  /** Button label */
  label?: string;
  /** Button icon (optional) */
  icon?: React.ReactNode;
  /** Available AI tools */
  toolStatuses: ToolStatus[];
  /** Currently selected tool */
  selectedTool?: AIAssistTool;
  /** Callback when tool selection changes */
  onToolChange?: (tool: AIAssistTool) => void;
  /** Callback when assist is triggered */
  onAssist: (tool: AIAssistTool, input: string) => Promise<void>;
  /** Placeholder for input field */
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
};

export function AIAssistButton({
  mode = "inline",
  label = "AI Assist",
  icon,
  toolStatuses,
  selectedTool = "auto",
  onToolChange,
  onAssist,
  placeholder = "Describe what you need help with...",
  cliAssistEnabled = true,
  className,
  style,
  disabled = false,
  loading = false,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const availableToolCount = toolStatuses.filter((t) => t.available).length;

  async function handleAssist() {
    if (!input.trim() || isPending) return;

    setIsPending(true);
    setError(null);
    setResult(null);

    try {
      await onAssist(selectedTool, input.trim());
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
    >
      {icon}
      {loading ? "Processing..." : label}
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
        title={label}
      >
        {icon || <span style={{ opacity: 0.7 }}>✦</span>}
        {label}
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
            placeholder={placeholder}
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
            placeholder={placeholder}
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
          {isPending ? "Processing..." : label}
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