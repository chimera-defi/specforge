# CDN Configuration Guide

This guide explains how to configure a Content Delivery Network (CDN) for SpecForge to improve performance and reduce latency.

## Supported CDNs

### Cloudflare

Cloudflare is recommended for its free tier, DDoS protection, and global edge network.

#### Setup

1. Sign up for Cloudflare at https://cloudflare.com
2. Add your domain to Cloudflare
3. Update your domain's nameservers to Cloudflare's nameservers
4. Wait for DNS propagation

#### Configuration

```javascript
// Cloudflare automatically caches static assets
// Configure cache rules in Cloudflare dashboard:

// Cache everything for 1 year
URL Pattern: *
Cache Level: Cache Everything
Edge Cache TTL: 1 year

// Bypass cache for API routes
URL Pattern: /api/*
Cache Level: Bypass
```

#### Page Rules

- **Cache HTML**: Cache static pages for 1 hour
- **Browser Cache TTL**: 4 hours
- **Always Online**: Serve cached content when origin is down

### AWS CloudFront

CloudFront is ideal if you're already using AWS services.

#### Setup

1. Create a CloudFront distribution
2. Set origin to your application URL
3. Configure cache behaviors
4. Add SSL certificate

#### Configuration

```javascript
// Cache behavior for static assets
Path Pattern: /_next/static/*
Origin: Your application
Cache Policy: CachingOptimized
Compress: Yes

// Cache behavior for API routes
Path Pattern: /api/*
Origin: Your application
Cache Policy: CachingDisabled
```

### Vercel Edge Network

If deploying to Vercel, the edge network is automatically configured.

#### Configuration

```javascript
// next.config.ts already includes cache headers
// Vercel automatically caches static assets at edge
```

## Cache Headers

SpecForge includes cache headers in `next.config.ts`:

- **Static assets**: `public, max-age=31536000, immutable` (1 year)
- **API routes**: `no-store, no-cache, must-revalidate` (no caching)
- **Next.js static**: `public, max-age=31536000, immutable` (1 year)

## Image Optimization

Images are automatically optimized and served in modern formats:

- AVIF (preferred)
- WebP (fallback)
- Original (last resort)

## Performance Tips

1. **Enable HTTP/2 and HTTP/3**
   - Cloudflare: Automatically enabled
   - CloudFront: Enable in distribution settings

2. **Minify CSS and JavaScript**
   - Next.js automatically minifies in production

3. **Enable Brotli compression**
   - Cloudflare: Automatically enabled
   - CloudFront: Enable in compression settings

4. **Use CDN for static assets**
   - Upload logos, favicons, and other static assets to CDN
   - Reference them with CDN URLs

5. **Configure cache invalidation**
   - Set up automatic cache invalidation on deployments
   - Use cache tags for selective invalidation

## Monitoring

Monitor CDN performance using:

- **Cloudflare Analytics**: Request counts, bandwidth, cached requests
- **CloudFront Reports**: Viewer requests, edge requests, errors
- **Vercel Analytics**: Edge requests, cache hit rate

## Troubleshooting

### Cache not invalidating

1. Check cache TTL settings
2. Manually purge cache in CDN dashboard
3. Add cache-busting query parameters

### Slow performance

1. Check CDN edge locations
2. Verify cache hit rate
3. Check origin server performance

### SSL/TLS issues

1. Ensure SSL certificate is valid
2. Check redirect configuration
3. Verify HSTS settings

## Environment Variables

```bash
# Cloudflare (optional)
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ZONE_ID=your_zone_id

# AWS CloudFront (optional)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
```

## Next Steps

After configuring CDN:

1. Test cache headers using curl or browser dev tools
2. Monitor cache hit rate
3. Set up alerts for high error rates
4. Configure automatic cache purging on deployments