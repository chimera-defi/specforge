"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  answerClarification,
  createCommentThread,
  createClarification,
  createDocument,
  createPilotAccessRequest,
  createWorkspaceMembership,
  deleteWorkspaceMembership,
  updateWorkspaceMembershipRole,
  getDocument,
  createPatchProposal,
  decidePatch,
  listPatches,
  reviewPilotAccessRequest,
  listWorkspaceMemberships,
  listWorkspaceRecords,
  resetWorkspaceDocuments,
  resolveCommentThread,
  updateWorkspacePlan,
} from "@/lib/specforge/store";
import {
  buildGuidedSpecMarkdown,
  buildGuidedSpecMetadata,
  inferClarificationQuestions,
} from "@/lib/specforge/guided";
import { ideaToGuidedSpecInput, normalizeIdeaScaffold, type IdeaScaffold } from "@/lib/specforge/ideas-generator";
import { getMemberQuotaState } from "@/lib/specforge/plans";
import {
  getCurrentWorkspaceActor,
  setCurrentWorkspaceActor,
  setPreferredAssistTool,
  type PreferredAssistTool,
} from "@/lib/specforge/session";
import { getShowcaseExample } from "@/lib/specforge/showcase";

async function getActionActorRef() {
  const currentActor = await getCurrentWorkspaceActor();

  return {
    currentActor,
    actorRef: {
      actor_type: currentActor.actor_type,
      actor_id: currentActor.actor_id,
    },
  };
}

type PilotAccessDecision = "approve" | "reject";

function normalizeReturnPath(rawReturnTo: string, fallback: string) {
  if (rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//")) {
    return rawReturnTo;
  }

  return fallback;
}

const PILOT_REQUEST_WINDOW_MS = 60 * 60 * 1000;
const PILOT_REQUEST_LIMIT = 3;
const PILOT_WEBHOOK_TIMEOUT_MS = 5000;
const pilotRequestRateLimiter = new Map<string, { count: number; windowStartMs: number }>();

function getRequestClientKey(headerList: Headers) {
  const forwardedFor = headerList.get("x-forwarded-for");
  const realIp = headerList.get("x-real-ip");
  const firstForwarded = forwardedFor?.split(",")[0]?.trim();
  return firstForwarded || realIp || "unknown_client";
}

function consumePilotRequestRateLimit(key: string, nowMs: number = Date.now()) {
  const existing = pilotRequestRateLimiter.get(key);

  if (!existing || nowMs - existing.windowStartMs >= PILOT_REQUEST_WINDOW_MS) {
    pilotRequestRateLimiter.set(key, { count: 1, windowStartMs: nowMs });
    return { allowed: true, remaining: PILOT_REQUEST_LIMIT - 1 };
  }

  if (existing.count >= PILOT_REQUEST_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  pilotRequestRateLimiter.set(key, existing);
  return { allowed: true, remaining: PILOT_REQUEST_LIMIT - existing.count };
}

function buildRedirectPath(pathWithQuery: string, params: Record<string, string | undefined | null>) {
  const [pathname, query = ""] = pathWithQuery.split("?");
  const searchParams = new URLSearchParams(query);

  for (const [key, value] of Object.entries(params)) {
    if (!value) {
      searchParams.delete(key);
      continue;
    }

    searchParams.set(key, value);
  }

  const resolvedQuery = searchParams.toString();
  return resolvedQuery ? `${pathname}?${resolvedQuery}` : pathname;
}

function normalizeText(value: FormDataEntryValue | null, maxLength: number) {
  const resolved = String(value ?? "").trim();
  return resolved.slice(0, maxLength);
}

function parseTeamSize(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.min(Math.round(parsed), 500);
}

function isValidEmail(email: string) {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}$/i.test(email);
}

function canTriagePilotAccess(role: string) {
  const normalizedRole = role.trim().toLowerCase();
  return (
    normalizedRole === "workspace owner" ||
    normalizedRole === "owner" ||
    normalizedRole === "founder" ||
    normalizedRole === "admin"
  );
}

