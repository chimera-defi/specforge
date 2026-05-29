import { NextRequest, NextResponse } from "next/server";

import {
  buildIdeaMarkdown,
  ideaToGuidedSpecInput,
  normalizeIdeaScaffold,
  type IdeaScaffold,
} from "@/lib/specforge/ideas-generator";
import {
  buildGuidedSpecMarkdown,
  buildGuidedSpecMetadata,
} from "@/lib/specforge/guided";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const scaffold = normalizeIdeaScaffold(body as Partial<IdeaScaffold>);
    
    // Generate the idea markdown
    const ideaMarkdown = buildIdeaMarkdown(scaffold);
    
    // Convert to guided spec input for spec generation
    const { guided, metadata } = ideaToGuidedSpecInput(scaffold);
    const specMarkdown = buildGuidedSpecMarkdown(guided);
    const specMetadata = buildGuidedSpecMetadata(guided);
    
    return NextResponse.json({
      idea: {
        title: scaffold.title,
        markdown: ideaMarkdown,
        metadata: {
          ...metadata,
          created_at: new Date().toISOString(),
        },
      },
      spec: {
        title: guided.title,
        markdown: specMarkdown,
        metadata: {
          ...specMetadata,
          ...metadata,
          created_at: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Failed to generate idea:", error);
    return NextResponse.json(
      { error: "Failed to generate idea" },
      { status: 500 }
    );
  }
}