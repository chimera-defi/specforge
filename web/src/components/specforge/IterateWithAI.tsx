"use client";

/**
 * IterateWithAI
 *
 * Unified component for AI-powered document iteration.
 * Supports two modes:
 * - "inline": Inline block iteration for review stage (block-level)
 * - "chat": Chat-like interface for document workspace (document-level with message history)
 *
 * Both modes use the same underlying API endpoint (/api/documents/[id]/sections/[blockId]/iterate)
 * which calls Claude CLI or heuristic fallback and creates governed PatchProposals.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { documentApi } from "@/lib/api-client";

type InlineProps = {
  mode: "inline";
  documentId: string;
  blockId: string;
  blockHeading: string;
  actorId: string;
  /** Link to the decision queue for this document */
  decideHref: string;
};

type ChatProps = {
  mode: "chat";
  documentId: string;
  blockId?: string; // Optional for chat mode - will use first block if not provided
  actorId: string;
  /** Optional document context for chat mode */
  documentTitle?: string;
  /** Whether to show the button (appears after AI Assist is used) */
  show?: boolean;
};

type Props = InlineProps | ChatProps;

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type IterationResult = {
  patch_id: string;
  block_id: string;
  proposed_content: string;
  tool: "claude_cli" | "heuristic";
};

function getHelpfulGuidelines(documentTitle?: string): string {
  const title = documentTitle ? `"${documentTitle}"` : "this document";
  return `I can help you iterate on ${title}. Describe what you'd like to change, and I'll propose a patch for your review. Examples:
• "Make the success criteria more specific"
• "Add implementation details to the requirements"
• "Refactor the technical architecture section"

Your changes will be queued in the decision queue for review.`;
}

function formatAssistantResponse(result: IterationResult): string {
  return `Patch created! ${result.tool === "claude_cli" ? "Claude CLI" : "Heuristic"} proposed changes.

Patch ID: ${result.patch_id}

Preview:
${result.proposed_content.substring(0, 200)}${result.proposed_content.length > 200 ? "..." : ""}

Review this patch in the decision queue.`;
}

