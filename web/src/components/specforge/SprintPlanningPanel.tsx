"use client";

/**
 * IdeaValidationPanel
 *
 * Act 1 of the SpecForge two-act model. Walks the user (or team) through
 * 6 rigorous idea validation stages inspired by G-Stack's office-hours skill:
 *   Demand Reality → Status Quo → Desperate Specificity → Narrowest Wedge → Observation → Future-Fit
 *
 * Each stage produces a governed PatchProposal targeting the relevant
 * document section. Stages can be skipped — skips are recorded in the
 * session for handoff.json provenance.
 *
 * This implements YC's six forcing questions for rigorous product diagnostics.
 */

import { useCallback, useEffect, useState } from "react";

import { ideaValidationApi, ApiError } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Static stage definitions (mirrors STAGE_DEFINITIONS in plan-session.ts)
// ---------------------------------------------------------------------------

type QuestionDef = { key: string; prompt: string };

type StageDef = {
  name: string;
  label: string;
  description: string;
  question: string; // Main forcing question
  subQuestions: QuestionDef[]; // Follow-up questions for depth
};

const STAGE_DEFS: StageDef[] = [
  {
    name: "demand-reality",
    label: "Demand Reality",
    description: "Strongest evidence that someone actually wants this — not interest, but demand.",
    question: "What's the strongest evidence you have that someone actually wants this — not 'is interested,' not 'signed up for a waitlist,' but would be genuinely upset if it disappeared tomorrow?",
    subQuestions: [
      {
        key: "specific_behavior",
        prompt: "What specific behavior shows demand? (paying, expanding usage, building workflow around it, panic when it breaks)",
      },
      {
        key: "evidence",
        prompt: "Name a specific person who would be affected if this vanished. What would they have to do?",
      },
    ],
  },
  {
    name: "status-quo",
    label: "Status Quo",
    description: "What users are doing right now to solve this problem — even badly.",
    question: "What are your users doing right now to solve this problem — even badly? What does that workaround cost them?",
    subQuestions: [
      {
        key: "workflow",
        prompt: "Describe the specific workflow in detail. What tools are they duct-taping together?",
      },
      {
        key: "cost",
        prompt: "How much time or money are they wasting on this workaround? Be specific.",
      },
    ],
  },
  {
    name: "desperate-specificity",
    label: "Desperate Specificity",
    description: "Specific pain point, not vague problems. One specific person with a specific need.",
    question: "What's the specific pain point? Can you name one specific person at one specific company who has this problem right now?",
    subQuestions: [
      {
        key: "pain_severity",
        prompt: "How often does this pain occur? Daily, weekly, monthly?",
      },
      {
        key: "urgency",
        prompt: "What happens if they don't solve this? What's the consequence?",
      },
    ],
  },
  {
    name: "narrowest-wedge",
    label: "Narrowest Wedge",
    description: "Smallest version someone would pay real money for this week.",
    question: "What's the one thing a user would pay for this week? Not the full platform vision — the smallest version that delivers value.",
    subQuestions: [
      {
        key: "wedge_value",
        prompt: "What specific problem does this wedge solve that the user would pay to solve immediately?",
      },
      {
        key: "expansion_path",
        prompt: "How does this expand from the wedge into the full vision? What comes next?",
      },
    ],
  },
  {
    name: "observation",
    label: "Observation",
    description: "Watch real users struggle — guided walkthroughs teach you nothing.",
    question: "Have you watched a real user struggle with this problem? If not, that's assignment #1.",
    subQuestions: [
      {
        key: "observation_method",
        prompt: "Describe what you observed. Where did they get stuck? What workarounds did they use?",
      },
      {
        key: "insights",
        prompt: "What did you learn that contradicted your assumptions?",
      },
    ],
  },
  {
    name: "future-fit",
    label: "Future-Fit",
    description: "Does this survive reorg or when your champion leaves?",
    question: "Does this survive a reorg — or does it die when your champion leaves? Is this a feature or a product?",
    subQuestions: [
      {
        key: "survival_mechanism",
        prompt: "What makes this product essential, not just nice-to-have?",
      },
      {
        key: "champion_risk",
        prompt: "Who is your champion? What happens if they leave?",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Types (mirrors contracts.ts — kept lean to avoid server imports on client)
// ---------------------------------------------------------------------------

type StageStatus = "pending" | "completed" | "skipped";

type PlanStage = {
  stage_id: string;
  name: string;
  status: StageStatus;
  patch_id: string | null;
  question_prompt: string | null;
  system_prompt: string | null;
  answers: Record<string, string> | null;
};

type PlanSession = {
  session_id: string;
  document_id: string;
  workspace_id: string;
  mode: string;
  status: string;
  stages: PlanStage[];
};

type Props = {
  documentId: string;
  actorId: string;
  specWizardHref: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IdeaValidationPanel({ documentId, actorId, specWizardHref }: Props) {
  const [session, setSession] = useState<PlanSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  // Answers keyed by stage name → question key → answer text
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  // Which sub-question we're on within the current stage (0-indexed)
  const [questionIdx, setQuestionIdx] = useState(0);
  // Patch IDs created during this session (to show a breadcrumb)
  const [createdPatches, setCreatedPatches] = useState<string[]>([]);

  // Load most recent session for this document on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await ideaValidationApi.getSessions(documentId) as { sessions?: PlanSession[] };
        const sessions: PlanSession[] = data.sessions ?? [];
        if (sessions.length > 0) {
          setSession(sessions[0]);
          // Load persisted answers from completed stages
          const loadedAnswers: Record<string, Record<string, string>> = {};
          sessions[0].stages.forEach((stage) => {
            if (stage.status === "completed" && stage.answers) {
              loadedAnswers[stage.name] = stage.answers;
            }
          });
          setAnswers(loadedAnswers);
        }
      } catch {
        // Silently ignore — user can create a new session
      }
    }
    void load();
  }, [documentId]);

  // Derive active stage (first pending stage) from current session
  const activeStage = session?.stages.find((s) => s.status === "pending") ?? null;
  const activeStageDef = activeStage
    ? STAGE_DEFS.find((d) => d.name === activeStage.name)
    : null;
  const currentQuestion = activeStageDef?.subQuestions[questionIdx] ?? null;
  const isLastQuestion =
    activeStageDef ? questionIdx === activeStageDef.subQuestions.length - 1 : false;
  const allDone =
    session !== null &&
    session.stages.every((s) => s.status === "completed" || s.status === "skipped");

  const createSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthRequired(false);
    try {
      const data = await ideaValidationApi.create(documentId, { actor_id: actorId, actor_type: "human", mode: "startup" }) as { session: PlanSession };
      setSession(data.session);
      setQuestionIdx(0);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setAuthRequired(true);
        return;
      }
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [documentId, actorId]);

  const handleAnswer = useCallback(
    (stageName: string, questionKey: string, value: string) => {
      setAnswers((prev) => ({
        ...prev,
        [stageName]: { ...(prev[stageName] ?? {}), [questionKey]: value },
      }));
    },
    [],
  );

  const advanceQuestion = useCallback(() => {
    setQuestionIdx((i) => i + 1);
  }, []);

  const completeStage = useCallback(async () => {
    if (!session || !activeStage || !activeStageDef) return;
    setLoading(true);
    setError(null);
    try {
      const stageAnswers = answers[activeStage.name] ?? {};
      const data = await ideaValidationApi.advance(documentId, session.session_id, {
        stage_name: activeStage.name,
        answers: stageAnswers,
        actor_id: actorId,
        actor_type: "human",
      }) as { session: PlanSession; patchId?: string };
      setSession(data.session);
      if (data.patchId) {
        setCreatedPatches((prev) => [...prev, data.patchId!]);
      }
      setQuestionIdx(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [session, activeStage, activeStageDef, answers, documentId, actorId]);

  const skipStage = useCallback(async () => {
    if (!session || !activeStage) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ideaValidationApi.skip(documentId, session.session_id, {
        stage_name: activeStage.name,
        actor_id: actorId,
      }) as { session: PlanSession };
      setSession(data.session);
      setQuestionIdx(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [session, activeStage, documentId, actorId]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function stageStatusIcon(status: StageStatus) {
    if (status === "completed") return "✓";
    if (status === "skipped") return "⊘";
    return "○";
  }

  function stageStatusColor(status: StageStatus) {
    if (status === "completed") return "#22c55e";
    if (status === "skipped") return "#94a3b8";
    return "#94a3b8";
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Stage tracker */}
      {session ? (
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {session.stages.map((stage, idx) => {
            const def = STAGE_DEFS[idx];
            const isActive = stage.name === activeStage?.name;
            return (
              <div
                key={stage.stage_id || stage.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.3rem 0.65rem",
                  borderRadius: "999px",
                  fontSize: "0.8rem",
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? "rgba(28,26,23,0.08)" : "transparent",
                  border: `1px solid ${isActive ? "rgba(28,26,23,0.2)" : "rgba(28,26,23,0.08)"}`,
                  color: isActive ? "#1c1a17" : "#6b7280",
                }}
              >
                <span style={{ color: stageStatusColor(stage.status) }}>
                  {stageStatusIcon(stage.status)}
                </span>
                {def?.label ?? stage.name}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* No session yet */}
      {!session && !loading ? (
        <div
          style={{
            padding: "1.5rem",
            background: "rgba(239,228,213,0.4)",
            borderRadius: "12px",
            border: "1px solid rgba(28,26,23,0.08)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 0.75rem",
              fontSize: "0.9rem",
              opacity: 0.75,
            }}
          >
            Run through 5 optional planning stages before writing the spec — or skip straight
            to the spec wizard below.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              type="button"
              onClick={createSession}
              style={{
                padding: "0.55rem 1.2rem",
                borderRadius: "999px",
                background: "#1c1a17",
                color: "#fffbf6",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Start Sprint Planning
            </button>
            <a
              href={specWizardHref}
              style={{
                padding: "0.55rem 1.2rem",
                borderRadius: "999px",
                background: "transparent",
                color: "#1c1a17",
                border: "1px solid rgba(28,26,23,0.2)",
                cursor: "pointer",
                fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              Skip to Spec Wizard
            </a>
          </div>
        </div>
      ) : null}

      {/* Loading */}
      {loading ? (
        <p style={{ opacity: 0.6, fontSize: "0.875rem" }}>Working...</p>
      ) : null}

      {/* Auth required prompt */}
      {authRequired ? (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "rgba(239,228,213,0.5)",
            border: "1px solid rgba(28,26,23,0.12)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "0.875rem", opacity: 0.8 }}>
            Sign in to start sprint planning.
          </span>
          <a
            href="/api/auth/login"
            style={{
              padding: "0.35rem 0.9rem",
              borderRadius: "999px",
              background: "#1c1a17",
              color: "#fffbf6",
              fontSize: "0.82rem",
              fontWeight: 500,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Sign in with GitHub
          </a>
        </div>
      ) : null}

      {/* Error */}
      {error && !authRequired ? (
        <p
          style={{
            color: "#dc2626",
            fontSize: "0.875rem",
            padding: "0.5rem 0.75rem",
            background: "rgba(220,38,38,0.06)",
            borderRadius: "8px",
          }}
        >
          {error}
        </p>
      ) : null}

      {/* All done */}
      {allDone && session ? (
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: "12px",
          }}
        >
          <p
            style={{
              margin: "0 0 0.75rem",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            Planning complete!
          </p>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", opacity: 0.75 }}>
            {session.stages.filter((s) => s.status === "completed").length} stages completed,{" "}
            {session.stages.filter((s) => s.status === "skipped").length} skipped.{" "}
            {createdPatches.length > 0 ? (
              <>
                {createdPatches.length} patch proposal
                {createdPatches.length === 1 ? "" : "s"} queued in the decision queue.
              </>
            ) : null}
          </p>
          <a
            href={specWizardHref}
            style={{
              display: "inline-block",
              padding: "0.55rem 1.2rem",
              borderRadius: "999px",
              background: "#1c1a17",
              color: "#fffbf6",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Continue to Spec Wizard
          </a>
        </div>
      ) : null}

      {/* Active stage Q&A */}
      {session && activeStage && activeStageDef && (currentQuestion || activeStageDef.subQuestions.length === 0) && !loading ? (
        <div
          style={{
            border: "1px solid rgba(28,26,23,0.12)",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          {/* Stage header */}
          <div
            style={{
              padding: "1rem 1.25rem",
              background: "rgba(239,228,213,0.5)",
              borderBottom: "1px solid rgba(28,26,23,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <strong style={{ fontSize: "0.95rem" }}>{activeStageDef.label}</strong>
                <p style={{ margin: "0.15rem 0 0", fontSize: "0.8rem", opacity: 0.7 }}>
                  {activeStageDef.description}
                </p>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  opacity: 0.55,
                  whiteSpace: "nowrap",
                  marginLeft: "1rem",
                }}
              >
                {activeStageDef.subQuestions.length > 0
                  ? `${questionIdx + 1} / ${activeStageDef.subQuestions.length}`
                  : "1 / 1"}
              </span>
            </div>
          </div>

          {/* Main forcing question */}
          <div style={{ padding: "1.25rem", borderBottom: activeStageDef.subQuestions.length > 0 ? "1px solid rgba(28,26,23,0.08)" : "none" }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: "1rem",
                marginBottom: "0.5rem",
                lineHeight: 1.4,
              }}
            >
              {activeStageDef.question}
            </div>
            <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.6, fontStyle: "italic" }}>
              This is the main forcing question for this stage.
            </p>
          </div>

          {/* Sub-questions body */}
          {activeStageDef.subQuestions.length > 0 && currentQuestion ? (
            <div style={{ padding: "1.25rem" }}>
              <label
                htmlFor={`q-${currentQuestion.key}`}
                style={{
                  display: "block",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  marginBottom: "0.65rem",
                  lineHeight: 1.4,
                }}
              >
                {currentQuestion.prompt}
              </label>
            <textarea
              id={`q-${currentQuestion.key}`}
              rows={4}
              placeholder="Your answer..."
              value={answers[activeStage.name]?.[currentQuestion.key] ?? ""}
              onChange={(e) =>
                handleAnswer(activeStage.name, currentQuestion.key, e.target.value)
              }
              style={{
                width: "100%",
                resize: "vertical",
                padding: "0.65rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid rgba(28,26,23,0.15)",
                background: "rgba(255,251,246,0.9)",
                fontSize: "0.875rem",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "0.65rem",
                marginTop: "0.85rem",
                flexWrap: "wrap",
              }}
            >
              {isLastQuestion ? (
                <button
                  type="button"
                  onClick={completeStage}
                  disabled={loading}
                  style={{
                    padding: "0.5rem 1.1rem",
                    borderRadius: "999px",
                    background: "#1c1a17",
                    color: "#fffbf6",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}
                >
                  Complete {activeStageDef.label}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={advanceQuestion}
                  style={{
                    padding: "0.5rem 1.1rem",
                    borderRadius: "999px",
                    background: "#1c1a17",
                    color: "#fffbf6",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}
                >
                  Next Question
                </button>
              )}
              <button
                type="button"
                onClick={skipStage}
                disabled={loading}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "999px",
                  background: "transparent",
                  color: "#6b7280",
                  border: "1px solid rgba(28,26,23,0.12)",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "0.85rem",
                }}
              >
                Skip this stage
              </button>
            </div>
            </div>
          ) : (
            <div style={{ padding: "1.25rem" }}>
              <button
                type="button"
                onClick={completeStage}
                disabled={loading}
                style={{
                  padding: "0.5rem 1.1rem",
                  borderRadius: "999px",
                  background: "#1c1a17",
                  color: "#fffbf6",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}
              >
                Complete {activeStageDef.label}
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Patches created breadcrumb */}
      {createdPatches.length > 0 ? (
        <p
          style={{
            fontSize: "0.78rem",
            opacity: 0.6,
            margin: 0,
          }}
        >
          Patch proposals queued:{" "}
          {createdPatches.map((id) => (
            <code key={id} style={{ marginRight: "0.35rem" }}>
              {id.slice(0, 12)}…
            </code>
          ))}
          — review them in the{" "}
          <a href="?stage=decide" style={{ color: "inherit" }}>
            decision queue
          </a>
          .
        </p>
      ) : null}
    </div>
  );
}
