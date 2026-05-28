import { NextResponse } from "next/server";

import { createWorkspaceFile, listWorkspaceFiles } from "@/lib/specforge/store";
import { getCurrentWorkspaceAccess } from "@/lib/specforge/workspace-access";
import { withErrorHandling } from "@/lib/api-error-handler";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  return withErrorHandling(
    async () => {
      const { id } = await params;
      const { workspaceId } = await getCurrentWorkspaceAccess();
      const files = await listWorkspaceFiles(id, { workspaceId });
      return NextResponse.json({ files });
    },
    { action: "list workspace files" },
  );
}

export async function POST(request: Request, { params }: Params) {
  return withErrorHandling(
    async () => {
      const { id } = await params;
      const { workspaceId } = await getCurrentWorkspaceAccess();
      const body = await request.json();

      const file = await createWorkspaceFile(
        {
          document_id: id,
          filename: body.filename,
          content: body.content ?? "",
          file_type: body.file_type,
        },
        { workspaceId },
      );

      return NextResponse.json({ file }, { status: 201 });
    },
    { action: "create workspace file", resourceId: (await params).id },
  );
}