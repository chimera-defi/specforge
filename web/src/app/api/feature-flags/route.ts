import { NextResponse } from "next/server";
import { getFeatureFlagManager, isFeatureEnabled, registerDefaultFlags } from "@/lib/feature-flags";
import type { FeatureFlagContext } from "@/lib/feature-flags";

// Initialize default flags
registerDefaultFlags();

/**
 * GET /api/feature-flags - Get all feature flags
 */
export async function GET(_request: Request) {
  const manager = getFeatureFlagManager();
  const flags = manager.getAllFlags();

  return NextResponse.json({
    flags,
    stats: manager.getStats(),
  });
}

/**
 * POST /api/feature-flags - Check if a flag is enabled
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { flagId, context } = body as { flagId: string; context?: FeatureFlagContext };

  if (!flagId) {
    return NextResponse.json(
      { error: "flagId is required" },
      { status: 400 }
    );
  }

  const enabled = isFeatureEnabled(flagId, context);

  return NextResponse.json({
    flagId,
    enabled,
  });
}