function shouldEnforceHostedPilotSecurity() {
  return (
    process.env.SPECFORGE_ENFORCE_HOSTED_SECURITY === "true" ||
    process.env.NODE_ENV === "production"
  );
}

function getPilotTriageWorkspaceId() {
  const configuredWorkspaceId = process.env.SPECFORGE_PILOT_TRIAGE_WORKSPACE_ID?.trim();

  if (configuredWorkspaceId) {
    return configuredWorkspaceId;
  }

  if (shouldEnforceHostedPilotSecurity()) {
    throw new Error("SPECFORGE_PILOT_TRIAGE_WORKSPACE_ID is required for hosted pilot intake.");
  }

  return "ws_demo";
}

function isHostedBlockedWebhookHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized === "[::1]" ||
    normalized === "169.254.169.254"
  );
}

function getPilotWebhookUrl() {
  const webhookUrl = process.env.SPECFORGE_PILOT_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    return null;
  }

  try {
    const parsed = new URL(webhookUrl);

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      console.warn(
        JSON.stringify({
          at: new Date().toISOString(),
          event: "pilot_access.notification_invalid_webhook",
          reason: "unsupported_protocol",
        }),
      );
      return null;
    }

    if (shouldEnforceHostedPilotSecurity() && isHostedBlockedWebhookHost(parsed.hostname)) {
      console.warn(
        JSON.stringify({
          at: new Date().toISOString(),
          event: "pilot_access.notification_invalid_webhook",
          reason: "blocked_host",
        }),
      );
      return null;
    }

    return parsed.toString();
  } catch {
    console.warn(
      JSON.stringify({
        at: new Date().toISOString(),
        event: "pilot_access.notification_invalid_webhook",
        reason: "invalid_url",
      }),
    );
    return null;
  }
}

async function notifyPilotAccessRequest(input: {
  request_id: string;
  full_name: string;
  email: string;
  github_login: string;
  company?: string;
  pilot_type?: string;
  source?: string;
}) {
  const webhookUrl = getPilotWebhookUrl();
  const payload = {
    event: "pilot_access.requested",
    at: new Date().toISOString(),
    request: input,
  };

  if (!webhookUrl) {
    console.log(
      JSON.stringify({
        at: payload.at,
        event: payload.event,
        request_id: input.request_id,
        source: input.source,
        notification: "webhook_not_configured",
      }),
    );
    return;
  }

  const timeout = AbortSignal.timeout(PILOT_WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: timeout,
    });

    if (!response.ok) {
      console.warn(
        JSON.stringify({
          at: new Date().toISOString(),
          event: "pilot_access.notification_failed",
          request_id: input.request_id,
          status: response.status,
        }),
      );
    }
  } catch (error) {
    console.warn(
      JSON.stringify({
        at: new Date().toISOString(),
        event: "pilot_access.notification_error",
        request_id: input.request_id,
        reason: error instanceof Error ? error.message : "Unknown notification error",
      }),
    );
  }
}

