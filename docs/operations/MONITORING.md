# Monitoring Dashboard Guide

This guide explains how to set up monitoring dashboards for SpecForge using Grafana, Datadog, or other monitoring tools.

## Metrics Overview

SpecForge exposes the following metrics:

### Application Metrics
- `specforge_api_requests_total` - Total API requests
- `specforge_api_request_duration_seconds` - API request duration
- `specforge_api_errors_total` - Total API errors
- `specforge_database_queries_total` - Database queries
- `specforge_database_query_duration_seconds` - Database query duration

### Business Metrics
- `specforge_documents_total` - Total documents created
- `specforge_patches_total` - Total patches created
- `specforge_patches_accepted_total` - Patches accepted
- `specforge_patches_rejected_total` - Patches rejected
- `specforge_sessions_active` - Active sessions
- `specforge_users_total` - Total users

### System Metrics
- `specforge_memory_usage_bytes` - Memory usage
- `specforge_disk_usage_bytes` - Disk usage
- `specforge_circuit_breaker_open` - Circuit breaker status
- `specforge_health_check_status` - Health check status (0=healthy, 1=degraded, 2=unhealthy)

## Grafana Dashboard

### Setup

1. Install Grafana:
```bash
# Using Docker
docker run -d -p 3000:3000 --name=grafana grafana/grafana

# Or download from https://grafana.com/grafana/download
```

2. Add Prometheus as a data source:
   - Go to Configuration → Data Sources
   - Add Prometheus
   - URL: `http://prometheus:9090`

3. Import dashboard (JSON provided below)

### Dashboard JSON

```json
{
  "dashboard": {
    "title": "SpecForge Monitoring",
    "panels": [
      {
        "title": "API Request Rate",
        "targets": [
          {
            "expr": "rate(specforge_api_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "API Error Rate",
        "targets": [
          {
            "expr": "rate(specforge_api_errors_total[5m])",
            "legendFormat": "{{error}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "API Latency (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(specforge_api_request_duration_seconds_bucket[5m]))"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Active Sessions",
        "targets": [
          {
            "expr": "specforge_sessions_active"
          }
        ],
        "type": "stat"
      },
      {
        "title": "Documents Created",
        "targets": [
          {
            "expr": "rate(specforge_documents_total[1h])"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Patch Acceptance Rate",
        "targets": [
          {
            "expr": "rate(specforge_patches_accepted_total[1h]) / rate(specforge_patches_total[1h])"
          }
        ],
        "type": "stat"
      },
      {
        "title": "Health Status",
        "targets": [
          {
            "expr": "specforge_health_check_status"
          }
        ],
        "type": "stat"
      },
      {
        "title": "Memory Usage",
        "targets": [
          {
            "expr": "specforge_memory_usage_bytes / 1024 / 1024 / 1024"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

## Datadog Dashboard

### Setup

1. Install Datadog Agent:
```bash
# Using Docker
docker run -d --name dd-agent \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /proc/:/host/proc/:ro \
  -v /sys/fs/cgroup/:/host/sys/fs/cgroup/:ro \
  -e DD_API_KEY=your-api-key \
  -e DD_SITE=datadoghq.com \
  datadog/agent:latest
```

2. Configure metrics in `datadog.yaml`:
```yaml
init_config:
instances:
  - prometheus_url: http://localhost:3000/metrics/prometheus
    namespace: specforge
    metrics:
      - specforge_*
```

3. Create dashboard in Datadog UI

### Recommended Panels

1. **Request Rate** - `rate(specforge_api_requests_total[5m])`
2. **Error Rate** - `rate(specforge_api_errors_total[5m])`
3. **Latency** - `histogram_quantile(0.95, rate(specforge_api_request_duration_seconds_bucket[5m]))`
4. **Active Sessions** - `specforge_sessions_active`
5. **Circuit Breaker Status** - `specforge_circuit_breaker_open`
6. **Health Status** - `specforge_health_check_status`

## Prometheus Setup

### Install Prometheus

```bash
# Using Docker
docker run -d -p 9090:9090 --name=prometheus \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### Configuration (`prometheus.yml`)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'specforge'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics/prometheus'
```

## Alerting

### Grafana Alerts

1. Go to Alerting → New alert rule
2. Set conditions:
   - **High Error Rate**: `rate(specforge_api_errors_total[5m]) > 0.05`
   - **High Latency**: `histogram_quantile(0.95, rate(specforge_api_request_duration_seconds_bucket[5m])) > 2`
   - **Health Check Failed**: `specforge_health_check_status > 0`
   - **Circuit Breaker Open**: `specforge_circuit_breaker_open == 1`

3. Configure notifications:
   - Email
   - Slack webhook
   - PagerDuty

### Prometheus Alerts

```yaml
groups:
  - name: specforge_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(specforge_api_errors_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(specforge_api_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "P95 latency is {{ $value }}s"

      - alert: HealthCheckFailed
        expr: specforge_health_check_status > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Health check failed"
          description: "Health status is {{ $value }}"
```

## Best Practices

1. **Set up alerts** for critical metrics
2. **Use dashboards** for visual monitoring
3. **Review metrics daily** in production
4. **Set up anomaly detection** for unusual patterns
5. **Archive metrics** for long-term trend analysis
6. **Create separate dashboards** for different audiences (dev, ops, business)
7. **Use annotations** to mark deployments and incidents
8. **Set up SLO/SLI dashboards** for service level objectives

## Troubleshooting

### Metrics not appearing
- Check Prometheus target is up
- Verify metrics endpoint is accessible
- Check firewall rules
- Review Prometheus logs

### Dashboard not updating
- Check data source connection
- Verify time range is correct
- Check query syntax
- Review Grafana logs

### Alerts not firing
- Check alert rule syntax
- Verify evaluation interval
- Check notification channels
- Review alert manager logs