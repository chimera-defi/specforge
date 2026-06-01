import { NextResponse } from "next/server";
import { getMetricsCollector } from "@/lib/monitoring/metrics";
import { getHealthChecker } from "@/lib/monitoring/health";
import { getCircuitBreakerRegistry } from "@/lib/monitoring/circuit-breaker";

export async function GET() {
  const metrics = getMetricsCollector();
  const healthChecker = getHealthChecker();
  const circuitBreakerRegistry = getCircuitBreakerRegistry();

  const metricsSummary = metrics.getSummary();
  const healthStatus = await healthChecker.runChecks();
  const circuitBreakerStats = circuitBreakerRegistry.getAllStats();

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    uptime: healthChecker.getUptime(),
    metrics: metricsSummary,
    health: healthStatus,
    circuitBreakers: circuitBreakerStats,
  });
}