export async function createDocumentAction(formData: FormData) {
  const { currentActor } = await getActionActorRef();
  const title = String(formData.get("title") ?? "Untitled SpecForge Doc");
  const mode = String(formData.get("mode") ?? "guided");
  const exampleId = String(formData.get("example_id") ?? "");
  const guidedInput = {
    title,
    problem: String(formData.get("problem") ?? ""),
    goals: String(formData.get("goals") ?? ""),
    users: String(formData.get("users") ?? ""),
    scope: String(formData.get("scope") ?? ""),
    requirements: String(formData.get("requirements") ?? ""),
    constraints: String(formData.get("constraints") ?? ""),
    uxPack: String(formData.get("ux_pack") ?? ""),
    successSignals: String(formData.get("success_signals") ?? ""),
    tasks: String(formData.get("tasks") ?? ""),
    nonGoals: String(formData.get("non_goals") ?? ""),
  };
  const showcaseExample = mode === "example" ? await getShowcaseExample(exampleId) : null;
  const initial_markdown =
    mode === "guided"
      ? buildGuidedSpecMarkdown(guidedInput)
      : mode === "example" && showcaseExample
        ? showcaseExample.draft.markdown
        : String(
            formData.get("initial_markdown") ??
              "# PRD\n\n## Problem\nClarify the user problem before implementation begins.\n\n## Goals\n- Capture the first shippable workflow.\n- Produce a reviewable build handoff.\n",
          );
  const metadata =
    mode === "guided"
      ? buildGuidedSpecMetadata(guidedInput)
      : mode === "example" && showcaseExample
        ? showcaseExample.draft.metadata
        : undefined;
  const resolvedTitle = mode === "example" && showcaseExample ? showcaseExample.draft.title : title;

  const created = await createDocument({
    workspace_id: currentActor.workspace_id,
    title: resolvedTitle,
    initial_markdown,
    metadata,
  });

  if (mode === "guided") {
    const { actorRef } = await getActionActorRef();
    const clarificationQuestions = inferClarificationQuestions(guidedInput);
    for (const item of clarificationQuestions) {
      await createClarification({
        document_id: created.document_id,
        section_heading: item.section_heading,
        question: item.question,
        priority: item.priority,
        created_by: actorRef,
      });
    }
  }

  revalidatePath("/workspace");
  redirect(`/workspace?document=${created.document_id}&stage=draft`);
}

export async function createPatchAction(formData: FormData) {
  const { actorRef } = await getActionActorRef();
  const [block_id = "", section_id = "", target_fingerprint = ""] = String(
    formData.get("target_descriptor") ?? "",
  ).split("||");

  await createPatchProposal({
    document_id: String(formData.get("document_id")),
    block_id,
    section_id,
    operation: "replace",
    patch_type: String(formData.get("patch_type") ?? "requirement_change") as
      | "wording_formatting"
      | "structural_edit"
      | "requirement_change"
      | "task_export_change",
    content: String(formData.get("content") ?? ""),
    rationale: "Queued from the SpecForge review workspace.",
    proposed_by: actorRef,
    base_version: Number(formData.get("base_version") ?? 1),
    target_fingerprint,
    confidence: 0.82,
  });

  revalidatePath("/workspace");
}

export async function acceptAllPatchesAction(formData: FormData) {
  const { actorRef, currentActor } = await getActionActorRef();
  const documentId = String(formData.get("document_id") ?? "");
  const patches = await listPatches(documentId, { workspaceId: currentActor.workspace_id });
  const actionable = patches.filter((p) => p.status === "proposed" || p.status === "stale");

  for (const patch of actionable) {
    await decidePatch({
      document_id: documentId,
      patch_id: patch.patch_id,
      decision: "accept",
      resolved_content: patch.content ?? "",
      decided_by: actorRef,
    });
  }

  revalidatePath("/workspace");
}

export async function decidePatchAction(formData: FormData) {
  const { actorRef } = await getActionActorRef();
  await decidePatch({
    document_id: String(formData.get("document_id")),
    patch_id: String(formData.get("patch_id")),
    decision:
      (String(formData.get("decision") ?? "reject") as "accept" | "reject" | "cherry_pick"),
    resolved_content: String(formData.get("resolved_content") ?? ""),
    decided_by: actorRef,
  });

  revalidatePath("/workspace");
}

export async function createCommentThreadAction(formData: FormData) {
  const { actorRef } = await getActionActorRef();
  await createCommentThread({
    document_id: String(formData.get("document_id")),
    block_id: String(formData.get("block_id")),
    body: String(formData.get("body") ?? ""),
    created_by: actorRef,
  });

  revalidatePath("/workspace");
}

export async function resolveCommentThreadAction(formData: FormData) {
  const { actorRef } = await getActionActorRef();
  await resolveCommentThread({
    document_id: String(formData.get("document_id")),
    thread_id: String(formData.get("thread_id")),
    resolved_by: actorRef,
  });

  revalidatePath("/workspace");
}

export async function createClarificationAction(formData: FormData) {
  const { actorRef } = await getActionActorRef();
  await createClarification({
    document_id: String(formData.get("document_id")),
    section_heading: String(formData.get("section_heading")),
    question: String(formData.get("question") ?? ""),
    created_by: actorRef,
  });

  revalidatePath("/workspace");
}

