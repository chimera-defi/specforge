# Load Testing Guide

This guide explains how to perform load testing on SpecForge using k6.

## Prerequisites

Install k6:
```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6

# Or download from https://k6.io/
```

## Running Load Tests

### Basic Load Test

```bash
# Test against local development server
k6 run load-test.js

# Test against staging/production
BASE_URL=https://staging.specforge.dev k6 run load-test.js
```

### Custom Configuration

Edit `load-test.js` to adjust:
- Number of virtual users
- Test duration
- Thresholds
- Endpoints to test

## Test Scenarios

### Smoke Test
Quick validation that the system works under light load:
```bash
k6 run --vus 5 --duration 30s load-test.js
```

### Load Test
Simulates normal traffic patterns:
```bash
k6 run load-test.js
```

### Stress Test
Finds breaking point:
```bash
k6 run --vus 500 --duration 5m load-test.js
```

### Spike Test
Tests sudden traffic spikes:
```bash
k6 run --vus 0 --duration 10s --execution-segment "0:30s" &
k6 run --vus 1000 --duration 30s --execution-segment "30s:60s" &
k6 run --vus 0 --duration 10s --execution-segment "60s:70s" &
```

## Metrics

Key metrics to monitor:
- **Response Time**: p95 should be < 500ms
- **Error Rate**: Should be < 1%
- **Throughput**: Requests per second
- **Memory Usage**: Server memory during test
- **CPU Usage**: Server CPU during test

## CI/CD Integration

Add to `.github/workflows/load-test.yml`:

```yaml
name: Load Test

on:
  pull_request:
    paths:
      - 'web/**'

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      - name: Start server
        run: |
          cd web
          bun install
          bun run build
          bun start &
          sleep 10
      - name: Run load test
        run: k6 run load-test.js
```

## Interpreting Results

### Good Results
- ✅ p95 < 500ms
- ✅ Error rate < 1%
- ✅ Stable throughput
- ✅ No memory leaks

### Bad Results
- ❌ p95 > 1000ms
- ❌ Error rate > 5%
- ❌ Throughput degradation
- ❌ Memory growing continuously

## Troubleshooting

### High Error Rate
- Check server logs for errors
- Verify database connections
- Check rate limiting settings
- Review circuit breaker status

### Slow Response Times
- Profile database queries
- Check caching effectiveness
- Review CDN configuration
- Check for N+1 queries

### Memory Leaks
- Monitor memory over time
- Check for unclosed connections
- Review event listener cleanup
- Check for circular references

## Best Practices

1. **Run tests in staging** before production
2. **Use realistic data** sizes
3. **Test at different times** of day
4. **Monitor server resources** during tests
5. **Document baseline metrics** for comparison
6. **Test after major changes** to codebase
7. **Include load tests in CI** for PR validation