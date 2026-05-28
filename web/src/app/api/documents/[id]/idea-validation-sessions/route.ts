import { NextResponse } from "next/server";

import { planSessionCreateSchema } from "@/lib/specforge/contracts";
import {
  createPlanSession,
  listPlanSessions,
} from "@/lib/specforge/plan-session";
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
      const sessions = await listPlanSessions(id, workspaceId);
      return NextResponse.json({ sessions });
    },
    { action: "list idea validation sessions" },
  );
}

export async function POST(request: Request, { params }: Params) {
  return withErrorHandling(
    async () => {
      const { id } = await params;
      const { workspaceId } = await getCurrentWorkspaceAccess();
      const body = await request.json();
      planSessionCreateSchema.parse({ ...body, document_id: id });

      // Default to startup mode if not specified
      const mode = body.mode || "startup";
      const session = await createPlanSession(id, workspaceId, mode);
      return NextResponse.json({ session }, { status: 201 });
    },
    { action: "create idea validation session", resourceId: (await params).id },
  );
}