export async function answerClarificationAction(formData: FormData) {
  const { actorRef } = await getActionActorRef();
  await answerClarification({
    document_id: String(formData.get("document_id")),
    clarification_id: String(formData.get("clarification_id")),
    answer: String(formData.get("answer") ?? ""),
    answered_by: actorRef,
  });

  revalidatePath("/workspace");
}

export async function resetWorkspaceDocumentsAction(formData: FormData) {
  const { currentActor } = await getActionActorRef();
  const returnTo = String(formData.get("return_to") ?? "/workspace?stage=start");

  await resetWorkspaceDocuments(currentActor.workspace_id);

  revalidatePath("/workspace");
  redirect(returnTo || "/workspace?stage=start");
}

export async function seedReviewDemoAction(formData: FormData) {
  const { currentActor, actorRef } = await getActionActorRef();
  const documentId = String(formData.get("document_id") ?? "");

  if (!documentId) {
    return;
  }

  const document = await getDocument(documentId, {
    workspaceId: currentActor.workspace_id,
  });
  const targetBlock = document?.blocks[0];

  if (!document || !targetBlock) {
    return;
  }

  await createPatchProposal({
    document_id: document.document_id,
    block_id: targetBlock.block_id,
    section_id: targetBlock.section_id,
    operation: "replace",
    patch_type: "structural_edit",
    content: `## ${targetBlock.heading}\n\n- Review seeded from local admin controls.\n- Verify patch decisions before launch.`,
    rationale: "Seed local review activity for MVP testing.",
    proposed_by: {
      actor_type: "agent",
      actor_id: "specforge_agent",
    },
    base_version: document.version,
    target_fingerprint: targetBlock.target_fingerprint,
    confidence: 0.76,
  });

  await createCommentThread({
    document_id: document.document_id,
    block_id: targetBlock.block_id,
    body: "Local admin seeded this review thread so the queue can be exercised quickly.",
    created_by: actorRef,
  });

  await createClarification({
    document_id: document.document_id,
    section_heading: targetBlock.heading,
    question: `What is the launch-critical expectation for ${targetBlock.heading}?`,
    created_by: actorRef,
  });

  revalidatePath("/workspace");
  redirect(`/workspace?document=${document.document_id}&stage=review`);
}

export async function switchWorkspaceActorAction(formData: FormData) {
  const actorId = String(formData.get("actor_id") ?? "");
  const returnTo = String(formData.get("return_to") ?? "/workspace");

  await setCurrentWorkspaceActor(actorId);
  redirect(returnTo || "/workspace");
}

export async function setAssistRuntimePreferenceAction(formData: FormData) {
  const selectedTool = String(formData.get("assist_tool") ?? "auto") as PreferredAssistTool;
  const returnTo = String(formData.get("return_to") ?? "/workspace?stage=start");

  await setPreferredAssistTool(selectedTool);
  redirect(returnTo || "/workspace?stage=start");
}

export async function setWorkspacePlanAction(formData: FormData) {
  const { currentActor } = await getActionActorRef();
  const returnTo = String(formData.get("return_to") ?? "/workspace");
  const selectedPlan = String(formData.get("plan") ?? "demo");

  await updateWorkspacePlan(
    currentActor.workspace_id,
    selectedPlan === "pilot" ? "pilot" : "demo",
  );

  revalidatePath("/workspace");
  redirect(returnTo || "/workspace");
}

