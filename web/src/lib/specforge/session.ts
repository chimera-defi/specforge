import { cookies } from "next/headers";

import { logger } from "../logger";
import {
  getWorkspaceMembershipByActorId,
  getWorkspaceMembershipForUser,
  listUserWorkspaces,
  listWorkspaceRecords,
  listWorkspaceMemberships,
} from "./store";
import { DEFAULT_WORKSPACE_RECORD, WORKSPACE_MEMBERS_SEED } from "./workspace-seed-data";
import {
  createWorkspaceSessionToken,
  verifyWorkspaceSessionToken,
  WORKSPACE_SESSION_MAX_AGE_SECONDS,
} from "./session-token";
export {
  createWorkspaceSessionToken,
  verifyWorkspaceSessionToken,
  type StoredWorkspaceSession,
} from "./session-token";

export type WorkspaceActor = {
  actor_id: string;
  actor_type: "human" | "agent";
  name: string;
  role: string;
  color: string;
  workspace_id: string;
};

export type WorkspaceSession = {
  authMode: "local" | "github" | "unauthenticated";
  actor: WorkspaceActor;
  githubLogin?: string;
  githubUrl?: string;
};

export type WorkspaceRecord = {
  workspace_id: string;
  name: string;
  plan: "demo" | "pilot";
};

const WORKSPACE_ACTOR_COOKIE = "specforge_actor_id";
const WORKSPACE_SESSION_COOKIE = "specforge_session";
const GITHUB_OAUTH_STATE_COOKIE = "specforge_github_oauth_state";
const GITHUB_OAUTH_NEXT_COOKIE = "specforge_github_oauth_next";
const ASSIST_TOOL_COOKIE = "specforge_assist_tool";

export type PreferredAssistTool = "auto" | "codex_cli" | "claude_cli" | "heuristic";

const workspaces: WorkspaceRecord[] = [DEFAULT_WORKSPACE_RECORD];

// Workspace members are imported from shared seed data to ensure consistency
// with database seeding in store.ts
const workspaceMembers = WORKSPACE_MEMBERS_SEED.map((member) => ({
  ...member,
  workspace_id: "ws_demo",
  githubLogin: member.github_login,
}));

function isSecureCookie() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.SPECFORGE_SECURE_COOKIES === "true"
  );
}

export function isGitHubAuthConfigured() {
  return Boolean(
    process.env.GITHUB_CLIENT_ID?.trim() &&
      process.env.GITHUB_CLIENT_SECRET?.trim() &&
      process.env.SPECFORGE_GITHUB_REDIRECT_URI?.trim(),
  );
}

export async function listWorkspaceActors() {
  try {
    return await listWorkspaceMemberships("ws_demo");
  } catch {
    return workspaceMembers;
  }
}

export function listWorkspaces() {
  return workspaces;
}

export async function listVisibleWorkspaces() {
  const session = await getCurrentWorkspaceSession();

  if (session.authMode === "github" && session.githubLogin) {
    try {
      const memberships = await listUserWorkspaces(session.githubLogin);
      if (memberships.length > 0) {
        return memberships;
      }
    } catch {
      // Fall back to static/local records below.
    }
  }

  try {
    return await listWorkspaceRecords();
  } catch {
    return listWorkspaces();
  }
}

export function getWorkspaceRecord(workspaceId: string) {
  return workspaces.find((workspace) => workspace.workspace_id === workspaceId) ?? workspaces[0]!;
}

export function listWorkspaceMembers(workspaceId: string) {
  return workspaceMembers.filter((member) => member.workspace_id === workspaceId);
}

export async function resolveWorkspaceActor(actorId?: string | null) {
  try {
    if (actorId) {
      const membership = await getWorkspaceMembershipByActorId(actorId);
      if (membership) {
        return membership;
      }
    }
  } catch {
    // Fall through to seeded local actors if the local store is unavailable.
  }

  const actors = await listWorkspaceActors();
  return actors[0] ?? workspaceMembers[0]!;
}

export async function resolveWorkspaceMemberForGitHubLogin(
  login?: string | null,
  workspaceId: string = "ws_demo",
) {
  if (!login) {
    return null;
  }

  try {
    return (
      (await getWorkspaceMembershipForUser(login, workspaceId)) ??
      workspaceMembers.find((actor) => actor.githubLogin === login) ??
      null
    );
  } catch {
    return workspaceMembers.find((actor) => actor.githubLogin === login) ?? null;
  }
}

function actorToSession(actor: WorkspaceActor, authMode: "local" | "github" | "unauthenticated", details?: {
  githubLogin?: string;
  githubUrl?: string;
}): WorkspaceSession {
  return {
    authMode,
    actor,
    githubLogin: details?.githubLogin,
    githubUrl: details?.githubUrl,
  };
}

export function isAuthSkipEnabled() {
  return process.env.NEXT_PUBLIC_SKIP_AUTH_OVERRIDE === "true";
}

