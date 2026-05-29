import Link from "next/link";
import { headers } from "next/headers";

import {
  acceptAllPatchesAction,
  answerClarificationAction,
  createCommentThreadAction,
  createClarificationAction,
  createDocumentAction,
  createWorkspaceMemberAction,
  createPatchAction,
  decidePatchAction,
  reviewPilotAccessRequestAction,
  resolveCommentThreadAction,
  setAssistRuntimePreferenceAction,
  setWorkspacePlanAction,
  switchWorkspaceActorAction,
} from "../actions";
import { CollapsibleWorkspaceNav } from "./collapsible-nav";
import { ClarificationQueue } from "@/components/specforge/ClarificationQueue";
import { DocumentWorkspace } from "../document-workspace";
import { CollaborativeFileBrowser } from "@/components/specforge/CollaborativeFileBrowser";
import { SpecCreationWrapper } from "./SpecCreationWrapper";
import type { AgentAssistToolStatus } from "@/lib/specforge/agent-assist";
import { LocalAdminPanel } from "../local-admin-panel";
import { ShareDocumentPanel } from "../share-document-panel";
import { ExportStage } from "./export-stage";
import { ReviewStage } from "./review-stage";
import { RuntimeStatusPanel } from "./runtime-status-panel";
import { OpsStatusPanel } from "./ops-status-panel";
import { BillingStatusPanel } from "./billing-status-panel";
import styles from "../page.module.css";
import { getAgentAssistToolStatuses } from "@/lib/specforge/agent-assist";
import { readBacklogState } from "@/lib/specforge/backlog";
import { buildDesignHandoffData } from "@/lib/specforge/design-handoff";
import {
  getCurrentWorkspaceSession,
  getPreferredAssistTool,
  isGitHubAuthConfigured,
  listWorkspaceActors,
} from "@/lib/specforge/session";
import {
  listTemplates,
  resolveStarterTemplateId,
  type StarterTemplateId,
} from "@/lib/specforge/handoff";
import { heroVariantOrder, heroVariants, type HeroVariant } from "@/lib/specforge/marketing";
import { listShowcaseExamples } from "@/lib/specforge/showcase";
import {
  buildGuidedSteps,
  loadActiveWorkspaceDocumentState,
} from "@/lib/specforge/workspace-document-state";
import { loadWorkspaceSummary } from "@/lib/specforge/workspace-summary";
import { IdeaValidationPanel } from "@/components/specforge/SprintPlanningPanel";
import { AcceptanceTestSection } from "@/components/specforge/AcceptanceTestSection";
import { getTestMatrix } from "@/lib/specforge/acceptance-tests";
import { getAcceptanceTestDb } from "@/lib/specforge/acceptance-test-db";
import {
  listPilotAccessRequests,
  type PilotAccessRequestRecord,
} from "@/lib/specforge/store";

export const dynamic = "force-dynamic";

type Stage = "start" | "plan" | "draft" | "review" | "decide" | "export";

type Props = {
  searchParams?: Promise<{
    document?: string;
    stage?: string;
    variant?: string;
    template?: string;
    membership_error?: string;
    triage_status?: string;
  }>;
};

const stageOrder: Stage[] = ["start", "plan", "draft", "review", "decide", "export"];

function formatPilotAccessDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function canTriagePilotAccessRole(role: string) {
  const normalizedRole = role.trim().toLowerCase();
  return (
    normalizedRole === "workspace owner" ||
    normalizedRole === "owner" ||
    normalizedRole === "founder" ||
    normalizedRole === "admin"
  );
}

async function loadPilotAccessRequests(workspaceId: string) {
  try {
    const requests = await listPilotAccessRequests(workspaceId, { limit: 50 });

    return {
      available: true,
      requests,
      error: null as string | null,
    };
  } catch {
    return {
      available: true,
      requests: [] as PilotAccessRequestRecord[],
      error: "Unable to load pilot access requests right now.",
    };
  }
}

function getPatchRiskLabel(patchType: string) {
  switch (patchType) {
    case "requirement_change":
      return "high impact";
    case "task_export_change":
      return "handoff risk";
    case "structural_edit":
      return "medium impact";
    case "design_review":
      return "design feedback";
    default:
      return "low impact";
  }
}

function isDesignPatch(patch: { patch_type: string }) {
  return patch.patch_type === "design_review";
}

function getPatchStatusTone(status: string) {
  switch (status) {
    case "accepted":
    case "cherry_picked":
      return "success";
    case "rejected":
      return "danger";
    case "stale":
      return "warning";
    default:
      return "neutral";
  }
}

function renderDiffLines(before: string, after: string) {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const maxLength = Math.max(beforeLines.length, afterLines.length);

  return Array.from({ length: maxLength }, (_, index) => {
    const previous = beforeLines[index] ?? "";
    const next = afterLines[index] ?? "";

    if (previous === next) {
      return { key: `same-${index}`, before: previous, after: next, tone: "same" };
    }

    return {
      key: `change-${index}`,
      before: previous,
      after: next,
      tone: "changed",
    };
  });
}

function buildStageHref(documentId: string | null, stage: Stage) {
  const params = new URLSearchParams();
  if (documentId) {
    params.set("document", documentId);
  }
  params.set("stage", stage);
  return `/workspace?${params.toString()}`;
}

function buildTemplateHref(documentId: string | null, stage: Stage, templateId: StarterTemplateId) {
  const params = new URLSearchParams();
  if (documentId) {
    params.set("document", documentId);
  }
  params.set("stage", stage);
  params.set("template", templateId);
  return `/workspace?${params.toString()}`;
}

function buildWorkspaceHref(searchParams: {
  document?: string;
  stage?: string;
  variant?: string;
  template?: string;
  membership_error?: string;
  triage_status?: string;
}) {
  const params = new URLSearchParams();
  const keys: Array<keyof typeof searchParams> = [
    "document",
    "stage",
    "variant",
    "template",
    "membership_error",
    "triage_status",
  ];

  for (const key of keys) {
    const value = searchParams[key];
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `/workspace?${query}` : "/workspace";
}

function getAppOrigin(headerList: Headers) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredOrigin) {
    return configuredOrigin.replace(/\/$/, "");
  }

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "127.0.0.1:3000";
  const proto =
    headerList.get("x-forwarded-proto") ??
    (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${proto}://${host}`;
}

