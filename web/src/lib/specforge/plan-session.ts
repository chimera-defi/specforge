import { randomUUID } from "node:crypto";

import {
  IDEA_VALIDATION_STAGE_NAMES,
  type IdeaValidationStageName,
  type PlanSession,
  type PlanStage,
  type PlanStageName,
  type PlanStageAdvanceInput,
  type PlanStageSkipInput,
} from "./contracts";
import { getDatabase } from "./db";
import { createPatchProposal, getDocument } from "./store";
import { deriveDocumentShape } from "./markdown";

// ---------------------------------------------------------------------------
// Stage definitions — structured questions + output mapping per stage
// ---------------------------------------------------------------------------

type StageDefinition = {
  name: IdeaValidationStageName;
  label: string;
  description: string;
  question: string; // The main forcing question
  subQuestions: Array<{ key: string; prompt: string }>; // Follow-up questions for depth
  /** Returns the patch content (markdown) to propose when the stage completes */
  buildPatchContent: (answers: Record<string, string>) => string;
  /** Block/section hints for where the patch should land */
  targetHint: string;
  /** System prompt for AI assistance if needed */
  systemPrompt?: string;
};

const STAGE_DEFINITIONS: Record<IdeaValidationStageName, StageDefinition> = {
  "demand-reality": {
    name: "demand-reality",
    label: "Demand Reality",
    description: "Strongest evidence that someone actually wants this - not interest, but demand",
    question: "What's the strongest evidence you have that someone actually wants this — not 'is interested,' not 'signed up for a waitlist,' but would be genuinely upset if it disappeared tomorrow?",
    subQuestions: [
      { key: "specific_behavior", prompt: "What specific behavior shows demand? (paying, expanding usage, building workflow around it, panic when it breaks)" },
      { key: "evidence", prompt: "Name a specific person who would be affected if this vanished. What would they have to do?" },
    ],
    buildPatchContent: (answers) => [
      "## Demand Reality",
      "",
      answers.question ?? "",
      "",
      "### Evidence",
      "",
      answers.specific_behavior ?? "",
      "",
      "### Specific Impact",
      "",
      answers.evidence ?? "",
    ].join("\n"),
    targetHint: "problem",
    systemPrompt: "You are a YC partner conducting a rigorous product diagnostic. Push for specific, evidence-based answers. Demand is behavior, money, or panic — not interest or waitlists.",
  },
  "status-quo": {
    name: "status-quo",
    label: "Status Quo",
    description: "What users are doing right now to solve this problem — even badly",
    question: "What are your users doing right now to solve this problem — even badly? What does that workaround cost them?",
    subQuestions: [
      { key: "workflow", prompt: "Describe the specific workflow in detail. What tools are they duct-taping together?" },
      { key: "cost", prompt: "How much time or money are they wasting on this workaround? Be specific." },
    ],
    buildPatchContent: (answers) => [
      "## Status Quo",
      "",
      answers.question ?? "",
      "",
      "### Current Workaround",
      "",
      answers.workflow ?? "",
      "",
      "### Cost of Status Quo",
      "",
      answers.cost ?? "",
    ].join("\n"),
    targetHint: "problem",
    systemPrompt: "You are a YC partner conducting a rigorous product diagnostic. The status quo is your real competitor — not other startups. Understand what users are already living with.",
  },
  "desperate-specificity": {
    name: "desperate-specificity",
    label: "Desperate Specificity",
    description: "Specific pain point, not vague problems. One specific person with a specific need.",
    question: "What's the specific pain point? Can you name one specific person at one specific company who has this problem right now?",
    subQuestions: [
      { key: "pain_severity", prompt: "How often does this pain occur? Daily, weekly, monthly?" },
      { key: "urgency", prompt: "What happens if they don't solve this? What's the consequence?" },
    ],
    buildPatchContent: (answers) => [
      "## Desperate Specificity",
      "",
      answers.question ?? "",
      "",
      "### Specific Person",
      "",
      answers.pain_severity ?? "",
      "",
      "### Frequency & Urgency",
      "",
      answers.urgency ?? "",
    ].join("\n"),
    targetHint: "problem",
    systemPrompt: "You are a YC partner conducting a rigorous product diagnostic. Specificity is the only currency. Vague answers get pushed. Name a real person with a real problem.",
  },
  "narrowest-wedge": {
    name: "narrowest-wedge",
    label: "Narrowest Wedge",
    description: "Smallest version someone would pay real money for this week",
    question: "What's the one thing a user would pay for this week? Not the full platform vision — the smallest version that delivers value.",
    subQuestions: [
      { key: "wedge_value", prompt: "What specific problem does this wedge solve that the user would pay to solve immediately?" },
      { key: "expansion_path", prompt: "How does this expand from the wedge into the full vision? What comes next?" },
    ],
    buildPatchContent: (answers) => [
      "## Narrowest Wedge",
      "",
      answers.question ?? "",
      "",
      "### Wedge Value",
      "",
      answers.wedge_value ?? "",
      "",
      "### Expansion Path",
      "",
      answers.expansion_path ?? "",
    ].join("\n"),
    targetHint: "vision",
    systemPrompt: "You are a YC partner conducting a rigorous product diagnostic. Narrow beats wide early. Wedge first, expand from strength. If no one pays for the small version, the value proposition isn't clear.",
  },
  "observation": {
    name: "observation",
    label: "Observation",
    description: "Watch real users struggle — guided walkthroughs teach you nothing",
    question: "Have you watched a real user struggle with this problem? If not, that's assignment #1.",
    subQuestions: [
      { key: "observation_method", prompt: "Describe what you observed. Where did they get stuck? What workarounds did they use?" },
      { key: "insights", prompt: "What did you learn that contradicted your assumptions?" },
    ],
    buildPatchContent: (answers) => [
      "## Observation",
      "",
      answers.question ?? "",
      "",
      "### What We Observed",
      "",
      answers.observation_method ?? "",
      "",
      "### Counter-Intuitive Insights",
      "",
      answers.insights ?? "",
    ].join("\n"),
    targetHint: "problem",
    systemPrompt: "You are a YC partner conducting a rigorous product diagnostic. Watch, don't demo. Sitting behind someone while they struggle teaches you everything. Guided walkthroughs teach you nothing.",
  },
  "future-fit": {
    name: "future-fit",
    label: "Future-Fit",
    description: "Does this survive reorg or when your champion leaves?",
    question: "Does this survive a reorg — or does it die when your champion leaves? Is this a feature or a product?",
    subQuestions: [
      { key: "survival_mechanism", prompt: "What makes this product essential, not just nice-to-have?" },
      { key: "champion_risk", prompt: "Who is your champion? What happens if they leave?" },
    ],
    buildPatchContent: (answers) => [
      "## Future-Fit",
      "",
      answers.question ?? "",
      "",
      "### Survival Mechanism",
      "",
      answers.survival_mechanism ?? "",
      "",
      "### Champion Risk",
      "",
      answers.champion_risk ?? "",
    ].join("\n"),
    targetHint: "vision",
    systemPrompt: "You are a YC partner conducting a rigorous product diagnostic. Features die when champions leave. Products survive when they're essential, not when they're nice-to-have.",
  },
};

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

