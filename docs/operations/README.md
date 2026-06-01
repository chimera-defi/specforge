# SpecForge Operations Guide

This guide is for DevOps engineers and production operators managing SpecForge deployments.

## Overview

SpecForge is production-ready with enterprise-grade monitoring, observability, and resilience features.

## Quick Start

### Environment Variables

Required for production:

```bash
NODE_ENV=production
SPECFORGE_SESSION_SECRET=<strong-random-secret>
SPECFORGE_CSRF_SECRET=<strong-random-secret>
GITHUB_CLIENT_ID=<github-oauth-client-id>
GITHUB_CLIENT_SECRET=<github-oauth-client-secret>
SPECFORGE_GITHUB_REDIRECT_URI=<oauth-redirect-uri>
LOG_LEVEL=info
```

### Health Check

```bash
curl http://localhost:3000/api/health
```

Response includes:
- Overall health status
- Individual health checks
- Uptime
- Metrics summary
- Persistence status

## Monitoring

### Metrics Collection

Automatic metrics collection includes:
- API request counts and durations
- Database query performance
- Business metrics (documents, patches, sessions)
- Error rates
- Circuit breaker status

Access metrics via `/api/health` endpoint.

### Health Checks

The `/api/health` endpoint provides detailed status:
- **Database** - Connection health
- **Memory** - Usage percentage
- **Disk** - Available space

### Performance Monitoring

Automatic performance tracking:
- API request latency
- Database query time
- Memory usage
- Navigation timing (browser)

## Resilience

### Circuit Breakers

Prevents cascading failures by failing fast when services are unhealthy.

**Configuration:**
- Failure threshold: 5 failures
- Open timeout: 60 seconds
- Success threshold: 2 successes

### Retry Mechanism

Automatic retry with exponential backoff for transient failures.

**Configuration:**
- Max attempts: 3
- Initial delay: 1000ms
- Max delay: 30000ms
- Backoff multiplier: 2
- Jitter: ±25%

### Graceful Shutdown

Handles SIGTERM/SIGINT signals:
- 30-second shutdown timeout
- Runs shutdown handlers
- Flushes metrics
- Cleanup resources

## Deployment

### Build Optimization

Production build includes:
- Gzip compression
- SWC minification
- Image optimization (AVIF/WebP)
- Static asset caching (1 year)
- Source maps disabled
- React strict mode

### Caching Strategy

**Static Assets:**
- Cache-Control: `public, max-age=31536000, immutable`

**API Routes:**
- Cache-Control: `no-store, no-cache, must-revalidate`

## Scaling

### Rate Limiting

Current: In-memory rate limiting
Production: Migrate to Redis

```bash
REDIS_URL=redis://localhost:6379
```

### Database

For high-traffic deployments:
- Use Postgres instead of pglite
- Configure connection pooling
- Enable read replicas
- Set up automated backups

### Monitoring Backends

Configure external monitoring:

**Prometheus:**
```typescript
import { register } from 'prom-client';
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

**Datadog:**
```typescript
import { StatsD } from 'node-dogstatsd';
const dogstatsd = new StatsD();
dogstatsd.increment('api.requests', 1, ['endpoint:/api/documents']);
```

## Alerting

### Recommended Alerts

1. **Health Check Failure** (P0)
   - Trigger: `/api/health` returns unhealthy
   - Channel: PagerDuty, Slack

2. **High Error Rate** (P1)
   - Trigger: Error rate > 5% over 5 minutes
   - Channel: Slack

3. **Slow Response Time** (P2)
   - Trigger: P95 latency > 2 seconds
   - Channel: Slack

4. **Circuit Breaker Open** (P2)
   - Trigger: Any circuit breaker opens
   - Channel: Slack

5. **Memory Usage High** (P2)
   - Trigger: Memory usage > 90%
   - Channel: Slack

### Alert Configuration

See `.alerting.example.yml` for configuration template.

Configure channels:
- PagerDuty (critical)
- Slack (warning)
- Email (info)

## Incident Response

### Severity Levels

**P0 - Critical**
- Service completely down
- Data loss or corruption
- Security breach
- Response: < 15 minutes

**P1 - High**
- Major functionality broken
- Significant performance degradation
- Response: < 1 hour

**P2 - Medium**
- Minor functionality broken
- Moderate performance issues
- Response: < 4 hours

**P3 - Low**
- Cosmetic issues
- Minor performance impact
- Response: < 24 hours

### Runbook

1. Check health endpoint
2. Review metrics
3. Review logs
4. Take action:
   - Rollback if recent deployment
   - Scale up if resource constrained
   - Restart services

## Backup & Recovery

### Database Backups

For Postgres:
- Automated backups every 6 hours
- 30-day retention
- Point-in-time recovery

### Local Backup Script

```bash
bun run backup
```

Backs up:
- Web state
- Collab state
- Runner artifacts

## Security

### Security Headers

All security headers configured:
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Strict-Transport-Security

### Rate Limiting

API rate limits:
- Auth endpoints: 10 requests/minute
- Other endpoints: configurable

See [Security Policy](../security/README.md) for complete security documentation.

## Performance

### Bundle Analysis

```bash
cd web
bun run build
bun run analyze
```

### Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- API P95 latency: < 500ms
- Database P95 latency: < 100ms

### Optimization Tips

1. Enable CDN for static assets
2. Configure database read replicas
3. Use Redis for session storage
4. Enable HTTP/2
5. Optimize images (WebP/AVIF)

## Troubleshooting

### Common Issues

**Health check fails:**
- Check database connection
- Verify environment variables
- Review logs for errors

**High memory usage:**
- Check for memory leaks
- Review metrics
- Consider scaling

**Slow response times:**
- Check database queries
- Review circuit breaker status
- Check resource constraints

## Logging

### Log Levels

Configure via `LOG_LEVEL`:
- `DEBUG` - Detailed debugging
- `INFO` - General information (default production)
- `WARN` - Warnings
- `ERROR` - Errors
- `FATAL` - Critical errors

### Structured Logging

All logs are structured with context:
```json
{
  "level": "info",
  "message": "API request completed",
  "context": {
    "endpoint": "/api/documents",
    "method": "GET",
    "duration_ms": 123,
    "status": 200
  },
  "timestamp": "2026-06-01T00:00:00.000Z"
}
```

## Support

For production issues:
- Check this guide
- Review logs and metrics
- Check GitHub Issues
- Contact: chimera_defi@protonmail.com

## Additional Resources

- [Security Policy](../security/README.md)
- [Development Guide](../development/README.md)
- [Production Guide](../production/README.md)
- [PRODUCTION_OPS.md](../../PRODUCTION_OPS.md) - Detailed operations documentation