function getStageMeta(stage: Stage) {
  switch (stage) {
    case "start":
      return {
        title: "Start the spec",
        description: "Choose an existing draft or create a fresh document to work on.",
      };
    case "plan":
      return {
        title: "Sprint planning",
        description:
          "Walk through 5 optional planning stages — Discovery, CEO Review, Eng Review, Design Review, Security Review. Each stage proposes a governed patch. Skip any stage to move on.",
      };
    case "draft":
      return {
        title: "Draft on the canvas",
        description: "Use the shared editor as the canonical source of truth.",
      };
    case "review":
      return {
        title: "Prepare review work",
        description: "Open comments, inspect activity, and queue targeted patch proposals.",
      };
    case "decide":
      return {
        title: "Resolve proposed changes",
        description: "Make human decisions on the patch queue and keep an audit trail.",
      };
    case "export":
      return {
        title: "Launch the build handoff",
        description:
          "Check readiness, inspect the starter output, and package one-shot build context.",
      };
  }
}

function HostedAuthGate({
  heroCopy,
  membershipError,
  signInHref,
}: {
  heroCopy: {
    eyebrow: string;
    headline: string;
    subhead: string;
  };
  membershipError: string | null;
  signInHref: string;
}) {
  return (
    <div className={styles.shell}>
      <div className={styles.authGateBackdrop} />
      <section className={styles.authGateCard}>
        <span className={styles.brandMark}>SpecForge</span>
        <p className={styles.authGateEyebrow}>Pilot workspace access</p>
        <h1>{heroCopy.headline}</h1>
        <p className={styles.subhead}>
          This hosted workspace is locked behind GitHub sign-in so membership, audit trail, and
          patch decisions stay attributable.
        </p>
        {membershipError ? (
          <div className={styles.actorCard}>
            <strong>Membership limit reached</strong>
            <span>{membershipError}</span>
          </div>
        ) : null}
        <div className={styles.inlineActions}>
          <Link href={signInHref} className={styles.exportLink}>
            Sign in with GitHub
          </Link>
          <Link href="/pricing" className={styles.secondaryLink}>
            View pilot plans
          </Link>
          <Link href="/download" className={styles.secondaryLink}>
            Run local alpha
          </Link>
        </div>
        <ul className={styles.authGateList}>
          <li>Signed workspace session token with expiration</li>
          <li>Rate-limited API boundary and cross-site mutation protection</li>
          <li>Workspace membership and actor identity are resolved server-side</li>
        </ul>
      </section>
    </div>
  );
}

