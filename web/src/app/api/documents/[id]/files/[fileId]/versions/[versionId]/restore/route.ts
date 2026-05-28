import { NextResponse } from "next/server";

import { restoreFileVersion } from "@/lib/specforge/store";
import { getCurrentWorkspaceAccess } from "@/lib/specforge/workspace-access";
import { withErrorHandling } from "@/lib/api-error-handler";

type Params = {
  params: Promise<{ id: string; fileId: string; versionId: string }>;
};

export async function POST(_request: Request, { params }: Params) {
  return withErrorHandling(
    async () => {
      const { fileId, versionId } = await params;
      const { workspaceId } = await getCurrentWorkspaceAccess();
      await restoreFileVersion(fileId, versionId, { workspaceId });
      return NextResponse.json({ success: true });
    },
    { action: "restore file version" },
  );
}