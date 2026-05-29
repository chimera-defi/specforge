"use client";

/**
 * IterateWithAIChat
 *
 * Chat-like interface for rapid document iteration.
 * Opens as a second option after AI Assist is used.
 * Pipes in document context and file path for the AI iteration helper.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type Props = {
  documentId: string;
  documentContent: string;
  documentTitle: string;
  actorId: string;
  /** Optional file path for context */
  filePath?: string;
  /** Whether to show the button (appears after AI Assist is used) */
  show?: boolean;
};

type IterationResponse = {
  patch_id: string;
  proposed_content: string;
  tool: "claude_cli" | "heuristic";
  notes?: string[];
};

export function IterateWithAIChat({
  documentId,
  documentContent,
  documentTitle,
  actorId,
  filePath,
  show = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: getHelpfulGuidelines(documentTitle, filePath),
      timestamp: new Date(),
    },
  ]);
  const [_error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/iterate-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          actor_id: actorId,
          actor_type: "human",
          context: {
            documentContent,
            documentTitle,
            filePath,
          },
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      const result: IterationResponse = data.result ?? data;
      
      // Add assistant response
      const assistantMessage: Message = {
        role: "assistant",
        content: formatAssistantResponse(result),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${errorMessage}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [documentId, actorId, input, loading, documentContent, documentTitle, filePath]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit],
  );

  if (!show) {
    return null;
  }

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
        gap: "10px",
      }}
    >
      {/* Chat window */}
      {open ? (
        <div
          style={{
            width: "500px",
            maxHeight: "600px",
            background: "var(--sf-surface-warm)",
            border: "1px solid var(--sf-border)",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid var(--sf-border)",
              background: "var(--sf-surface)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--sf-ink)",
                }}
              >
                Iterate with AI
              </h3>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "0.75rem",
                  color: "var(--sf-muted)",
                }}
              >
                {documentTitle}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "1.25rem",
                color: "var(--sf-muted)",
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
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    background:
                      msg.role === "user"
                        ? "var(--sf-primary)"
                        : "var(--sf-surface)",
                    color: msg.role === "user" ? "var(--sf-surface-warm)" : "var(--sf-ink)",
                    fontSize: "0.875rem",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    border:
                      msg.role === "assistant"
                        ? "1px solid var(--sf-border)"
                        : "none",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "12px",
                    background: "var(--sf-surface)",
                    border: "1px solid var(--sf-border)",
                    fontSize: "0.875rem",
                    color: "var(--sf-muted)",
                  }}
                >
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "12px",
              borderTop: "1px solid var(--sf-border)",
              background: "var(--sf-surface)",
            }}
          >
            <div style={{ display: "flex", gap: "8px" }}>
              <textarea
                rows={2}
                placeholder="Describe what to change... (Shift+Enter for new line, Enter to send)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                style={{
                  flex: 1,
                  resize: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--sf-border)",
                  background: "var(--sf-surface-warm)",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={loading || !input.trim()}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  background: loading || !input.trim() ? "var(--sf-muted-light)" : "var(--sf-primary)",
                  color: loading || !input.trim() ? "var(--sf-muted)" : "var(--sf-surface-warm)",
                  border: "none",
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "12px 20px",
          borderRadius: "999px",
          background: open ? "var(--sf-primary)" : "var(--sf-surface-warm)",
          color: open ? "var(--sf-surface-warm)" : "var(--sf-ink)",
          border: open ? "none" : "1px solid var(--sf-border)",
          cursor: "pointer",
          fontSize: "0.875rem",
          fontWeight: 500,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span>✦</span> {open ? "Close Chat" : "Iterate with AI"}
      </button>
    </div>
  );
}

function getHelpfulGuidelines(documentTitle: string, filePath?: string): string {
  let guidelines = `Hi! I'm here to help you iterate on "${documentTitle}".\n\n`;
  guidelines += `I can help you:\n`;
  guidelines += `• Refine and improve sections\n`;
  guidelines += `• Add specific details or examples\n`;
  guidelines += `• Clarify ambiguous language\n`;
  guidelines += `• Improve structure and flow\n`;
  guidelines += `• Add technical depth\n\n`;
  guidelines += `Just describe what you'd like to change, and I'll propose a patch for you to review.\n\n`;
  
  if (filePath) {
    guidelines += `I'm working with the file: ${filePath}\n\n`;
  }
  
  guidelines += `What would you like to improve?`;
  return guidelines;
}

function formatAssistantResponse(result: IterationResponse): string {
  let response = `I've created a patch for you to review!\n\n`;
  response += `**Tool:** ${result.tool === "claude_cli" ? "Claude CLI" : "Heuristic"}\n`;
  response += `**Patch ID:** ${result.patch_id}\n\n`;
  
  if (result.notes && result.notes.length > 0) {
    response += `**Notes:**\n`;
    result.notes.forEach((note) => {
      response += `• ${note}\n`;
    });
    response += `\n`;
  }
  
  response += `You can review and accept this patch in the decision queue. The proposed changes will be applied once you approve them.`;
  return response;
}