export async function createWorkspaceMemberAction(formData: FormData) {
  const { currentActor } = await getActionActorRef();
  const returnTo = String(formData.get("return_to") ?? "/workspace");
  const [workspaces, members] = await Promise.all([
    listWorkspaceRecords(),
    listWorkspaceMemberships(currentActor.workspace_id),
  ]);
  const workspace =
    workspaces.find((item) => item.workspace_id === currentActor.workspace_id) ?? {
      workspace_id: currentActor.workspace_id,
      name: "SpecForge Demo Workspace",
      plan: "demo" as const,
      created_at: new Date(0).toISOString(),
    };
  const memberQuota = getMemberQuotaState(workspace, members.length);

  if (memberQuota.blocked) {
    const blockedUrl = new URL(returnTo, "http://specforge.local");
    blockedUrl.searchParams.set("membership_error", "limit");
    redirect(`${blockedUrl.pathname}${blockedUrl.search}`);
  }

  await createWorkspaceMembership({
    workspace_id: currentActor.workspace_id,
    name: String(formData.get("name") ?? "New member"),
    role: String(formData.get("role") ?? "Contributor"),
    color: String(formData.get("color") ?? "#475569"),
    github_login: String(formData.get("github_login") ?? ""),
  });

  revalidatePath("/workspace");
  redirect(returnTo || "/workspace");
}

export async function requestPilotAccessAction(formData: FormData) {
  const headerList = await headers();
  const returnTo = normalizeReturnPath(
    String(formData.get("return_to") ?? "/pilot-access"),
    "/pilot-access",
  );
  const trapValue = normalizeText(formData.get("website"), 200);
  const fullName = normalizeText(formData.get("full_name"), 80);
  const email = normalizeText(formData.get("email"), 140).toLowerCase();
  const githubLogin = normalizeText(formData.get("github_login"), 64).toLowerCase();
  const company = normalizeText(formData.get("company"), 120);
  const companyUrl = normalizeText(formData.get("company_url"), 220);
  const teamSize = parseTeamSize(formData.get("team_size"));
  const pilotType = normalizeText(formData.get("pilot_type"), 80);
  const deadline = normalizeText(formData.get("deadline"), 120);
  const currentTools = normalizeText(formData.get("current_tools"), 180);
  const useCase = normalizeText(formData.get("use_case"), 1000);
  const notes = normalizeText(formData.get("notes"), 1000);
  const source = normalizeText(formData.get("source"), 96);

  if (trapValue) {
    redirect(buildRedirectPath(returnTo, { status: "submitted" }));
  }

  if (!fullName || !email || !githubLogin || !useCase || !isValidEmail(email)) {
    redirect(buildRedirectPath(returnTo, { status: "invalid" }));
  }

  const clientKey = getRequestClientKey(headerList);
  const limiter = consumePilotRequestRateLimit(`${clientKey}:${email}:${githubLogin}`);
  if (!limiter.allowed) {
    redirect(buildRedirectPath(returnTo, { status: "rate_limited" }));
  }

  const noteSections = [
    useCase ? `Use case:\n${useCase}` : "",
    company ? `Company: ${company}` : "",
    companyUrl ? `Company URL: ${companyUrl}` : "",
    teamSize ? `Team size: ${teamSize}` : "",
    pilotType ? `Pilot type: ${pilotType}` : "",
    deadline ? `Target timeline: ${deadline}` : "",
    currentTools ? `Current tools: ${currentTools}` : "",
    source ? `Source: ${source}` : "",
    notes ? `Notes:\n${notes}` : "",
  ].filter(Boolean);

  let workspaceId: string;
  try {
    workspaceId = getPilotTriageWorkspaceId();
  } catch {
    redirect(buildRedirectPath(returnTo, { status: "unavailable" }));
  }

  try {
    const request = await createPilotAccessRequest({
      workspace_id: workspaceId,
      github_login: githubLogin,
      requested_name: fullName,
      requested_email: email,
      note: noteSections.join("\n\n") || undefined,
    });

    await notifyPilotAccessRequest({
      request_id: request.request_id,
      full_name: fullName,
      email,
      github_login: githubLogin,
      company: company || undefined,
      pilot_type: pilotType || undefined,
      source: source || undefined,
    });
  } catch {
    redirect(buildRedirectPath(returnTo, { status: "error" }));
  }

  revalidatePath("/pilot-access");
  revalidatePath("/workspace");
  redirect(buildRedirectPath(returnTo, { status: "submitted" }));
}