export function IterateWithAI(props: Props) {
  const mode = props.mode;
  const documentId = props.documentId;
  const actorId = props.actorId;
  
  // For chat mode, use default blockId if not provided
  const blockId = mode === "chat" 
    ? (props.blockId ?? "document") // Use "document" as default block ID for document-level iteration
    : (props as InlineProps).blockId;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IterationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Chat mode specific state
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat message history
  useEffect(() => {
    if (mode === "chat" && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: getHelpfulGuidelines((props as ChatProps).documentTitle),
          timestamp: new Date(),
        },
      ]);
    }
  }, [mode, messages.length, props]);

  // Auto-scroll to bottom when messages change (chat mode)
  useEffect(() => {
    if (mode === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, mode]);

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    // Chat mode: add user message to history
    if (mode === "chat") {
      const userMessage: Message = {
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
    }

    setInput("");

    try {
      const data = await documentApi.iterateSection(documentId, blockId, {
        message: trimmed,
        actor_id: actorId,
        actor_type: "human",
      }) as { result?: IterationResult };
      
      const iterationResult = data.result ?? null;
      setResult(iterationResult);

      // Chat mode: add assistant response to history
      if (mode === "chat" && iterationResult) {
        const assistantMessage: Message = {
          role: "assistant",
          content: formatAssistantResponse(iterationResult),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setError(errorMessage);
      
      // Chat mode: add error to history
      if (mode === "chat") {
        const errorMessageObj: Message = {
          role: "assistant",
          content: `Error: ${errorMessage}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessageObj]);
      }
    } finally {
      setLoading(false);
    }
  }, [documentId, blockId, actorId, input, loading, mode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit],
  );

  // Chat mode: don't show button if show is false
  if (mode === "chat" && !(props as ChatProps).show) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Inline mode rendering
  if (mode === "inline") {
    const inlineProps = props as InlineProps;
    const { blockHeading, decideHref } = inlineProps;

    return (
      <div
        style={{
          marginTop: "0.5rem",
          borderTop: open ? "1px solid rgba(28,26,23,0.08)" : "none",
          paddingTop: open ? "0.75rem" : 0,
        }}
      >
        {/* Toggle button */}
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setResult(null);
            setError(null);
          }}
          style={{
            padding: "0.3rem 0.75rem",
            borderRadius: "999px",
            background: open ? "rgba(28,26,23,0.08)" : "transparent",
            color: "#1c1a17",
            border: "1px solid rgba(28,26,23,0.15)",
            cursor: "pointer",
            fontSize: "0.78rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
          title={`Iterate on section: ${blockHeading}`}
        >
          <span style={{ opacity: 0.7 }}>✦</span> Iterate with AI
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
              Describe what to change in <strong>{blockHeading}</strong>. Claude will
              propose a patch — you review it in the decision queue.
            </p>

            {/* Chat input */}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <textarea
                rows={3}
                placeholder="Make the success criteria more specific... (⌘↵ to send)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                style={{
                  flex: 1,
                  resize: "vertical",
                  padding: "0.55rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(28,26,23,0.15)",
                  background: "rgba(255,251,246,0.9)",
                  fontSize: "0.82rem",
                  fontFamily: "inherit",
                  minWidth: 0,
                }}
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !input.trim()}
                style={{
                  padding: "0.55rem 0.9rem",
                  borderRadius: "999px",
                  background: loading || !input.trim() ? "rgba(28,26,23,0.15)" : "#1c1a17",
                  color: loading || !input.trim() ? "#6b7280" : "#fffbf6",
                  border: "none",
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {loading ? "Thinking…" : "Send"}
              </button>
            </div>

            {/* Error */}
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

            {/* Result */}
            {result ? (
              <div
                style={{
                  padding: "0.75rem 0.9rem",
                  background: "rgba(34,197,94,0.05)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong style={{ fontSize: "0.82rem" }}>Patch queued</strong>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      opacity: 0.55,
                      padding: "0.15rem 0.5rem",
                      border: "1px solid rgba(28,26,23,0.1)",
                      borderRadius: "999px",
                    }}
                  >
                    {result.tool === "claude_cli" ? "Claude CLI" : "Heuristic"}
                  </span>
                </div>
                <code
                  style={{
                    fontSize: "0.72rem",
                    opacity: 0.6,
                    display: "block",
                  }}
                >
                  {result.patch_id}
                </code>
                <details>
                  <summary
                    style={{
                      cursor: "pointer",
                      fontSize: "0.78rem",
                      opacity: 0.7,
                      userSelect: "none",
                    }}
                  >
                    Preview proposed content
                  </summary>
                  <pre
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.65rem",
                      background: "rgba(255,251,246,0.9)",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      maxHeight: "200px",
                      overflow: "auto",
                    }}
                  >
                    {result.proposed_content}
                  </pre>
                </details>
                <a
                  href={decideHref}
                  style={{
                    fontSize: "0.8rem",
                    color: "#1c1a17",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                  }}
                >
                  Review in decision queue →
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  // Chat mode rendering
  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "0.5rem",
      }}
    >
      {/* Toggle button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            padding: "0.75rem 1.25rem",
            borderRadius: "999px",
            background: "#1c1a17",
            color: "#fffbf6",
            border: "none",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ opacity: 0.7 }}>✦</span> Iterate with AI
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          style={{
            width: "400px",
            maxHeight: "600px",
            background: "#fffbf6",
            border: "1px solid rgba(28,26,23,0.15)",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1rem",
              borderBottom: "1px solid rgba(28,26,23,0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong style={{ fontSize: "0.95rem" }}>Iterate with AI</strong>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.2rem",
                color: "#6b7280",
                padding: "0.25rem",
              }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    opacity: 0.6,
                  }}
                >
                  {msg.role === "user" ? "You" : "AI"}
                </span>
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "12px",
                    maxWidth: "85%",
                    background: msg.role === "user" ? "#1c1a17" : "rgba(28,26,23,0.05)",
                    color: msg.role === "user" ? "#fffbf6" : "#1c1a17",
                    fontSize: "0.85rem",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "1rem",
              borderTop: "1px solid rgba(28,26,23,0.1)",
            }}
          >
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
              <textarea
                rows={2}
                placeholder="Describe what to change... (Shift+Enter for new line)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                style={{
                  flex: 1,
                  resize: "none",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(28,26,23,0.15)",
                  background: "rgba(255,251,246,0.9)",
                  fontSize: "0.85rem",
                  fontFamily: "inherit",
                  minWidth: 0,
                }}
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !input.trim()}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "999px",
                  background: loading || !input.trim() ? "rgba(28,26,23,0.15)" : "#1c1a17",
                  color: loading || !input.trim() ? "#6b7280" : "#fffbf6",
                  border: "none",
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {loading ? "…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
