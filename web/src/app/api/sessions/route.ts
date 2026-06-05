import { NextResponse } from "next/server";
import { getSessionManager, createSession } from "@/lib/session/manager";

/**
 * GET /api/sessions - Get session statistics
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const userId = searchParams.get("userId");

  const manager = getSessionManager();

  if (sessionId) {
    const session = manager.getSession(sessionId);
    return NextResponse.json({ session });
  }

  if (userId) {
    const sessions = manager.getUserSessions(userId);
    return NextResponse.json({ sessions });
  }

  const stats = manager.getStats();
  return NextResponse.json({ stats });
}

/**
 * POST /api/sessions - Create a new session
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { userId, workspaceId, ipAddress, userAgent, device, ttl } = body;

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    );
  }

  const sessionId = await createSession({
    userId,
    workspaceId,
    ipAddress,
    userAgent,
    device,
  }, ttl);

  return NextResponse.json({
    sessionId,
    status: "created",
  });
}

/**
 * DELETE /api/sessions - Revoke a session
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const userId = searchParams.get("userId");

  const manager = getSessionManager();

  if (userId && sessionId) {
    manager.revokeOtherSessions(userId, sessionId);
    return NextResponse.json({
      status: "other_sessions_revoked",
    });
  }

  if (userId) {
    manager.revokeAllUserSessions(userId);
    return NextResponse.json({
      status: "all_sessions_revoked",
    });
  }

  if (sessionId) {
    manager.revokeSession(sessionId);
    return NextResponse.json({
      sessionId,
      status: "revoked",
    });
  }

  return NextResponse.json(
    { error: "sessionId or userId is required" },
    { status: 400 }
  );
}
