import { NextResponse } from "next/server";

import { readBacklogState } from "@/lib/specforge/backlog";
import { getRequestId, logServerEvent } from "@/lib/specforge/observability";
import {
  getPersistenceConfig,
  listDocuments,
  listWorkspaceRecords,
} from "@/lib/specforge/store";
import { withErrorHandling } from "@/lib/api-error-handler";
import { getHealthChecker } from "@/lib/monitoring/health";
import { getMetricsCollector } from "@/lib/monitoring/metrics";
import { getPerformanceMonitor } from "@/lib/monitoring/performance";

export async function GET(request: Request) {
  return withErrorHandling(
    async () => {
      const requestId = getRequestId(request.headers);
      const perfMonitor = getPerformanceMonitor();

      // Measure health check duration
      const duration = await perfMonitor.measure('health_check', async () => {
        const persistenceConfig = getPersistenceConfig();
        const [workspaces, documents, backlogState] = await Promise.all([
          listWorkspaceRecords(),
          listDocuments(),
          readBacklogState(),
        ]);

        const healthChecker = getHealthChecker();
        const healthResult = await healthChecker.runChecks();

        const metrics = getMetricsCollector();
        const metricsSummary = metrics.getSummary();

        logServerEvent("health_check", {
          request_id: requestId,
          persistence_backend: persistenceConfig.backend,
          workspaces: workspaces.length,
          documents: documents.length,
          remaining_backlog: backlogState.remainingCount,
          health_status: healthResult.status,
        });

        return {
          persistenceConfig,
          workspaces,
          documents,
          backlogState,
          healthResult,
          metricsSummary,
        };
      });

      return NextResponse.json({
        status: "ok",
        service: "specforge-web",
        request_id: requestId,
        checked_at: new Date().toISOString(),
        duration_ms: duration,
        uptime: getHealthChecker().getUptime(),
        persistence: {
          ...duration.persistenceConfig,
          workspaces: duration.workspaces.length,
          documents: duration.documents.length,
        },
        health: duration.healthResult,
        parity: {
          active_phase: duration.backlogState.activeSection,
          remaining_count: duration.backlogState.remainingCount,
          review_due: duration.backlogState.reviewDue,
        },
        metrics: duration.metricsSummary,
      });
    },
    { action: "health_check" }
  );
}
