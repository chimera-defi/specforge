import { NextResponse } from "next/server";

import {
  listFileVersions,
} from "@/lib/specforge/store";
import { getCurrentWorkspaceAccess } from "@/lib/specforge/workspace-access";
import { withErrorHandling } from "@/lib/api-error-handler";

type Params = {
  params: Promise<{ id: string; fileId: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  return withErrorHandling(
    async () => {
      const { fileId } = await params;
      const { workspaceId } = await getCurrentWorkspaceAccess();
      const versions = await listFileVersions(fileId, { workspaceId });
      return NextResponse.json({ versions });
    },
    { action: "list file versions" },
  );
}