export async function getCurrentWorkspaceSession() {
  const cookieStore = await cookies();

  if (isGitHubAuthConfigured() && !isAuthSkipEnabled()) {
    const rawSession = cookieStore.get(WORKSPACE_SESSION_COOKIE)?.value;

    if (rawSession) {
      try {
        const verified = verifyWorkspaceSessionToken(rawSession);
        const workspaceId = verified.workspace_id ?? "ws_demo";

        if (!verified.githubLogin) {
          throw new Error("Missing GitHub login in workspace session token");
        }

        const member = await resolveWorkspaceMemberForGitHubLogin(
          verified.githubLogin,
          workspaceId,
        );

        if (!member) {
          throw new Error(
            `GitHub user @${verified.githubLogin} no longer has membership in ${workspaceId}`,
          );
        }

        if (member.actor_id !== verified.actor_id) {
          throw new Error("Workspace session actor mismatch");
        }

        return actorToSession(
          { ...member, workspace_id: workspaceId, role: member.role },
          "github",
          {
            githubLogin: verified.githubLogin,
            githubUrl: verified.githubUrl,
          },
        );
      } catch (error) {
        // Session verification or membership resolution failed.
        // Delete the invalid session cookie to force re-authentication.
        logger.error(
          "Failed to verify workspace session token",
          error instanceof Error ? error : new Error(String(error)),
          {
            reason:
              "Possible: signature mismatch, malformed token, expired session, or membership drift",
          },
        );
        cookieStore.delete(WORKSPACE_SESSION_COOKIE);
      }
    }

    const actors = await listWorkspaceActors();
    return actorToSession(actors[0] ?? workspaceMembers[0]!, "unauthenticated");
  }

  const localActor = await resolveWorkspaceActor(cookieStore.get(WORKSPACE_ACTOR_COOKIE)?.value);
  return actorToSession(localActor, "local");
}

export async function getCurrentWorkspaceActor() {
  const session = await getCurrentWorkspaceSession();
  return session.actor;
}

export async function getPreferredAssistTool(): Promise<PreferredAssistTool> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ASSIST_TOOL_COOKIE)?.value;

  if (value === "codex_cli" || value === "claude_cli" || value === "heuristic") {
    return value;
  }

  return "auto";
}

export async function setPreferredAssistTool(tool: PreferredAssistTool) {
  const cookieStore = await cookies();
  cookieStore.set(ASSIST_TOOL_COOKIE, tool, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function setCurrentWorkspaceActor(actorId: string) {
  const actor = await resolveWorkspaceActor(actorId);
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_ACTOR_COOKIE, actor.actor_id, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return actor;
}

export async function setCurrentWorkspace(workspaceId: string) {
  const session = await getCurrentWorkspaceSession();

  if (session.authMode === "github" && session.githubLogin) {
    const member = await resolveWorkspaceMemberForGitHubLogin(
      session.githubLogin,
      workspaceId,
    );

    if (!member) {
      throw new Error(`User is not a member of workspace ${workspaceId}`);
    }

    await setGitHubWorkspaceSession({
      githubLogin: session.githubLogin,
      githubUrl: session.githubUrl,
      workspace_id: workspaceId,
      role: member.role,
    });

    return member;
  }

  const members = await listWorkspaceMemberships(workspaceId);
  const fallbackActor = members[0];

  if (!fallbackActor) {
    throw new Error(`Workspace ${workspaceId} has no available members`);
  }

  return setCurrentWorkspaceActor(fallbackActor.actor_id);
}

export async function setGitHubWorkspaceSession(input: {
  githubLogin: string;
  githubUrl?: string;
  workspace_id?: string;
  role?: string;
}) {
  const workspaceId = input.workspace_id ?? "ws_demo";
  const actor = await resolveWorkspaceMemberForGitHubLogin(input.githubLogin, workspaceId);

  if (!actor) {
    throw new Error(
      `GitHub user @${input.githubLogin} is not mapped to workspace ${workspaceId}`,
    );
  }

  const role = actor.role;
  const cookieStore = await cookies();
  cookieStore.set(
    WORKSPACE_SESSION_COOKIE,
    createWorkspaceSessionToken({
      actor_id: actor.actor_id,
      workspace_id: workspaceId,
      role,
      githubLogin: input.githubLogin,
      githubUrl: input.githubUrl,
      issuedAt: Date.now(),
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureCookie(),
      path: "/",
      maxAge: WORKSPACE_SESSION_MAX_AGE_SECONDS,
    },
  );
  return actorToSession(actor, "github", input);
}

export async function clearGitHubWorkspaceSession() {
  const cookieStore = await cookies();
  cookieStore.delete(WORKSPACE_SESSION_COOKIE);
}

export async function createGitHubOAuthState() {
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(GITHUB_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge: 60 * 10,
  });
  return state;
}

export function sanitizePostAuthRedirectPath(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  if (path.length > 2048) {
    return null;
  }

  try {
    const parsed = new URL(path, "http://localhost");

    if (parsed.origin !== "http://localhost") {
      return null;
    }

    if (parsed.pathname.startsWith("/api/auth/")) {
      return null;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export async function setGitHubOAuthNextPath(path: string | null | undefined) {
  const cookieStore = await cookies();
  const safePath = sanitizePostAuthRedirectPath(path);

  if (!safePath) {
    cookieStore.delete(GITHUB_OAUTH_NEXT_COOKIE);
    return;
  }

  cookieStore.set(GITHUB_OAUTH_NEXT_COOKIE, safePath, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge: 60 * 10,
  });
}

export async function consumeGitHubOAuthNextPath(defaultPath: string = "/workspace") {
  const cookieStore = await cookies();
  const rawPath = cookieStore.get(GITHUB_OAUTH_NEXT_COOKIE)?.value;
  cookieStore.delete(GITHUB_OAUTH_NEXT_COOKIE);

  return sanitizePostAuthRedirectPath(rawPath) ?? defaultPath;
}

export async function verifyGitHubOAuthState(state: string | null) {
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GITHUB_OAUTH_STATE_COOKIE)?.value ?? null;
  cookieStore.delete(GITHUB_OAUTH_STATE_COOKIE);

  if (!state || !expectedState || state !== expectedState) {
    throw new Error("Invalid GitHub OAuth state");
  }
}

export function getGitHubAuthorizationUrl(state: string) {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const redirectUri = process.env.SPECFORGE_GITHUB_REDIRECT_URI?.trim();

  if (!clientId || !redirectUri) {
    throw new Error("GitHub OAuth is not configured");
  }

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);
  return url.toString();
}
