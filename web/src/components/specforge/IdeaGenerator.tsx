"use client";

import { useState } from "react";

import { normalizeIdeaScaffold, type IdeaScaffold } from "@/lib/specforge/ideas-generator";

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
    mvpScope: "",
    phase1Features: "",
    futureFeatures: "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(scaffold);
  };

  const handleChange = (field: keyof IdeaScaffold, value: string) => {
    setScaffold(prev => ({ ...prev, [field]: value }));
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