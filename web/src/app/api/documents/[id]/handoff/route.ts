import { NextResponse } from "next/server";

import { exportDocumentBundle } from "@/lib/specforge/export";
import { listPlanSessions } from "@/lib/specforge/plan-session";
import { getDocument, listPatches } from "@/lib/specforge/store";
import {
  getCurrentWorkspaceAccess,
  getCurrentWorkspaceLaunchResource,
} from "@/lib/specforge/workspace-access";
import { withErrorHandling } from "@/lib/api-error-handler";

type Params = {
  params: Promise<{ id: string }>;
};

/** GET — existing starter-bundle handoff (unchanged) */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getCurrentWorkspaceLaunchResource(request, id, {
    eventType: "usage.handoff_viewed",
    select: (context) => context.starterBundle,
  });
  return NextResponse.json(result.body, { status: result.status });
}

/**
 * POST — emit the full handoff.json with export bundle + planning stage provenance.
 * This is the terminal output of the SpecForge workflow as designed in the spec.
 */
export async function POST(_request: Request, { params }: Params) {
  return withErrorHandling(
    async () => {
      const { id } = await params;
      const { workspaceId, actor } = await getCurrentWorkspaceAccess();

      const document = await getDocument(id, { workspaceId });
      if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }

      const patches = await listPatches(id, { workspaceId });
      const bundle = exportDocumentBundle(document, patches);

      // Collect the most recent active plan session (if any)
      const sessions = await listPlanSessions(id, workspaceId);
      const session = sessions[0] ?? null;

      const planningSession = session
        ? {
            session_id: session.session_id,
            stages: session.stages.map((stage) => ({
              name: stage.name,
              status: stage.status,
              patch_id: stage.patch_id ?? null,
              outputs: stage.outputs ?? null,
            })),
          }
        : {
            session_id: null,
            stages: [],
          };

      // Determine which idea validation stages are completed and include their outputs
      const demandRealityStage = session?.stages.find((s) => s.name === "demand-reality");
      const statusQuoStage = session?.stages.find((s) => s.name === "status-quo");
      const desperateSpecificityStage = session?.stages.find((s) => s.name === "desperate-specificity");
      const narrowestWedgeStage = session?.stages.find((s) => s.name === "narrowest-wedge");
      const observationStage = session?.stages.find((s) => s.name === "observation");
      const futureFitStage = session?.stages.find((s) => s.name === "future-fit");

      const exportBundle: Record<string, unknown> = {
        prd: bundle.files["PRD.md"],
        spec: bundle.files["SPEC.md"],
        tasks: bundle.files["TASKS.md"],
        agentSpec: bundle.files["agent_spec.json"],
      };

      // Include idea validation outputs in the export
      const ideaValidationOutputs: Record<string, unknown> = {};
      if (demandRealityStage?.status === "completed") {
        ideaValidationOutputs.demandReality = {
          answers: demandRealityStage.answers,
          outputs: demandRealityStage.outputs,
          question: demandRealityStage.question_prompt,
        };
      }
      if (statusQuoStage?.status === "completed") {
        ideaValidationOutputs.statusQuo = {
          answers: statusQuoStage.answers,
          outputs: statusQuoStage.outputs,
          question: statusQuoStage.question_prompt,
        };
      }
      if (desperateSpecificityStage?.status === "completed") {
        ideaValidationOutputs.desperateSpecificity = {
          answers: desperateSpecificityStage.answers,
          outputs: desperateSpecificityStage.outputs,
          question: desperateSpecificityStage.question_prompt,
        };
      }
      if (narrowestWedgeStage?.status === "completed") {
        ideaValidationOutputs.narrowestWedge = {
          answers: narrowestWedgeStage.answers,
          outputs: narrowestWedgeStage.outputs,
          question: narrowestWedgeStage.question_prompt,
        };
      }
      if (observationStage?.status === "completed") {
        ideaValidationOutputs.observation = {
          answers: observationStage.answers,
          outputs: observationStage.outputs,
          question: observationStage.question_prompt,
        };
      }
      if (futureFitStage?.status === "completed") {
        ideaValidationOutputs.futureFit = {
          answers: futureFitStage.answers,
          outputs: futureFitStage.outputs,
          question: futureFitStage.question_prompt,
        };
      }

      if (Object.keys(ideaValidationOutputs).length > 0) {
        exportBundle.ideaValidation = ideaValidationOutputs;
      }

      const handoff = {
        version: "1",
        documentId: id,
        workspaceId,
        generatedAt: new Date().toISOString(),
        generatedBy: { actor_type: actor.actor_type, actor_id: actor.actor_id },
        planningSession,
        exportBundle,
        executionBrief: bundle.files["AGENT_HANDOFF.md"] ?? null,
        launchPacket: bundle.files["FIRST_60_MINUTES.md"] ?? null,
        // Include original document metadata for complete traceability
        documentMetadata: document.metadata ?? {},
      };

      return NextResponse.json(handoff, { status: 200 });
    },
    { action: "emit handoff" },
  );
}
