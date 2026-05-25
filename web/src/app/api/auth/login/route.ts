import { NextResponse } from "next/server";

import {
  createGitHubOAuthState,
  getGitHubAuthorizationUrl,
  isGitHubAuthConfigured,
  setGitHubOAuthNextPath,
} from "@/lib/specforge/session";

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (!isGitHubAuthConfigured()) {
    return NextResponse.redirect(new URL("/?auth=local", request.url));
  }

  await setGitHubOAuthNextPath(url.searchParams.get("next"));
  const state = await createGitHubOAuthState();
  return NextResponse.redirect(getGitHubAuthorizationUrl(state));
}