type PlanSessionRow = {
  session_id: string;
  document_id: string;
  workspace_id: string;
  mode: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type PlanStageRow = {
  stage_id: string;
  session_id: string;
  document_id: string;
  name: string;
  status: string;
  patch_id: string | null;
  question_prompt: string | null;
  system_prompt: string | null;
  outputs_json: Record<string, unknown> | null;
  answers_json: Record<string, string> | null;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function createPlanSession(
  documentId: string,
  workspaceId: string,
  mode: "startup" | "builder" = "startup",
): Promise<PlanSession> {
  const db = await getDatabase({ workspaceId });
  const now = new Date().toISOString();
  const sessionId = `ivsession_${randomUUID()}`;

  await db.query(
    `INSERT INTO idea_validation_sessions (session_id, document_id, workspace_id, mode, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [sessionId, documentId, workspaceId, mode, "active", now, now],
  );

  // Pre-create all stage rows as 'pending' with their questions and system prompts
  for (const name of IDEA_VALIDATION_STAGE_NAMES) {
    const stageDef = STAGE_DEFINITIONS[name];
    const stageId = `ivstage_${randomUUID()}`;
    await db.query(
      `INSERT INTO idea_validation_stages (stage_id, session_id, document_id, name, status, patch_id, question_prompt, system_prompt, outputs_json, answers_json, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, NULL, NULL, $8, $9)`,
      [stageId, sessionId, documentId, name, "pending", stageDef.question, stageDef.systemPrompt || null, now, now],
    );
  }

  return getPlanSession(sessionId, workspaceId);
}

export async function getPlanSession(
  sessionId: string,
  workspaceId: string,
): Promise<PlanSession> {
  const db = await getDatabase({ workspaceId });

  const { rows: sessionRows } = await db.query<PlanSessionRow>(
    `SELECT * FROM idea_validation_sessions WHERE session_id = $1`,
    [sessionId],
  );
  const session = sessionRows[0];
  if (!session) throw new Error(`Idea validation session not found: ${sessionId}`);

  const { rows: stageRows } = await db.query<PlanStageRow>(
    `SELECT * FROM idea_validation_stages WHERE session_id = $1 ORDER BY created_at ASC`,
    [sessionId],
  );

  return assembleSession(session, stageRows);
}

export async function listPlanSessions(
  documentId: string,
  workspaceId: string,
): Promise<PlanSession[]> {
  const db = await getDatabase({ workspaceId });

  const { rows: sessionRows } = await db.query<PlanSessionRow>(
    `SELECT * FROM idea_validation_sessions WHERE document_id = $1 ORDER BY created_at DESC`,
    [documentId],
  );

  const sessions: PlanSession[] = [];
  for (const row of sessionRows) {
    const { rows: stageRows } = await db.query<PlanStageRow>(
      `SELECT * FROM idea_validation_stages WHERE session_id = $1 ORDER BY created_at ASC`,
      [row.session_id],
    );
    sessions.push(assembleSession(row, stageRows));
  }

  return sessions;
}

export async function advancePlanSession(
  sessionId: string,
  input: PlanStageAdvanceInput,
  workspaceId: string,
): Promise<{ session: PlanSession; patchId: string | null }> {
  const db = await getDatabase({ workspaceId });
  const session = await getPlanSession(sessionId, workspaceId);
  const now = new Date().toISOString();

  const stageRow = await db.query<PlanStageRow>(
    `SELECT * FROM idea_validation_stages WHERE session_id = $1 AND name = $2`,
    [sessionId, input.stage_name],
  );
  const stage = stageRow.rows[0];
  if (!stage) throw new Error(`Stage not found: ${input.stage_name}`);
  if (stage.status === "completed") throw new Error(`Stage already completed: ${input.stage_name}`);

  const def = STAGE_DEFINITIONS[input.stage_name];
  const patchContent = def.buildPatchContent(input.answers);

  // Find a suitable block_id and fingerprint in the document to target
  const document = await getDocument(session.document_id, { workspaceId });
  if (!document) throw new Error(`Document not found: ${session.document_id}`);
  const { blocks } = deriveDocumentShape(document.markdown);

  // Find a block whose heading loosely matches the target hint, or fall back to the first block
  const targetBlock =
    blocks.find((b) => b.heading.toLowerCase().includes(def.targetHint)) ?? blocks[0];

  let patchId: string | null = null;

  if (targetBlock) {
    const patch = await createPatchProposal(
      {
        document_id: session.document_id,
        block_id: targetBlock.block_id,
        section_id: targetBlock.section_id,
        operation: "replace",
        content: patchContent,
        patch_type: "structural_edit",
        rationale: `Idea validation stage: ${def.label}`,
        proposed_by: {
          actor_type: input.actor_type,
          actor_id: input.actor_id,
        },
        base_version: document.version,
        target_fingerprint: targetBlock.target_fingerprint,
        confidence: 0.85,
      },
      { workspaceId },
    );
    patchId = patch.patch_id;
  }

  const outputs = def.subQuestions.reduce<Record<string, string>>((acc, q) => {
    acc[q.key] = input.answers[q.key] ?? "";
    return acc;
  }, {});

  await db.query(
    `UPDATE idea_validation_stages
     SET status = 'completed', patch_id = $1, outputs_json = $2::jsonb, answers_json = $3::jsonb, updated_at = $4
     WHERE session_id = $5 AND name = $6`,
    [
      patchId,
      JSON.stringify(outputs),
      JSON.stringify(input.answers),
      now,
      sessionId,
      input.stage_name,
    ],
  );

  await db.query(
    `UPDATE idea_validation_sessions SET updated_at = $1 WHERE session_id = $2`,
    [now, sessionId],
  );

  const updated = await getPlanSession(sessionId, workspaceId);
  return { session: updated, patchId };
}

export async function skipPlanStage(
  sessionId: string,
  input: PlanStageSkipInput,
  workspaceId: string,
): Promise<PlanSession> {
  const db = await getDatabase({ workspaceId });
  const now = new Date().toISOString();

  await db.query(
    `UPDATE idea_validation_stages SET status = 'skipped', updated_at = $1
     WHERE session_id = $2 AND name = $3`,
    [now, sessionId, input.stage_name],
  );

  await db.query(
    `UPDATE idea_validation_sessions SET updated_at = $1 WHERE session_id = $2`,
    [now, sessionId],
  );

  return getPlanSession(sessionId, workspaceId);
}

export function getStageDefinition(name: PlanStageName): StageDefinition {
  return STAGE_DEFINITIONS[name];
}

export function getAllStageDefinitions(): StageDefinition[] {
  return IDEA_VALIDATION_STAGE_NAMES.map((n) => STAGE_DEFINITIONS[n]);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function assembleSession(
  session: PlanSessionRow,
  stageRows: PlanStageRow[],
): PlanSession {
  const stages: PlanStage[] = IDEA_VALIDATION_STAGE_NAMES.map((name) => {
    const row = stageRows.find((r) => r.name === name);
    if (row) {
      return {
        stage_id: row.stage_id,
        session_id: row.session_id,
        document_id: row.document_id,
        name: name as PlanStageName,
        status: row.status as PlanStage["status"],
        patch_id: row.patch_id,
        question_prompt: row.question_prompt,
        system_prompt: row.system_prompt,
        outputs: row.outputs_json ?? null,
        answers: row.answers_json ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    }
    // Should not happen (stages are pre-created), but provide a safe fallback
    const now = new Date().toISOString();
    return {
      stage_id: "",
      session_id: session.session_id,
      document_id: session.document_id,
      name: name as PlanStageName,
      status: "pending" as const,
      patch_id: null,
      question_prompt: null,
      system_prompt: null,
      outputs: null,
      answers: null,
      created_at: now,
      updated_at: now,
    };
  });

  return {
    session_id: session.session_id,
    document_id: session.document_id,
    workspace_id: session.workspace_id,
    mode: session.mode as "startup" | "builder",
    status: session.status as PlanSession["status"],
    stages,
    created_at: session.created_at,
    updated_at: session.updated_at,
  };
}
