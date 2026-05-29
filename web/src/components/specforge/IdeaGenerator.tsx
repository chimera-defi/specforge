"use client";

import { useState } from "react";

import type { IdeaScaffold, IdeaValidationError } from "@/lib/specforge/ideas-generator";
import { validateIdeaScaffold } from "@/lib/specforge/ideas-generator";
import { agentApi } from "@/lib/api-client";
import { sanitizeInput } from "@/lib/utils/sanitize";

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
    competitiveAnalysis: "",
    businessModel: "",
  });

  const [briefDescription, setBriefDescription] = useState("");
  const [isAssisting, setIsAssisting] = useState(false);
  const [assistError, setAssistError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<IdeaValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateIdeaScaffold(scaffold as IdeaScaffold);
    setValidationErrors(errors);
    if (errors.length === 0) {
      setIsSubmitting(true);
      onGenerate(scaffold);
    }
  };

  const handleChange = (field: keyof IdeaScaffold, value: string) => {
    setScaffold(prev => ({ ...prev, [field]: sanitizeInput(value) }));
    // Clear validation error for this field when user types
    setValidationErrors(prev => prev.filter(error => error.field !== field));
  };

  function getFieldError(fieldName: string): string | undefined {
    return validationErrors.find(error => error.field === fieldName)?.message;
  }

  function getFieldErrorId(fieldName: string): string {
    return `${fieldName}-error`;
  }

  function hasFieldError(fieldName: string): boolean {
    return getFieldError(fieldName) !== undefined;
  }

  function getValidationAnnouncement(): string {
    if (validationErrors.length === 0) {
      return "";
    }
    return `Form has ${validationErrors.length} validation error${validationErrors.length === 1 ? "" : "s"}. Please correct the highlighted fields.`;
  }

  const handleAssist = async () => {
    if (!briefDescription.trim()) {
      setAssistError("Please enter a brief description first");
      return;
    }

    setIsAssisting(true);
    setAssistError(null);

    try {
      const data = await agentApi.assist({
        brief: briefDescription,
        systemPrompt: "You are helping a user fill in an idea scaffold for a product. Extract the following fields from their brief: title, thesis, elevatorPitch, problem, currentAlternatives, whyNow, targetUser, userSegment, marketSize, solutionApproach, keyDifferentiator, mvpScope, phase1Features, futureFeatures, nonGoals, primarySurfaces, keyScreens, acceptanceTests, successMetrics, technicalRisks, constraints, competitiveAnalysis, businessModel. Return as JSON with these exact field names.",
        contextPrompt: briefDescription,
      }) as { fields?: Partial<IdeaScaffold> };
      
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
        {getValidationAnnouncement() && (
          <div
            role="status"
            aria-live="polite"
            style={{ color: "var(--sf-error)", marginBottom: "16px", padding: "8px", backgroundColor: "var(--sf-error-bg)", borderRadius: "6px" }}
          >
            {getValidationAnnouncement()}
          </div>
        )}

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
                aria-invalid={hasFieldError("title")}
                aria-describedby={hasFieldError("title") ? getFieldErrorId("title") : undefined}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--sf-border)",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
                required
              />
              {getFieldError("title") && (
                <span
                  id={getFieldErrorId("title")}
                  role="alert"
                  style={{ color: "var(--sf-error)", fontSize: "0.875rem", marginTop: "4px", display: "block" }}
                >
                  {getFieldError("title")}
                </span>
              )}
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
                aria-invalid={hasFieldError("thesis")}
                aria-describedby={hasFieldError("thesis") ? getFieldErrorId("thesis") : undefined}
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
              {getFieldError("thesis") && (
                <span
                  id={getFieldErrorId("thesis")}
                  role="alert"
                  style={{ color: "var(--sf-error)", fontSize: "0.875rem", marginTop: "4px", display: "block" }}
                >
                  {getFieldError("thesis")}
                </span>
              )}
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
                Problem *
              </label>
              <textarea
                value={scaffold.problem}
                onChange={(e) => handleChange("problem", e.target.value)}
                placeholder="What's broken or missing?"
                rows={3}
                aria-invalid={hasFieldError("problem")}
                aria-describedby={hasFieldError("problem") ? getFieldErrorId("problem") : undefined}
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
              {getFieldError("problem") && (
                <span
                  id={getFieldErrorId("problem")}
                  role="alert"
                  style={{ color: "var(--sf-error)", fontSize: "0.875rem", marginTop: "4px", display: "block" }}
                >
                  {getFieldError("problem")}
                </span>
              )}
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
                Target User *
              </label>
              <input
                type="text"
                value={scaffold.targetUser}
                onChange={(e) => handleChange("targetUser", e.target.value)}
                placeholder="Who is this for?"
                aria-invalid={hasFieldError("targetUser")}
                aria-describedby={hasFieldError("targetUser") ? getFieldErrorId("targetUser") : undefined}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--sf-border)",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
                required
              />
              {getFieldError("targetUser") && (
                <span
                  id={getFieldErrorId("targetUser")}
                  role="alert"
                  style={{ color: "var(--sf-error)", fontSize: "0.875rem", marginTop: "4px", display: "block" }}
                >
                  {getFieldError("targetUser")}
                </span>
              )}
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                Solution Approach *
              </label>
              <textarea
                value={scaffold.solutionApproach}
                onChange={(e) => handleChange("solutionApproach", e.target.value)}
                placeholder="How will you solve it?"
                rows={3}
                aria-invalid={hasFieldError("solutionApproach")}
                aria-describedby={hasFieldError("solutionApproach") ? getFieldErrorId("solutionApproach") : undefined}
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
              {getFieldError("solutionApproach") && (
                <span
                  id={getFieldErrorId("solutionApproach")}
                  role="alert"
                  style={{ color: "var(--sf-error)", fontSize: "0.875rem", marginTop: "4px", display: "block" }}
                >
                  {getFieldError("solutionApproach")}
                </span>
              )}
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                Runtime Topology
              </label>
              <select
                value={scaffold.runtimeTopology}
                onChange={(e) => handleChange("runtimeTopology", e.target.value as "local-only" | "hosted-only" | "hybrid")}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--sf-border)",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
              >
                <option value="local-only">Local-only (runs on user&apos;s machine)</option>
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
                onChange={(e) => handleChange("releaseStage", e.target.value as "alpha" | "beta" | "production")}
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

        {/* Business & Competition */}
        <section>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "12px" }}>
            Business & Competition
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontWeight: 500, marginBottom: "4px" }}>
                Competitive Analysis
              </label>
              <textarea
                value={scaffold.competitiveAnalysis}
                onChange={(e) => handleChange("competitiveAnalysis", e.target.value)}
                placeholder="Who are the main competitors? What are their strengths and weaknesses? What's your unique advantage?"
                rows={4}
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
                Business Model
              </label>
              <textarea
                value={scaffold.businessModel}
                onChange={(e) => handleChange("businessModel", e.target.value)}
                placeholder="How will this make money? What are the revenue streams? What's the go-to-market strategy?"
                rows={4}
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
            disabled={isSubmitting}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid var(--sf-border)",
              background: "var(--sf-ink)",
              color: "var(--sf-surface-warm)",
              fontSize: "0.9rem",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontWeight: 500,
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Generating..." : "Generate Idea & Spec"}
          </button>
        </div>
      </form>
    </div>
  );
}