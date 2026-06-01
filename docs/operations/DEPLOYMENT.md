# Deployment Guide

This guide covers deploying SpecForge to production environments.

## Table of Contents

- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Vercel Deployment](#vercel-deployment)
- [Environment Configuration](#environment-configuration)
- [Post-Deployment Verification](#post-deployment-verification)

## Docker Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space

### Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/chimera-defi/specforge.git
cd specforge
```

2. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your values
```

3. **Build and start:**
```bash
docker-compose up -d
```

4. **Verify deployment:**
```bash
curl http://localhost:3000/api/health
```

### Docker Compose Services

| Service | Port | Purpose |
|---------|------|---------|
| web | 3000 | Next.js web application |
| collab-server | 1234 | Hocuspocus collab server |
| redis | 6379 | Rate limiting and caching |
| postgres | 5432 | PostgreSQL database (optional) |

### Production Docker Deployment

For production, use the production profile:

```bash
docker-compose --profile postgres up -d
```

This includes PostgreSQL for production-grade persistence.

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f web

# Restart a service
docker-compose restart web

# Update and rebuild
docker-compose up -d --build

# Scale web service
docker-compose up -d --scale web=3
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.16+)
- kubectl configured
- helm 3.x (optional)

### Deployment Steps

1. **Create namespace:**
```bash
kubectl create namespace specforge
```

2. **Create secrets:**
```bash
kubectl create secret generic specforge-secrets \
  --from-literal=session-secret='your-secret-here' \
  --from-literal=csrf-secret='your-secret-here' \
  --from-literal=github-client-id='your-client-id' \
  --from-literal=github-client-secret='your-client-secret' \
  -n specforge
```

3. **Deploy using Helm:**
```bash
helm install specforge ./helm/specforge \
  --namespace specforge \
  --set image.tag=latest \
  --set replicas=3
```

### Kubernetes Manifests

Example deployment manifest:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: specforge-web
  namespace: specforge
spec:
  replicas: 3
  selector:
    matchLabels:
      app: specforge-web
  template:
    metadata:
      labels:
        app: specforge-web
    spec:
      containers:
      - name: web
        image: specforge/web:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: SPECFORGE_SESSION_SECRET
          valueFrom:
            secretKeyRef:
              name: specforge-secrets
              key: session-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: specforge-web
  namespace: specforge
spec:
  selector:
    app: specforge-web
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Vercel Deployment

### Prerequisites

- Vercel account
- GitHub repository connected to Vercel

### Deployment Steps

1. **Connect repository:**
   - Go to Vercel dashboard
   - Click "New Project"
   - Import from GitHub

2. **Configure environment variables:**
   - Go to Settings > Environment Variables
   - Add all required variables from `.env.example`

3. **Deploy:**
   - Vercel will automatically deploy on push to main branch
   - Or deploy manually from the dashboard

### Vercel Configuration

Create `vercel.json` in the root:

```json
{
  "buildCommand": "cd web && bun run build",
  "outputDirectory": "web/.next",
  "installCommand": "bun install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

## Environment Configuration

### Required Variables

```bash
NODE_ENV=production
SPECFORGE_SESSION_SECRET=<strong-random-secret-32-chars>
SPECFORGE_CSRF_SECRET=<strong-random-secret-32-chars>
GITHUB_CLIENT_ID=<github-oauth-client-id>
GITHUB_CLIENT_SECRET=<github-oauth-client-secret>
SPECFORGE_GITHUB_REDIRECT_URI=<https://your-domain.com/api/auth/callback>
```

### Optional Variables

```bash
LOG_LEVEL=info
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost:5432/specforge
```

### Generating Secrets

Generate strong secrets using:

```bash
# Generate session secret
openssl rand -base64 32

# Generate CSRF secret
openssl rand -base64 32
```

## Post-Deployment Verification

### Health Check

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "health": {
    "status": "healthy",
    "checks": {
      "database": {
        "status": "pass"
      },
      "memory": {
        "status": "pass"
      }
    }
  }
}
```

### Metrics Verification

```bash
curl https://your-domain.com/api/metrics/export
```

### Smoke Tests

1. **Load homepage:**
```bash
curl -I https://your-domain.com/
```

2. **Test authentication:**
```bash
curl -I https://your-domain.com/login
```

3. **Test API health:**
```bash
curl https://your-domain.com/api/health
```

### Monitoring Setup

1. **Configure Prometheus:**
```yaml
scrape_configs:
  - job_name: 'specforge'
    metrics_path: '/api/metrics/prometheus'
    static_configs:
      - targets: ['your-domain.com']
```

2. **Configure alerts:**
```yaml
groups:
  - name: specforge
    rules:
      - alert: SpecForgeDown
        expr: up{job="specforge"} == 0
        for: 1m
        annotations:
          summary: "SpecForge is down"
```

## Rollback Procedure

### Docker Rollback

```bash
# Stop current version
docker-compose down

# Deploy previous version
docker-compose up -d --build --no-cache
```

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/specforge-web -n specforge

# Rollback to previous version
kubectl rollout undo deployment/specforge-web -n specforge
```

### Vercel Rollback

1. Go to Vercel dashboard
2. Select the project
3. Go to Deployments
4. Click "..." on the deployment to rollback
5. Select "Rollback"

## Scaling

### Horizontal Scaling

**Docker:**
```bash
docker-compose up -d --scale web=3
```

**Kubernetes:**
```bash
kubectl scale deployment specforge-web --replicas=5 -n specforge
```

**Vercel:**
- Configure in vercel.json or dashboard

### Vertical Scaling

Increase resource limits in deployment configuration.

## Backup Strategy

### Database Backups

For PostgreSQL:
```bash
# Automated backups
kubectl apply -f k8s/postgres-backup-cronjob.yaml
```

### Configuration Backups

Backup environment variables and secrets:
```bash
kubectl get secrets specforge-secrets -n specforge -o yaml > backup-secrets.yaml
```

## Troubleshooting

### Common Issues

**Container won't start:**
- Check logs: `docker-compose logs web`
- Verify environment variables
- Check resource limits

**Health check failing:**
- Check database connectivity
- Verify Redis connection
- Review application logs

**High memory usage:**
- Check for memory leaks
- Review metrics
- Consider scaling up

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug docker-compose up
```

## Support

For deployment issues:
- Check [Operations Guide](./README.md)
- Review [Security Policy](../security/README.md)
- Check GitHub Issues
- Contact: chimera_defi@protonmail.com