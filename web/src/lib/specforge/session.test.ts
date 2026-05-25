import { describe, expect, it } from "vitest";

import {
  createWorkspaceSessionToken,
  getGitHubAuthorizationUrl,
  resolveWorkspaceActor,
  resolveWorkspaceMemberForGitHubLogin,
  sanitizePostAuthRedirectPath,
  verifyWorkspaceSessionToken,
} from "./session";

describe("workspace session helpers", () => {
  it("maps configured GitHub logins to workspace members", async () => {
    const actor = await resolveWorkspaceMemberForGitHubLogin("chimera-defi");
    expect(actor?.actor_id).toBe("workspace_owner");
  });

  it("falls back to the default actor when the id is unknown", async () => {
    expect((await resolveWorkspaceActor("missing_actor")).actor_id).toBe("workspace_owner");
  });

  it("signs and verifies workspace sessions", () => {
    const nowMs = Date.now();
    const token = createWorkspaceSessionToken({
      actor_id: "workspace_owner",
      workspace_id: "ws_demo",
      role: "Workspace owner",
      githubLogin: "chimera-defi",
      githubUrl: "https://github.com/chimera-defi",
      issuedAt: nowMs,
    });

    expect(verifyWorkspaceSessionToken(token)).toMatchObject({
      actor_id: "workspace_owner",
      workspace_id: "ws_demo",
      role: "Workspace owner",
      githubLogin: "chimera-defi",
    });
  });

  it("rejects expired workspace sessions", () => {
    const token = createWorkspaceSessionToken({
      actor_id: "workspace_owner",
      workspace_id: "ws_demo",
      role: "Workspace owner",
      githubLogin: "chimera-defi",
      githubUrl: "https://github.com/chimera-defi",
      issuedAt: 1_700_000_000,
      exp: 1_700_000_010,
    });

    expect(() => verifyWorkspaceSessionToken(token)).toThrow("Expired workspace session");
  });

  it("accepts legacy sessions without explicit exp using issuedAt window", () => {
    const nowMs = Date.now();
    const token = createWorkspaceSessionToken({
      actor_id: "workspace_owner",
      workspace_id: "ws_demo",
      role: "Workspace owner",
      githubLogin: "chimera-defi",
      issuedAt: nowMs,
    });

    const parsed = verifyWorkspaceSessionToken(token);
    expect(parsed.exp).toBeTypeOf("number");
    expect(parsed.exp).toBeGreaterThan(Math.floor(nowMs / 1000));
  });

  it("builds a GitHub authorization URL when configured", () => {
    process.env.GITHUB_CLIENT_ID = "demo-client";
    process.env.SPECFORGE_GITHUB_REDIRECT_URI = "http://localhost:3000/api/auth/callback";

    const url = new URL(getGitHubAuthorizationUrl("test-state"));
    expect(url.hostname).toBe("github.com");
    expect(url.searchParams.get("client_id")).toBe("demo-client");
    expect(url.searchParams.get("state")).toBe("test-state");
  });

  it("sanitizes safe post-auth redirect paths", () => {
    expect(sanitizePostAuthRedirectPath("/workspace?stage=review")).toBe(
      "/workspace?stage=review",
    );
    expect(sanitizePostAuthRedirectPath("https://example.com/workspace")).toBeNull();
    expect(sanitizePostAuthRedirectPath("//evil.test/path")).toBeNull();
    expect(sanitizePostAuthRedirectPath("/api/auth/callback")).toBeNull();
  });
});
