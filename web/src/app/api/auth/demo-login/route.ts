import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: Request) {
  const demoPassword = process.env.DEMO_PASSWORD?.trim();
  const demoUsername = process.env.DEMO_USERNAME?.trim() ?? "demo";

  if (!demoPassword) {
    return NextResponse.json({ error: "Demo auth not configured" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { username, password } = body as { username?: string; password?: string };

  if (username !== demoUsername || password !== demoPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const jar = await cookies();
  jar.set("specforge_demo_session", btoa(`${demoUsername}:${demoPassword}`), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
