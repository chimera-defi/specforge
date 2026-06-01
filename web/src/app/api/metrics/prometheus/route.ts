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

  // Convert to Prometheus format
  let prometheusMetrics = "";

  // Counter metrics
  for (const [key, value] of Object.entries(metricsSummary.summary)) {
    const [name, ...tags] = key.split(":");
    const tagString = tags.length > 0 ? tags.join(",") : "";
    prometheusMetrics += `specforge_${name}{${tagString}} ${value}\n`;
  }

  // Histogram metrics
  for (const [key, value] of Object.entries(metricsSummary.histograms)) {
    const [name, ...tags] = key.split(":");
    const tagString = tags.length > 0 ? tags.join(",") : "";
    prometheusMetrics += `specforge_${name}_count{${tagString}} ${value.count}\n`;
    prometheusMetrics += `specforge_${name}_sum{${tagString}} ${value.avg * value.count}\n`;
    prometheusMetrics += `specforge_${name}_min{${tagString}} ${value.min}\n`;
    prometheusMetrics += `specforge_${name}_max{${tagString}} ${value.max}\n`;
  }

  // Health check metrics
  const healthStatusValue = healthStatus.status === "healthy" ? 1 : 0;
  prometheusMetrics += `specforge_health_status ${healthStatusValue}\n`;
  prometheusMetrics += `specforge_uptime_seconds ${healthChecker.getUptime()}\n`;

  // Circuit breaker metrics
  for (const [context, stats] of Object.entries(circuitBreakerStats)) {
    const stateValue = stats.state === "closed" ? 0 : 1;
    prometheusMetrics += `specforge_circuit_breaker_state{context="${context}"} ${stateValue}\n`;
    prometheusMetrics += `specforge_circuit_breaker_failures{context="${context}"} ${stats.failures}\n`;
    prometheusMetrics += `specforge_circuit_breaker_successes{context="${context}"} ${stats.successes}\n`;
  }

  return new NextResponse(prometheusMetrics, {
    headers: {
      "Content-Type": "text/plain; version=0.0.4",
    },
  });
}