export default async function Home({ searchParams }: Props) {
  const headerList = await headers();
  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedDocumentId =
    typeof resolvedSearchParams.document === "string"
      ? resolvedSearchParams.document
      : undefined;
  const requestedStage =
    typeof resolvedSearchParams.stage === "string" &&
    stageOrder.includes(resolvedSearchParams.stage as Stage)
      ? (resolvedSearchParams.stage as Stage)
      : undefined;
  const heroVariant =
    typeof resolvedSearchParams.variant === "string" &&
    heroVariantOrder.includes(resolvedSearchParams.variant as HeroVariant)
      ? (resolvedSearchParams.variant as HeroVariant)
      : "handoff";
  const heroCopy = heroVariants[heroVariant];
  const membershipError =
    resolvedSearchParams.membership_error === "limit"
      ? "This workspace has reached its current member limit."
      : null;
  const triageStatus =
    typeof resolvedSearchParams.triage_status === "string"
      ? resolvedSearchParams.triage_status
      : null;
  const availableTemplates = listTemplates();
  const selectedTemplateId = resolveStarterTemplateId(
    typeof resolvedSearchParams.template === "string"
      ? resolvedSearchParams.template
      : undefined,
  );
  const activeWorkspaceSession = await getCurrentWorkspaceSession();
  const githubAuthConfigured = isGitHubAuthConfigured();
  const signInHref = `/api/auth/login?next=${encodeURIComponent(
    buildWorkspaceHref({
      document: requestedDocumentId,
      stage: requestedStage,
      variant:
        typeof resolvedSearchParams.variant === "string" ? resolvedSearchParams.variant : undefined,
      template:
        typeof resolvedSearchParams.template === "string"
          ? resolvedSearchParams.template
          : undefined,
      membership_error:
        typeof resolvedSearchParams.membership_error === "string"
          ? resolvedSearchParams.membership_error
          : undefined,
    }),
  )}`;

  if (githubAuthConfigured && activeWorkspaceSession.authMode === "unauthenticated") {
    return (
      <HostedAuthGate
        heroCopy={heroCopy}
        membershipError={membershipError}
        signInHref={signInHref}
      />
    );
  }

  const workspaceActors = await listWorkspaceActors();
  const preferredAssistTool = await getPreferredAssistTool();
  const activeWorkspaceActor = activeWorkspaceSession.actor;
  const backlogState = await readBacklogState();
  const [workspaceSummary, assistToolStatuses] =
    await Promise.all([
      loadWorkspaceSummary(activeWorkspaceActor.workspace_id),
      getAgentAssistToolStatuses(),
    ]);
  const pilotAccessState = await loadPilotAccessRequests(activeWorkspaceActor.workspace_id);
  const pendingPilotRequests = pilotAccessState.requests.filter(
    (request) => request.status === "pending",
  ).length;
  const {
    workspaceRecords,
    activeWorkspace,
    activeWorkspaceMembers,
    workspaceActivity,
    workspaceUsage,
    documents,
    assistQuota,
    memberQuota,
    billingPreview,
  } = workspaceSummary;
  const [showcaseExamples, activeDocumentState] = await Promise.all([
    listShowcaseExamples(),
    loadActiveWorkspaceDocumentState({
      documents,
      requestedDocumentId,
      workspaceId: activeWorkspaceActor.workspace_id,
      templateId: selectedTemplateId,
    }),
  ]);
  const {
    activeDocument,
    patches,
    commentThreads,
    clarifications,
    exportBundle,
    readinessReport,
    handoffBundle,
    executionBrief,
    launchPacket,
    auditEvents,
    activeBlock,
    showcaseSourceId,
    showcaseSourcePath,
    blockSummaries,
    agentProposedPatches,
    approvedAgentPatches,
    humanComments,
    actionablePatches,
    resolvedPatches,
  } = activeDocumentState;
  const guidedSteps = buildGuidedSteps({
    hasDocument: Boolean(activeDocument),
    hasDraft: Boolean(activeDocument?.markdown.trim()),
    hasPatches: patches.length > 0,
    hasOpenComments: commentThreads.some((thread) => thread.status === "open"),
    hasPendingPatches: patches.some((patch) => ["proposed", "stale"].includes(patch.status)),
    isReadyToExport: Boolean(readinessReport && readinessReport.score >= 70),
  });
  const activeStage =
    requestedStage ?? (activeDocument ? "draft" : "start");
  const canTriagePilotAccess = canTriagePilotAccessRole(activeWorkspaceActor.role);
  const stageMeta = getStageMeta(activeStage);
  const actorReturnTo = buildStageHref(activeDocument?.document_id ?? null, activeStage);
  const sharePath = buildStageHref(activeDocument?.document_id ?? null, activeDocument ? activeStage : "start");
  const shareUrl = `${getAppOrigin(headerList)}${sharePath}`;
  const exportEndpoint =
    activeDocument?.document_id &&
    readinessReport?.gates &&
    !readinessReport.gates.passed
      ? `/api/documents/${activeDocument.document_id}/export?force=true`
      : `/api/documents/${activeDocument?.document_id}/export`;
  const designHandoff =
    activeDocument && exportBundle
      ? buildDesignHandoffData({
          document: activeDocument,
          designSystem: exportBundle.files["DESIGN_SYSTEM.md"] ?? null,
        })
      : null;
  const acceptanceTests = activeDocument
    ? await getAcceptanceTestDb().then((db) =>
        getTestMatrix(db, activeDocument.document_id).then((m) => m.tests),
      )
    : [];

  return (
    <div className={styles.shell}>
      <CollapsibleWorkspaceNav
        docTitle={activeDocument ? activeDocument.title : "No active document"}
        stageLabel={activeDocument ? stageMeta.title : null}
        shareUrl={shareUrl}
      />

      <main className={styles.focusLayout}>
        <aside className={styles.focusSidebar}>
          <details className={styles.panel} open>
            <summary className={styles.disclosureSummary}>
              <span>Workflow</span>
              <span>Guided path</span>
            </summary>
            <div className={styles.disclosureBody}>
              <nav className={styles.stepGrid}>
                {guidedSteps.map((step, index) => (
                  <Link
                    key={step.id}
                    href={buildStageHref(activeDocument?.document_id ?? null, step.stage)}
                    className={`${styles.stepCard} ${styles[step.status]}`}
                  >
                    <span className={styles.stepNumber}>Step {index + 1}</span>
                    <strong>{step.title}</strong>
                    <p>{step.description}</p>
                  </Link>
                ))}
              </nav>
            </div>
          </details>

          <details className={styles.panel} open>
            <summary className={styles.disclosureSummary}>
              <span>Document library</span>
              <span>{documents.length} total</span>
            </summary>
            <div className={styles.disclosureBody}>
              <ul className={styles.documentList} data-testid="document-list">
                {documents.map((document) => (
                  <li key={document.document_id} className={styles.documentItem}>
                    <Link
                      href={buildStageHref(document.document_id, activeStage)}
                      className={styles.documentLink}
                    >
                      <strong>{document.title}</strong>
                      <span>{document.document_id}</span>
                      <span>v{document.version}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </details>

          <details className={styles.panel}>
            <summary className={styles.disclosureSummary}>
              <span>Workspace session</span>
              <span>
                {activeWorkspaceSession.authMode === "github"
                  ? "Pilot auth"
                  : activeWorkspaceSession.authMode === "unauthenticated"
                    ? "Not signed in"
                    : "Local demo"}
              </span>
            </summary>
            <div className={styles.disclosureBody}>
              {activeWorkspaceSession.authMode === "unauthenticated" ? (
                <div className={styles.actorCard}>
                  <strong>Sign in to continue</strong>
                  <span>GitHub authentication is required to access this workspace.</span>
                  <div className={styles.inlineActions}>
                    <Link href="/api/auth/login" className={styles.exportLink}>
                      Sign in with GitHub
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.actorCard}>
                    <strong>{activeWorkspaceActor.name}</strong>
                    <span>{activeWorkspaceActor.role}</span>
                    <span>{activeWorkspaceActor.actor_id}</span>
                    {activeWorkspaceSession.githubLogin ? (
                      <span>GitHub: @{activeWorkspaceSession.githubLogin}</span>
                    ) : null}
                  </div>
                  <div className={styles.actorCard}>
                    <strong>{activeWorkspace.name}</strong>
                    <span>{activeWorkspace.plan} workspace</span>
                    <span>
                      Members:{" "}
                      {memberQuota.limit === null
                        ? activeWorkspaceMembers.length
                        : `${activeWorkspaceMembers.length}/${memberQuota.limit}`}
                    </span>
                    <span>{documents.length} visible documents</span>
                    <span>
                      AI assists:{" "}
                      {activeWorkspaceSession.authMode === "local"
                        ? "unlimited (local)"
                        : assistQuota.limit === null
                        ? "unlimited"
                        : `${assistQuota.used}/${assistQuota.limit} used`}
                    </span>
                    <span>
                      AI model:{" "}
                      {preferredAssistTool === "auto"
                        ? "auto"
                        : preferredAssistTool.replaceAll("_", " ")}
                    </span>
                  </div>
                  <details className={styles.wizardSection}>
                    <summary className={styles.disclosureSummary}>
                      <span>AI model</span>
                      <span>
                        {preferredAssistTool === "auto"
                          ? "auto"
                          : preferredAssistTool.replaceAll("_", " ")}
                      </span>
                    </summary>
                    <div className={styles.disclosureBody}>
                      <p className={styles.context}>
                        Choose which AI model powers the assist features. Set a preference once
                        and it persists across sessions.
                      </p>
                      <form action={setAssistRuntimePreferenceAction} className={styles.form}>
                        <input type="hidden" name="return_to" value={actorReturnTo} />
                        <label>
                          Preferred AI model
                          <select
                            name="assist_tool"
                            className={styles.selectInput}
                            defaultValue={preferredAssistTool}
                          >
                            <option value="auto">Auto-select the best local assist</option>
                            <option value="codex_cli">Codex CLI</option>
                            <option value="claude_cli">Claude Code CLI</option>
                            <option value="heuristic">Built-in fallback</option>
                          </select>
                        </label>
                        <button type="submit">Save preference</button>
                      </form>
                    </div>
                  </details>
                  <details className={styles.wizardSection}>
                    <summary className={styles.disclosureSummary}>
                      <span>Workspace plan</span>
                      <span>{activeWorkspace.plan}</span>
                    </summary>
                    <div className={styles.disclosureBody}>
                      <p className={styles.context}>
                        Switch between demo and pilot locally so you can rehearse quotas, member
                        limits, and billing preview without editing the store by hand.
                      </p>
                      <form action={setWorkspacePlanAction} className={styles.form}>
                        <input type="hidden" name="return_to" value={actorReturnTo} />
                        <label>
                          Current plan
                          <select
                            name="plan"
                            className={styles.selectInput}
                            defaultValue={activeWorkspace.plan}
                          >
                            <option value="demo">Demo</option>
                            <option value="pilot">Pilot</option>
                          </select>
                        </label>
                        <button type="submit">Save workspace plan</button>
                      </form>
                    </div>
                  </details>
                  <details className={styles.wizardSection} data-testid="share-current-spec-details">
                    <summary className={styles.disclosureSummary}>
                      <span>Share current spec</span>
                      <span>{activeDocument ? "Copy URL" : "Workspace link"}</span>
                    </summary>
                    <ShareDocumentPanel
                      shareUrl={shareUrl}
                      documentTitle={activeDocument?.title ?? null}
                      workspaceName={activeWorkspace.name}
                      requiresMembership={activeWorkspaceSession.authMode !== "local"}
                    />
                  </details>
                  <details className={styles.wizardSection}>
                    <summary className={styles.disclosureSummary}>
                      <span>Workspace members</span>
                      <span>{activeWorkspaceMembers.length} listed</span>
                    </summary>
                    <div className={styles.disclosureBody}>
                      <ul className={styles.documentList}>
                        {activeWorkspaceMembers.map((member) => (
                          <li key={member.membership_id} className={styles.documentItem}>
                            <span>
                              <strong>{member.name}</strong>{" "}
                              <span className={styles.badge}>{member.role}</span>
                              {member.github_login ? (
                                <span className={styles.mutedInline}>@{member.github_login}</span>
                              ) : null}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {membershipError ? (
                        <div className={styles.actorCard}>
                          <strong>Membership limit reached</strong>
                          <span>{membershipError}</span>
                        </div>
                      ) : null}
                      <form action={createWorkspaceMemberAction} className={styles.form}>
                        <input type="hidden" name="return_to" value={actorReturnTo} />
                        <label>
                          Member name
                          <input name="name" placeholder="Jordan Reviewer" required />
                        </label>
                        <label>
                          Role
                          <input name="role" placeholder="Reviewer" required />
                        </label>
                        <label>
                          GitHub login
                          <input name="github_login" placeholder="jordan-dev" />
                        </label>
                        <label>
                          Color
                          <input name="color" type="color" defaultValue="#475569" />
                        </label>
                        <button type="submit">Add workspace member</button>
                      </form>
                    </div>
                  </details>
                  {workspaceRecords.length > 1 ? (
                    <details className={styles.wizardSection}>
                      <summary className={styles.disclosureSummary}>
                        <span>Switch workspace</span>
                        <span>{workspaceRecords.length} available</span>
                      </summary>
                      <div className={styles.disclosureBody}>
                        <ul className={styles.documentList}>
                          {workspaceRecords.map((ws) => (
                            <li key={ws.workspace_id} className={styles.documentItem}>
                              <span>
                                <strong>{ws.name}</strong>{" "}
                                <span className={styles.badge}>{ws.plan}</span>
                                {ws.workspace_id === activeWorkspace.workspace_id ? (
                                  <span className={styles.badge}>current</span>
                                ) : null}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  ) : null}
                  {githubAuthConfigured ? (
                    <div className={styles.inlineActions}>
                      {activeWorkspaceSession.authMode === "github" ? (
                        <Link href="/api/auth/logout" className={styles.secondaryLink}>
                          Log out
                        </Link>
                      ) : (
                        <Link href="/api/auth/login" className={styles.secondaryLink}>
                          Sign in with GitHub
                        </Link>
                      )}
                    </div>
                  ) : (
                    <>
                    {activeWorkspaceSession.authMode === "local" ? (
                      <p className={styles.mutedInline}>
                        GitHub sign-in not configured — add{" "}
                        <code>GITHUB_CLIENT_ID</code> and{" "}
                        <code>GITHUB_CLIENT_SECRET</code> to{" "}
                        <code>web/.env.local</code> to enable identity tracking.{" "}
                        <a
                          href="https://github.com/settings/applications/new"
                          target="_blank"
                          rel="noreferrer"
                          className={styles.secondaryLink}
                        >
                          Create an OAuth App
                        </a>
                      </p>
                    ) : null}
                    <form action={switchWorkspaceActorAction} className={styles.form}>
                      <input type="hidden" name="return_to" value={actorReturnTo} />
                      <label>
                        Active role
                        <select
                          name="actor_id"
                          className={styles.selectInput}
                          defaultValue={activeWorkspaceActor.actor_id}
                        >
                          {workspaceActors.map((actor) => (
                            <option key={actor.actor_id} value={actor.actor_id}>
                              {actor.name} · {actor.role}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button type="submit">Switch local actor</button>
                    </form>
                    </>
                  )}
                </>
              )}
            </div>
          </details>

          <LocalAdminPanel
            authMode={activeWorkspaceSession.authMode}
            activeDocumentId={activeDocument?.document_id ?? null}
          />

          <details className={styles.panel}>
            <summary className={styles.disclosureSummary}>
              <span>Pilot access triage</span>
              <span>{pendingPilotRequests} pending</span>
            </summary>
            <div className={styles.disclosureBody}>
              <p className={styles.context}>
                Review incoming pilot requests and approve or reject without leaving the workspace.
              </p>
              {triageStatus === "saved" ? (
                <div className={styles.actorCard}>
                  <strong>Triage updated</strong>
                  <span>The pilot access decision was saved.</span>
                </div>
              ) : null}
              {triageStatus === "invalid" ? (
                <div className={styles.actorCard}>
                  <strong>Missing triage input</strong>
                  <span>Specify a valid request and decision before submitting.</span>
                </div>
              ) : null}
              {triageStatus === "unavailable" ? (
                <div className={styles.actorCard}>
                  <strong>Triage API unavailable</strong>
                  <span>Pilot triage is unavailable in this environment right now.</span>
                </div>
              ) : null}
              {triageStatus === "error" ? (
                <div className={styles.actorCard}>
                  <strong>Triage failed</strong>
                  <span>The decision could not be saved. Retry in a moment.</span>
                </div>
              ) : null}
              {triageStatus === "forbidden" ? (
                <div className={styles.actorCard}>
                  <strong>Insufficient permissions</strong>
                  <span>Only workspace admins can approve or reject pilot access requests.</span>
                </div>
              ) : null}
              {pilotAccessState.available && !canTriagePilotAccess ? (
                <div className={styles.actorCard}>
                  <strong>Read-only triage view</strong>
                  <span>
                    Your current role is <strong>{activeWorkspaceActor.role}</strong>. Switch to an
                    admin role to review requests.
                  </span>
                </div>
              ) : null}
              {pilotAccessState.error ? (
                <div className={styles.actorCard}>
                  <strong>Triage load error</strong>
                  <span>{pilotAccessState.error}</span>
                </div>
              ) : null}
              {pilotAccessState.available && pilotAccessState.requests.length === 0 ? (
                <p className={styles.empty}>No pilot requests yet.</p>
              ) : null}
              {pilotAccessState.available && pilotAccessState.requests.length > 0 ? (
                <ul className={styles.documentList}>
                  {pilotAccessState.requests.map((request) => (
                    <li key={request.request_id} className={styles.documentItem}>
                      <div className={styles.patchHeader}>
                        <span>
                          <strong>{request.requested_name}</strong>{" "}
                          <span
                            className={`${styles.badge} ${
                              request.status === "approved"
                                ? styles.success
                                : request.status === "rejected"
                                  ? styles.warning
                                  : styles.neutral
                            }`}
                          >
                            {request.status}
                          </span>
                        </span>
                        <span>{formatPilotAccessDate(request.created_at)}</span>
                      </div>
                      <span>{request.github_login}</span>
                      {request.requested_email ? (
                        <span>{request.requested_email}</span>
                      ) : null}
                      {request.note ? <p className={styles.context}>{request.note}</p> : null}
                      {request.reviewed_at ? (
                        <span>
                          Reviewed {formatPilotAccessDate(request.reviewed_at)}
                          {request.reviewed_by?.actor_id ? ` by ${request.reviewed_by.actor_id}` : ""}
                        </span>
                      ) : null}
                      {request.status === "pending" && canTriagePilotAccess ? (
                        <div className={styles.inlineActions}>
                          <form action={reviewPilotAccessRequestAction} className={styles.inlineForm}>
                            <input type="hidden" name="request_id" value={request.request_id} />
                            <input type="hidden" name="decision" value="approve" />
                            <input
                              type="hidden"
                              name="review_notes"
                              value="Approved from workspace pilot triage panel."
                            />
                            <input type="hidden" name="return_to" value={actorReturnTo} />
                            <button type="submit" className={styles.inlineActionButtonPrimary}>
                              Approve
                            </button>
                          </form>
                          <form action={reviewPilotAccessRequestAction} className={styles.inlineForm}>
                            <input type="hidden" name="request_id" value={request.request_id} />
                            <input type="hidden" name="decision" value="reject" />
                            <input
                              type="hidden"
                              name="review_notes"
                              value="Rejected from workspace pilot triage panel."
                            />
                            <input type="hidden" name="return_to" value={actorReturnTo} />
                            <button type="submit" className={styles.inlineActionButton}>
                              Reject
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </details>

          <RuntimeStatusPanel />
          <OpsStatusPanel />
          <BillingStatusPanel />

          <details className={styles.panel}>
            <summary className={styles.disclosureSummary}>
              <span>Pilot signals</span>
              <span>{workspaceActivity.document_count} docs tracked</span>
            </summary>
            <div className={styles.disclosureBody}>
              <div className={styles.metricGrid}>
                <div className={styles.metricCard}>
                  <strong>{workspaceActivity.document_count}</strong>
                  <span>documents</span>
                </div>
                <div className={styles.metricCard}>
                  <strong>{workspaceActivity.reviewed_document_count}</strong>
                  <span>reviewed</span>
                </div>
                <div className={styles.metricCard}>
                  <strong>{workspaceActivity.commented_document_count}</strong>
                  <span>commented</span>
                </div>
                <div className={styles.metricCard}>
                  <strong>{workspaceActivity.clarified_document_count}</strong>
                  <span>clarified</span>
                </div>
                <div className={styles.metricCard}>
                  <strong>{workspaceUsage.assist_request_count}</strong>
                  <span>assist runs</span>
                </div>
                <div className={styles.metricCard}>
                  <strong>
                    {assistQuota.limit === null ? "∞" : assistQuota.remaining}
                  </strong>
                  <span>assist remaining</span>
                </div>
                <div className={styles.metricCard}>
                  <strong>{memberQuota.limit === null ? "∞" : memberQuota.remaining}</strong>
                  <span>member slots left</span>
                </div>
                <div className={styles.metricCard}>
                  <strong>
                    {billingPreview.estimatedMonthlyUsd === null
                      ? "Free"
                      : `$${billingPreview.estimatedMonthlyUsd}`}
                  </strong>
                  <span>monthly preview</span>
                </div>
                <div className={styles.metricCard}>
                  <strong>{workspaceUsage.handoff_view_count}</strong>
                  <span>handoffs</span>
                </div>
                <div className={styles.metricCard}>
                  <strong>{workspaceUsage.execution_view_count}</strong>
                  <span>execution views</span>
                </div>
                <div className={styles.metricCard}>
                  <strong>{workspaceUsage.launch_packet_view_count}</strong>
                  <span>launch packets</span>
                </div>
              </div>
            </div>
          </details>

          <details className={styles.panel}>
            <summary className={styles.disclosureSummary}>
              <span>Delivery loop</span>
              <span>{backlogState.remainingCount} remaining</span>
            </summary>
            <div className={styles.disclosureBody}>
              <div className={styles.actorCard}>
                <strong>{backlogState.activeSection ?? "Backlog clear"}</strong>
                <span>Target: {backlogState.deliveryTarget.replaceAll("_", " ")}</span>
                <span>
                  {backlogState.remainingCount} remaining item
                  {backlogState.remainingCount === 1 ? "" : "s"}
                </span>
                <span>{backlogState.nextItem ?? "No queued work."}</span>
                <span>
                  Review cadence: every {backlogState.reviewEvery} pass
                  {backlogState.reviewEvery === 1 ? "" : "es"}
                  {backlogState.reviewDue ? " · review due now" : ""}
                </span>
              </div>
              {backlogState.latestIntent ? (
                <div className={styles.actorCard}>
                  <strong>Latest intent</strong>
                  <span>{backlogState.latestIntent.title}</span>
                  <span>{backlogState.latestIntent.status}</span>
                </div>
              ) : null}
              {backlogState.latestClaim ? (
                <div className={styles.actorCard}>
                  <strong>Latest claim</strong>
                  <span>{backlogState.latestClaim.claim_id}</span>
                  <span>{backlogState.latestClaim.state}</span>
                  {typeof backlogState.latestClaim.retry_count === "number" ? (
                    <span>Retry {backlogState.latestClaim.retry_count}</span>
                  ) : null}
                  <span>{backlogState.latestClaim.heartbeat_at}</span>
                  {backlogState.latestClaim.failure_summary ? (
                    <span>{backlogState.latestClaim.failure_summary}</span>
                  ) : null}
                </div>
              ) : null}
              {backlogState.latestSignal ? (
                <div className={styles.actorCard}>
                  <strong>Latest signal</strong>
                  <span>{backlogState.latestSignal.type}</span>
                  <span>{backlogState.latestSignal.intent_id}</span>
                  <span>{backlogState.latestSignal.at}</span>
                  {backlogState.latestSignal.failure_summary ? (
                    <span>{backlogState.latestSignal.failure_summary}</span>
                  ) : null}
                </div>
              ) : null}
              <div className={styles.inlineActions}>
                <Link href="/api/parity/status" className={styles.secondaryLink} target="_blank">
                  Open status JSON
                </Link>
                <Link href="/api/parity/context" className={styles.secondaryLink} target="_blank">
                  Open context package
                </Link>
                <Link href="/api/parity/brief" className={styles.secondaryLink} target="_blank">
                  Open next-pass brief
                </Link>
              </div>
            </div>
          </details>

          <details className={styles.panel}>
            <summary className={styles.disclosureSummary}>
              <span>Ops</span>
              <span>Health and restore</span>
            </summary>
            <div className={styles.disclosureBody}>
              <div className={styles.actorCard}>
                <strong>Runtime endpoints</strong>
                <div className={styles.inlineActions}>
                  <Link href="/api/health" className={styles.secondaryLink}>
                    Web health
                  </Link>
                  <Link href="/api/ops/summary" className={styles.secondaryLink}>
                    Ops summary
                  </Link>
                  <Link href="/api/ops/backups" className={styles.secondaryLink}>
                    Backup index
                  </Link>
                  <Link href="/api/metrics" className={styles.secondaryLink}>
                    Web metrics
                  </Link>
                  <Link href="/api/workspace/entitlements" className={styles.secondaryLink}>
                    Entitlements
                  </Link>
                  <Link href="http://127.0.0.1:4322/health" className={styles.secondaryLink}>
                    Collab health
                  </Link>
                  <Link href="http://127.0.0.1:4322/metrics" className={styles.secondaryLink}>
                    Collab metrics
                  </Link>
                </div>
              </div>
              <div className={styles.actorCard}>
                <strong>Local restore flow</strong>
                <span>`bun run state:backup` snapshots web, collab, and runner state.</span>
                <span>`bun run state:restore` restores the latest backup, or a specific path if supplied.</span>
              </div>
            </div>
          </details>

          <details className={styles.panel}>
            <summary className={styles.disclosureSummary}>
              <span>Agent runtimes</span>
              <span>{assistToolStatuses.filter((tool) => tool.available).length} available</span>
            </summary>
            <div className={styles.disclosureBody}>
              <ul className={styles.patchList}>
                {assistToolStatuses.map((tool) => (
                  <li key={tool.id} className={styles.patchItem}>
                    <strong>{tool.label}</strong>
                    <span className={`${styles.badge} ${tool.available ? styles.success : styles.neutral}`}>
                      {tool.available ? "available" : "unavailable"}
                    </span>
                    <span>{tool.detail}</span>
                  </li>
                ))}
              </ul>
              <p className={styles.context}>
                Bring your own Claude or Codex API key, or use a hosted plan where credentials
                are stored encrypted server-side.
              </p>
            </div>
          </details>

          {readinessReport ? (
            <details className={styles.panel}>
              <summary className={styles.disclosureSummary}>
                <span>Readiness</span>
                <span>
                  {readinessReport.score}/100 · {readinessReport.status}
                </span>
              </summary>
              <div className={styles.disclosureBody}>
                <div className={styles.readinessCard}>
                  <strong>{readinessReport.score}/100</strong>
                  <span className={styles.status}>{readinessReport.status}</span>
                  <ul className={styles.readinessList}>
                    {readinessReport.recap.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          ) : null}
        </aside>

        <section className={styles.focusMain}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>{stageMeta.title}</h2>
              <span>{activeDocument ? activeDocument.title : "No active document"}</span>
            </div>
            <p className={styles.stageDescription}>{stageMeta.description}</p>
          </section>

          {activeStage === "start" ? (
            <>
              <section className={styles.panel} id="create-document">
                <div className={styles.panelHeader}>
                  <h2>Guided spec creation</h2>
                  <span>Structured draft with assist</span>
                </div>
                <SpecCreationWrapper
                  toolStatuses={assistToolStatuses}
                  cliAssistEnabled={activeWorkspaceSession.authMode === "local"}
                  preferredTool={preferredAssistTool}
                />
              </section>

              {showcaseExamples.length > 0 ? (
                <section className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <h2>Canonical showcase</h2>
                    <span>Import from ideas/</span>
                  </div>
                  <div className={styles.showcaseList}>
                    {showcaseExamples.map((example) => (
                      <article key={example.id} className={styles.showcaseCard}>
                        <div className={styles.patchHeader}>
                          <strong>{example.title}</strong>
                          <span className={styles.badge}>{example.id}</span>
                        </div>
                        <p className={styles.context}>{example.summary}</p>
                        <ul className={styles.readinessList}>
                          <li>{example.highlight}</li>
                          <li>{example.nextAction}</li>
                          <li>
                            Source pack: <code>{example.pathLabel}</code>
                          </li>
                        </ul>
                        <form action={createDocumentAction} className={styles.inlineForm}>
                          <input type="hidden" name="mode" value="example" />
                          <input type="hidden" name="example_id" value={example.id} />
                          <input type="hidden" name="title" value={example.title} />
                          <button type="submit">Import showcase draft</button>
                        </form>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {activeDocument ? (
                <section className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <h2>Current draft</h2>
                    <span>Continue where you left off</span>
                  </div>
                  <p className={styles.context}>
                    Active document: <strong>{activeDocument.title}</strong>
                  </p>
                  <div className={styles.inlineActions}>
                    <Link
                      href={buildStageHref(activeDocument.document_id, "plan")}
                      className={styles.exportLink}
                    >
                      Sprint planning
                    </Link>
                    <Link
                      href={buildStageHref(activeDocument.document_id, "draft")}
                      className={styles.secondaryLink}
                    >
                      Open draft workspace
                    </Link>
                    <Link
                      href={buildStageHref(activeDocument.document_id, "review")}
                      className={styles.secondaryLink}
                    >
                      Jump to review prep
                    </Link>
                  </div>
                </section>
              ) : null}
            </>
          ) : null}

          {activeStage === "plan" ? (
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2>Planning stages</h2>
                <span>Act 1 — optional</span>
              </div>
              {activeDocument ? (
                <IdeaValidationPanel
                  documentId={activeDocument.document_id}
                  actorId={activeWorkspaceActor.actor_id}
                  specWizardHref={buildStageHref(activeDocument.document_id, "draft")}
                />
              ) : (
                <p className={styles.empty}>Create a document first, then run idea validation.</p>
              )}
            </section>
          ) : null}

          {activeStage === "draft" ? (
            <section className={`${styles.panel} ${styles.editorPanel}`} id="document-workspace">
              <div className={styles.panelHeader}>
                <h2>File workspace</h2>
                <span>Multi-file collaborative editor</span>
              </div>
              {activeDocument ? (
                <CollaborativeFileBrowser
                  documentId={activeDocument.document_id}
                  activeActor={activeWorkspaceActor}
                />
              ) : (
                <p className={styles.empty}>Create a document first.</p>
              )}
            </section>
          ) : null}

          {activeStage === "review" ? (
            <ReviewStage
              activeDocument={activeDocument}
              activeBlock={activeBlock}
              activeWorkspaceActorId={activeWorkspaceActor.actor_id}
              patches={patches}
              commentThreads={commentThreads}
              clarifications={clarifications}
              blockSummaries={blockSummaries}
              buildStageHref={buildStageHref}
              createPatchAction={createPatchAction}
              createCommentThreadAction={createCommentThreadAction}
              resolveCommentThreadAction={resolveCommentThreadAction}
              createClarificationAction={createClarificationAction}
              answerClarificationAction={answerClarificationAction}
            />
          ) : null}

          {activeStage === "decide" ? (
            <>
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h2>Decision queue</h2>
                  <span>Human approvals</span>
                </div>
                <ul className={styles.readinessList}>
                  <li>{actionablePatches.length} patches need a decision now.</li>
                  <li>
                    <span className={`${styles.badge} ${styles.design}`}>
                      {actionablePatches.filter(isDesignPatch).length} design review
                    </span>
                    {" "}patches in the queue.
                  </li>
                  <li>{resolvedPatches.length} patches are already resolved.</li>
                  <li>{commentThreads.filter((thread) => thread.status === "open").length} open comments may still affect decisions.</li>
                  <li>{clarifications.filter((item) => item.status === "open").length} unanswered clarifications still block clean handoff.</li>
                </ul>
                {activeDocument ? (
                  <div className={styles.inlineActions}>
                    <Link
                      href={buildStageHref(activeDocument.document_id, "review")}
                      className={styles.secondaryLink}
                    >
                      Back to review prep
                    </Link>
                    <Link
                      href={buildStageHref(activeDocument.document_id, "export")}
                      className={styles.exportLink}
                    >
                      Continue to handoff
                    </Link>
                  </div>
                ) : null}
              </section>

              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h2>Actionable patches</h2>
                  <span>Resolve these first</span>
                </div>
                {activeDocument && actionablePatches.length > 0 ? (
                  <form action={acceptAllPatchesAction} className={styles.inlineActions}>
                    <input type="hidden" name="document_id" value={activeDocument.document_id} />
                    <button type="submit">Accept all patches</button>
                  </form>
                ) : activeDocument && actionablePatches.length === 0 ? (
                  <p className={styles.empty}>No pending patches. Queue a patch from the review stage or continue to handoff.</p>
                ) : null}
                <ul className={styles.patchList} data-testid="patch-queue">
                  {actionablePatches.map((patch) => {
                    const targetBlock =
                      activeDocument?.blocks.find((block) => block.block_id === patch.block_id) ??
                      null;
                    const originalContent = targetBlock?.content ?? "";
                    const reviewedContent = patch.content ?? "";
                    const diffLines = renderDiffLines(originalContent, reviewedContent);

                    return (
                      <li key={patch.patch_id} className={styles.patchItem}>
                        <details open>
                          <summary className={styles.disclosureSummary}>
                            <span>{patch.patch_type}</span>
                            <span>{patch.patch_id}</span>
                          </summary>
                          <div className={styles.disclosureBody}>
                            <div className={styles.patchHeader}>
                              <span>
                                {patch.proposed_by.actor_type}:{patch.proposed_by.actor_id} on{" "}
                                <code>{patch.block_id}</code>
                              </span>
                              <div className={styles.patchMeta}>
                                <span
                                  className={`${styles.badge} ${styles[getPatchStatusTone(patch.status)]}`}
                                >
                                  {patch.status}
                                </span>
                                {isDesignPatch(patch) ? (
                                  <span className={`${styles.badge} ${styles.design}`}>
                                    Design Review
                                  </span>
                                ) : null}
                                <span className={styles.badge}>
                                  {getPatchRiskLabel(patch.patch_type)}
                                </span>
                              </div>
                            </div>
                            <span>
                              base v{patch.base_version}
                              {patch.confidence
                                ? ` · confidence ${Math.round(patch.confidence * 100)}%`
                                : ""}
                            </span>
                            <div className={styles.diffGrid}>
                              <article className={styles.diffCard}>
                                <h3>Current block</h3>
                                <div className={styles.diffBody}>
                                  {diffLines.map((line) => (
                                    <div
                                      key={`${patch.patch_id}-before-${line.key}`}
                                      className={`${styles.diffLine} ${
                                        line.tone === "changed" ? styles.diffRemoved : ""
                                      }`}
                                    >
                                      <span className={styles.diffMarker}>
                                        {line.tone === "changed" ? "-" : " "}
                                      </span>
                                      <code>{line.before || " "}</code>
                                    </div>
                                  ))}
                                </div>
                              </article>
                              <article className={styles.diffCard}>
                                <h3>Proposed block</h3>
                                <div className={styles.diffBody}>
                                  {diffLines.map((line) => (
                                    <div
                                      key={`${patch.patch_id}-after-${line.key}`}
                                      className={`${styles.diffLine} ${
                                        line.tone === "changed" ? styles.diffAdded : ""
                                      }`}
                                    >
                                      <span className={styles.diffMarker}>
                                        {line.tone === "changed" ? "+" : " "}
                                      </span>
                                      <code>{line.after || " "}</code>
                                    </div>
                                  ))}
                                </div>
                              </article>
                            </div>
                            <form action={decidePatchAction} className={styles.patchActionForm}>
                              <input type="hidden" name="document_id" value={patch.document_id} />
                              <input type="hidden" name="patch_id" value={patch.patch_id} />
                              <label>
                                Reviewed content
                                <textarea
                                  name="resolved_content"
                                  rows={5}
                                  defaultValue={patch.content ?? ""}
                                  className={styles.patchTextarea}
                                />
                              </label>
                              <div className={styles.patchActions}>
                                <button type="submit" name="decision" value="accept">
                                  Accept
                                </button>
                                <button type="submit" name="decision" value="cherry_pick">
                                  Cherry-pick
                                </button>
                                <button type="submit" name="decision" value="reject">
                                  Reject
                                </button>
                              </div>
                            </form>
                          </div>
                        </details>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <details className={styles.panel}>
                <summary className={styles.disclosureSummary}>
                  <span>Resolved patches</span>
                  <span>{resolvedPatches.length} completed</span>
                </summary>
                <div className={styles.disclosureBody}>
                  <ul className={styles.patchList}>
                    {resolvedPatches.map((patch) => (
                      <li key={patch.patch_id} className={styles.patchItem}>
                        <div className={styles.patchHeader}>
                          <strong>{patch.patch_type}</strong>
                          <span
                            className={`${styles.badge} ${styles[getPatchStatusTone(patch.status)]}`}
                          >
                            {patch.status}
                          </span>
                          {isDesignPatch(patch) ? (
                            <span className={`${styles.badge} ${styles.design}`}>
                              Design Review
                            </span>
                          ) : null}
                        </div>
                        <span>{patch.patch_id}</span>
                        <span>
                          {patch.proposed_by.actor_type}:{patch.proposed_by.actor_id} on{" "}
                          <code>{patch.block_id}</code>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>

              <details className={styles.panel}>
                <summary className={styles.disclosureSummary}>
                  <span>Audit trail</span>
                  <span>{auditEvents.length} recent events</span>
                </summary>
                <div className={styles.disclosureBody}>
                  <ul className={styles.patchList}>
                    {auditEvents.map((event) => (
                      <li key={event.event_id} className={styles.patchItem}>
                        <strong>{event.event_type}</strong>
                        <span>
                          {event.actor_type}:{event.actor_id}
                        </span>
                        <span>{event.created_at}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>

              {activeDocument ? (
                <section className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <h2>Clarification queue</h2>
                    <span>{clarifications.filter((c) => c.status === "open").length} open</span>
                  </div>
                  <ClarificationQueue
                    documentId={activeDocument.document_id}
                    initialClarifications={clarifications}
                  />
                </section>
              ) : null}

              {activeDocument ? (
                <section className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <h2>Acceptance tests</h2>
                    <span>
                      {acceptanceTests.filter((t) => t.status === "pass").length}/
                      {acceptanceTests.length} passing
                    </span>
                  </div>
                  <AcceptanceTestSection
                    documentId={activeDocument.document_id}
                    initialTests={acceptanceTests}
                  />
                </section>
              ) : null}
            </>
          ) : null}

          {activeStage === "export" ? (
            <ExportStage
              activeDocument={activeDocument}
              readinessReport={readinessReport}
              exportBundle={exportBundle}
              exportEndpoint={exportEndpoint}
              handoffBundle={handoffBundle}
              executionBrief={executionBrief}
              launchPacket={launchPacket}
              designHandoff={designHandoff}
              showcaseSourceId={showcaseSourceId}
              showcaseSourcePath={showcaseSourcePath}
              patches={patches}
              commentThreads={commentThreads}
              agentProposedPatches={agentProposedPatches}
              approvedAgentPatches={approvedAgentPatches}
              humanComments={humanComments}
              selectedTemplateId={selectedTemplateId}
              availableTemplates={availableTemplates}
              buildStageHref={buildStageHref}
              buildTemplateHref={buildTemplateHref}
            />
          ) : null}
        </section>
      </main>
    </div>
  );
}
