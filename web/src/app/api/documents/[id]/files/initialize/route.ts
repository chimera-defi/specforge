import { NextResponse } from "next/server";

import {
  initializeDefaultWorkspaceFiles,
  getDocument,
} from "@/lib/specforge/store";
import { getCurrentWorkspaceAccess } from "@/lib/specforge/workspace-access";
import { withErrorHandling } from "@/lib/api-error-handler";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: Params) {
  return withErrorHandling(
    async () => {
      const { id } = await params;
      const { workspaceId } = await getCurrentWorkspaceAccess();
      
      const document = await getDocument(id, { workspaceId });
      if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }

      await initializeDefaultWorkspaceFiles(id, document, { workspaceId });
      
      return NextResponse.json({ success: true });
    },
    { action: "initialize workspace files", resourceId: (await params).id },
  );
}