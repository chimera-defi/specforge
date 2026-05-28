import { NextResponse } from "next/server";

import {
  deleteWorkspaceFile,
  getWorkspaceFile,
  updateWorkspaceFile,
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
      const file = await getWorkspaceFile(fileId, { workspaceId });

      if (!file) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      return NextResponse.json({ file });
    },
    { action: "get workspace file" },
  );
}

export async function PATCH(request: Request, { params }: Params) {
  return withErrorHandling(
    async () => {
      const { fileId } = await params;
      const { workspaceId } = await getCurrentWorkspaceAccess();
      const body = await request.json();

      const file = await updateWorkspaceFile(
        fileId,
        {
          content: body.content,
          content_json: body.content_json,
        },
        { workspaceId },
      );

      return NextResponse.json({ file });
    },
    { action: "update workspace file" },
  );
}

export async function DELETE(_request: Request, { params }: Params) {
  return withErrorHandling(
    async () => {
      const { fileId } = await params;
      const { workspaceId } = await getCurrentWorkspaceAccess();
      await deleteWorkspaceFile(fileId, { workspaceId });
      return NextResponse.json({ success: true });
    },
    { action: "delete workspace file" },
  );
}