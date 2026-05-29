"use client";

import { useState } from "react";

import { normalizeIdeaScaffold, type IdeaScaffold } from "@/lib/specforge/ideas-generator";
import type { AgentAssistToolStatus } from "@/lib/specforge/agent-assist";

interface IdeaGeneratorProps {
  onGenerate: (scaffold: Partial<IdeaScaffold>) => void;
  onCancel: () => void;
}

export function IdeaGenerator({ onGenerate, onCancel }: IdeaGeneratorProps) {
  const [scaffold, setScaffold] = useState<Partial<IdeaScaffold>>({
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
  });

  const [briefDescription, setBriefDescription] = useState("");
  const [isAssisting, setIsAssisting] = useState(false);
  const [assistError, setAssistError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(scaffold);
  };

  const handleChange = (field: keyof IdeaScaffold, value: string) => {
    setScaffold(prev => ({ ...prev, [field]: value }));
  };

  const handleAssist = async () => {
    if (!briefDescription.trim()) {
      setAssistError("Please enter a brief description first");
      return;
    }

    setIsAssisting(true);
    setAssistError(null);

    try {
      const response = await fetch("/api/agent/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset: "idea-to-spec",
          context: briefDescription,
          target_format: "idea_scaffold",
        }),
      });

      if (!response.ok) {
        throw new Error("Assist request failed");
      }

      const data = await response.json();
      
      // Populate scaffold from AI response
      if (data.fields) {
        setScaffold(prev => ({
          ...prev,
          ...data.fields,
        }));
      }
    } catch (error) {
      setAssistError(error instanceof Error ? error.message : "Failed to get AI assistance");
    } finally {
      setIsAssisting(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "8px" }}>
          Idea Generator
        </h1>
        <p style={{ color: "var(--sf-muted-mid)" }}>
          Fill in the idea scaffold to generate both an idea pack and a build-ready spec.
        </p>
      </div>

      {/* AI Assist Section */}
      <section style={{ marginBottom: "24px", padding: "16px", border: "1px solid var(--sf-border)", borderRadius: "8px", backgroundColor: "var(--sf-surface-cool)" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "12px" }}>
          AI Assist - Quick Start
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--sf-muted-mid)", marginBottom: "12px" }}>
          Describe your idea in a few sentences and AI will help fill in the scaffold fields.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <textarea
            value={briefDescription}
            onChange={(e) => setBriefDescription(e.target.value)}
            placeholder="e.g., A CLI tool that helps developers quickly scaffold new projects with best practices built-in..."
            rows={3}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--sf-border)",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
          <button
            type="button"
            onClick={handleAssist}
            disabled={isAssisting || !briefDescription.trim()}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: isAssisting ? "var(--sf-muted-subtle)" : "var(--sf-primary)",
              color: "var(--sf-surface-warm)",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: isAssisting ? "not-allowed" : "pointer",
              opacity: isAssisting ? 0.7 : 1,
            }}
          >
            {isAssisting ? "Generating..." : "Auto-Fill with AI"}
          </button>
          {assistError && (
            <div style={{ color: "var(--sf-error)", fontSize: "0.875rem" }}>
              {assistError}
            </div>
          )}
        </div>
      </section>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Core Idea */}
        <section>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "12px" }}>
            Core Idea
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                Title *
              </label>
              <input
                type="text"
                value={scaffold.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="My Awesome Product"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--sf-border)",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                Thesis *
              </label>
              <textarea
                value={scaffold.thesis}
                onChange={(e) => handleChange("thesis", e.target.value)}
                placeholder="What is this and why does it matter?"
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--sf-border)",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                Elevator Pitch
              </label>
              <textarea
                value={scaffold.elevatorPitch}
                onChange={(e) => handleChange("elevatorPitch", e.target.value)}
                placeholder="30-second pitch"
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--sf-border)",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>
        </section>

        {/* Problem & Opportunity */}
        <section>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "12px" }}>
            Problem & Opportunity
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                Problem
              </label>
              <textarea
                value={scaffold.problem}
                onChange={(e) => handleChange("problem", e.target.value)}
                placeholder="What's broken or missing?"
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--sf-border)",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                Current Alternatives
              </label>
              <textarea
                value={scaffold.currentAlternatives}
                onChange={(e) => handleChange("currentAlternatives", e.target.value)}
                placeholder="What are people using now?"
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--sf-border)",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                Why Now
              </label>
              <textarea
                value={scaffold.whyNow}
                onChange={(e) => handleChange("whyNow", e.target.value)}
                placeholder="Why is this the right moment?"
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--sf-border)",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>
        </section>

        {/* User & Market */}
        <section>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "12px" }}>
            User & Market
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                Target User
              </label>
              <input
                type="text"
                value={scaffold.targetUser}
                onChange={(e) => handleChange("targetUser", e.target.value)}
                placeholder="Who is this for?"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--sf-border)",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                Solution Approach
              </label>
              <textarea
                value={scaffold.solutionApproach}
                onChange={(e) => handleChange("solutionApproach", e.target.value)}
                placeholder="How will you solve it?"
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--sf-border)",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                Runtime Topology
              </label>
              <select
                value={scaffold.runtimeTopology}
                onChange={(e) => handleChange("runtimeTopology", e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--sf-border)",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
              >
                <option value="local-only">Local-only (runs on user's machine)</option>
                <option value="hosted-only">Hosted-only (SaaS service)</option>
                <option value="hybrid">Hybrid (local + hosted)</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                Release Stage
              </label>
              <select
                value={scaffold.releaseStage}
                onChange={(e) => handleChange("releaseStage", e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--sf-border)",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
              >
                <option value="alpha">Alpha (internal testing)</option>
                <option value="beta">Beta (limited external)</option>
                <option value="production">Production (public)</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                Future Work (Longer-term Vision)
              </label>
              <textarea
                value={scaffold.futureWork}
                onChange={(e) => handleChange("futureWork", e.target.value)}
                placeholder="What's the longer-term vision beyond MVP?"
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--sf-border)",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "24px", borderTop: "1px solid var(--sf-border)" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid var(--sf-border)",
              background: "var(--sf-surface-warm)",
              color: "var(--sf-ink)",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid var(--sf-border)",
              background: "var(--sf-ink)",
              color: "var(--sf-surface-warm)",
              fontSize: "0.9rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Generate Idea & Spec
          </button>
        </div>
      </form>
    </div>
  );
}