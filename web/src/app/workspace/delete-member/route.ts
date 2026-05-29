import { NextResponse } from "next/server";

import { deleteWorkspaceMemberAction } from "../../actions";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const _result = await deleteWorkspaceMemberAction(formData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete member error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete member" },
      { status: 500 }
    );
  }
}