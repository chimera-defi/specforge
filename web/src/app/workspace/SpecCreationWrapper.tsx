"use client";

import { useState } from "react";

import { IdeaGenerator } from "@/components/specforge/IdeaGenerator";
import type { AgentAssistToolStatus } from "@/lib/specforge/agent-assist";
import { GuidedDraftBuilder } from "../guided-draft-builder";

type Mode = "guided" | "idea";

interface SpecCreationWrapperProps {
  toolStatuses: AgentAssistToolStatus[];
  cliAssistEnabled: boolean;
  preferredTool: string | null;
}

export function SpecCreationWrapper({
  toolStatuses,
  cliAssistEnabled,
  preferredTool,
}: SpecCreationWrapperProps) {
  const [mode, setMode] = useState<Mode>("guided");
  const safePreferredTool: "auto" | "codex_cli" | "claude_cli" | "heuristic" = 
    (preferredTool as any) || "auto";

  if (mode === "idea") {
    return (
      <div>
        <div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
          <button
            onClick={() => setMode("guided")}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid var(--sf-border)",
              background: "var(--sf-surface-warm)",
              color: "var(--sf-ink)",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Guided Spec
          </button>
          <button
            onClick={() => setMode("idea")}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid var(--sf-primary)",
              background: "var(--sf-primary)",
              color: "var(--sf-surface-warm)",
              fontSize: "0.875rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Idea Generator
          </button>
        </div>
        <IdeaGenerator
          onGenerate={async (scaffold) => {
            // Call the API to generate idea and spec
            const response = await fetch("/api/ideas/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(scaffold),
            });
            if (!response.ok) {
              alert("Failed to generate idea");
              return;
            }
            const data = await response.json();
            alert(`Idea generated! Check console for output.`);
            console.log("Generated:", data);
            setMode("guided");
          }}
          onCancel={() => setMode("guided")}
        />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
        <button
          onClick={() => setMode("guided")}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid var(--sf-primary)",
            background: "var(--sf-primary)",
            color: "var(--sf-surface-warm)",
            fontSize: "0.875rem",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Guided Spec
        </button>
        <button
          onClick={() => setMode("idea")}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid var(--sf-border)",
            background: "var(--sf-surface-warm)",
            color: "var(--sf-ink)",
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          Idea Generator
        </button>
      </div>
      <GuidedDraftBuilder
        toolStatuses={toolStatuses}
        cliAssistEnabled={cliAssistEnabled}
        preferredTool={safePreferredTool}
      />
    </div>
  );
}