# Production Operations Guide

## Overview

SpecForge is production-ready with enterprise-grade monitoring, observability, and resilience features built in.

## Monitoring & Observability

### Metrics Collection

The application automatically collects metrics for:
- API request counts and durations
- Database query performance
- Business metrics (documents created, patches accepted/rejected)
- User sessions
- Error rates

**Access metrics via:**
- `/api/health` endpoint returns metrics summary
- Metrics are auto-flushed every 60 seconds
- In production, configure a metrics backend (Prometheus, Datadog, etc.)

### Health Checks

The `/api/health` endpoint provides detailed health status:

```bash
curl http://localhost:3000/api/health
```

**Response includes:**
- Overall health status (healthy/degraded/unhealthy)
- Individual health checks (database, memory, disk)
- Uptime in seconds
- Persistence backend status
- Metrics summary
- Parity runner status

### Performance Monitoring

Automatic performance tracking for:
- API request latency
- Database query time
- Memory usage
- Navigation timing (browser)

## Resilience Features

### Circuit Breakers

Circuit breakers prevent cascading failures by failing fast when services are unhealthy.

**Configuration:**
- Default failure threshold: 5 failures
- Open timeout: 60 seconds
- Success threshold to close: 2 successes

**Usage:**
```typescript
import { getCircuitBreakerRegistry } from '@/lib/monitoring/circuit-breaker';

const breaker = getCircuitBreakerRegistry().getBreaker('database');
await breaker.execute(() => db.query(...), 'database');
```

### Retry Mechanism

Automatic retry with exponential backoff for transient failures.

**Configuration:**
- Max attempts: 3
- Initial delay: 1000ms
- Max delay: 30000ms
- Backoff multiplier: 2
- Jitter: enabled (±25%)

**Usage:**
```typescript
import { getRetryHandler } from '@/lib/monitoring/retry';

const retry = getRetryHandler();
const result = await retry.execute(async () => fetch(...), 'external-api');
```

### Graceful Shutdown

The application handles graceful shutdown on SIGTERM/SIGINT signals.

**Features:**
- 30-second shutdown timeout (configurable)
- Runs all registered shutdown handlers
- Flushes metrics before shutdown
- Cleanup monitoring resources

## Logging

### Log Levels

Configure via `LOG_LEVEL` environment variable:
- `DEBUG` - Detailed debugging information
- `INFO` - General informational messages (default in development)
- `WARN` - Warning messages
- `ERROR` - Error messages (default in production)
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

## Deployment

### Environment Variables

**Required for Production:**
```bash
NODE_ENV=production
SPECFORGE_SESSION_SECRET=<strong-random-secret>
SPECFORGE_CSRF_SECRET=<strong-random-secret>
GITHUB_CLIENT_ID=<github-oauth-client-id>
GITHUB_CLIENT_SECRET=<github-oauth-client-secret>
SPECFORGE_GITHUB_REDIRECT_URI=<oauth-redirect-uri>
```

**Optional:**
```bash
LOG_LEVEL=info  # Default: info in production, debug in development
```

### Build Optimization

The production build includes:
- Gzip compression
- SWC minification
- Image optimization (AVIF/WebP)
- Static asset caching (1 year)
- Source maps disabled
- React strict mode enabled

### Caching Strategy

**Static Assets:**
- Cache-Control: `public, max-age=31536000, immutable`
- Cached for 1 year

**API Routes:**
- Cache-Control: `no-store, no-cache, must-revalidate`
- No caching for dynamic content

## Scaling Considerations

### Rate Limiting

Current implementation uses in-memory rate limiting. For production scaling:

1. **Migrate to Redis:**
```typescript
// In rate-limit.ts, replace in-memory store with Redis
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
```

2. **Configure Redis:**
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

In production, configure external monitoring:

**Prometheus:**
```typescript
// Export metrics in Prometheus format
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

1. **Health Check Failure**
   - Alert when `/api/health` returns unhealthy status
   - Severity: Critical

2. **High Error Rate**
   - Alert when error rate > 5% over 5 minutes
   - Severity: Warning

3. **Slow Response Time**
   - Alert when P95 latency > 2 seconds
   - Severity: Warning

4. **Circuit Breaker Open**
   - Alert when any circuit breaker opens
   - Severity: Warning

5. **Memory Usage High**
   - Alert when memory usage > 90%
   - Severity: Warning

### Alert Channels

Configure alerts to:
- PagerDuty (critical)
- Slack (warning)
- Email (info)

## Incident Response

### Incident Severity Levels

**P0 - Critical:**
- Service completely down
- Data loss or corruption
- Security breach
- Response time: < 15 minutes

**P1 - High:**
- Major functionality broken
- Significant performance degradation
- Response time: < 1 hour

**P2 - Medium:**
- Minor functionality broken
- Moderate performance issues
- Response time: < 4 hours

**P3 - Low:**
- Cosmetic issues
- Minor performance impact
- Response time: < 24 hours

### Runbook

1. **Check health endpoint**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Review metrics**
   - Check error rates
   - Check latency
   - Check circuit breaker status

3. **Review logs**
   - Look for error patterns
   - Check for recent deployments

4. **Take action**
   - Rollback if recent deployment
   - Scale up if resource constrained
   - Restart services if needed

## Backup & Recovery

### Database Backups

For Postgres deployments:
- Automated backups every 6 hours
- 30-day retention
- Point-in-time recovery enabled

### Local Backup Script

Use the existing backup script:
```bash
bun run backup
```

Backs up:
- Web state
- Collab state
- Runner artifacts

## Security

### Security Headers

All security headers are configured in `next.config.ts`:
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

See `SECURITY.md` for full security documentation.

## Performance Optimization

### Bundle Analysis

Analyze bundle size:
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

## Support

For production issues:
- Check this guide first
- Review logs and metrics
- Check GitHub Issues
- Contact: chimera_defi@protonmail.com