export async function reviewPilotAccessRequestAction(formData: FormData) {
  const { actorRef, currentActor } = await getActionActorRef();
  const returnTo = normalizeReturnPath(
    String(formData.get("return_to") ?? "/workspace"),
    "/workspace",
  );
  const requestId = normalizeText(formData.get("request_id"), 120);
  const decisionRaw = normalizeText(formData.get("decision"), 16);
  const reviewNotes = normalizeText(formData.get("review_notes"), 500);
  const decision: PilotAccessDecision | null =
    decisionRaw === "approve" || decisionRaw === "reject"
      ? (decisionRaw as PilotAccessDecision)
      : null;

  if (!requestId || !decision) {
    redirect(buildRedirectPath(returnTo, { triage_status: "invalid" }));
  }

  if (!canTriagePilotAccess(currentActor.role)) {
    redirect(buildRedirectPath(returnTo, { triage_status: "forbidden" }));
  }

  try {
    await reviewPilotAccessRequest({
      request_id: requestId,
      decision,
      reviewed_by: actorRef,
      decision_reason: reviewNotes || undefined,
    });
  } catch {
    redirect(buildRedirectPath(returnTo, { triage_status: "error" }));
  }

  revalidatePath("/workspace");
  revalidatePath("/pilot-access");
  redirect(buildRedirectPath(returnTo, { triage_status: "saved" }));
}

export async function createIdeaDocumentAction(scaffold: Partial<IdeaScaffold>) {
  const { currentActor } = await getActionActorRef();
  
  // Normalize the scaffold
  const normalizedScaffold = normalizeIdeaScaffold(scaffold);
  
  // Convert to guided spec input
  const { guided, metadata } = ideaToGuidedSpecInput(normalizedScaffold);
  
  // Build the spec markdown
  const specMarkdown = buildGuidedSpecMarkdown(guided);
  const specMetadata = buildGuidedSpecMetadata(guided);
  
  // Create the document with the generated spec
  const created = await createDocument({
    workspace_id: currentActor.workspace_id,
    title: guided.title,
    initial_markdown: specMarkdown,
    metadata: {
      ...specMetadata,
      ...metadata,
      creation_mode: "idea_generated",
    },
  });
  
  // Redirect to the new document
  redirect(buildRedirectPath(`/workspace?document=${created.document_id}&stage=draft`, {}));
}

export async function deleteWorkspaceMemberAction(formData: FormData) {
  const { currentActor } = await getActionActorRef();
  const membershipId = String(formData.get("membership_id"));
  const returnTo = String(formData.get("return_to") || "/workspace");

  if (!membershipId) {
    redirect(buildRedirectPath(returnTo, { error: "missing_membership_id" }));
  }

  // Prevent deleting the active session
  const activeMembership = await listWorkspaceMemberships(currentActor.workspace_id);
  const isDeletingSelf = activeMembership.some(m => m.membership_id === membershipId && m.actor_id === currentActor.actor_id);
  
  if (isDeletingSelf) {
    redirect(buildRedirectPath(returnTo, { error: "cannot_delete_self" }));
  }

  // Prevent deleting the final member
  if (activeMembership.length <= 1) {
    redirect(buildRedirectPath(returnTo, { error: "cannot_delete_final_member" }));
  }

  const deleted = await deleteWorkspaceMembership(membershipId);
  
  if (!deleted) {
    redirect(buildRedirectPath(returnTo, { error: "member_not_found" }));
  }

  revalidatePath("/workspace");
  redirect(buildRedirectPath(returnTo, { success: "member_deleted" }));
}

export async function updateWorkspaceMemberRoleAction(formData: FormData) {
  await getActionActorRef();
  const membershipId = String(formData.get("membership_id"));
  const role = String(formData.get("role"));
  const returnTo = String(formData.get("return_to") || "/workspace");

  if (!membershipId || !role) {
    redirect(buildRedirectPath(returnTo, { error: "missing_fields" }));
  }

  const updated = await updateWorkspaceMembershipRole(membershipId, role);
  
  if (!updated) {
    redirect(buildRedirectPath(returnTo, { error: "member_not_found" }));
  }

  revalidatePath("/workspace");
  redirect(buildRedirectPath(returnTo, { success: "role_updated" }));
}
