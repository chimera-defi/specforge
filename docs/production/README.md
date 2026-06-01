# SpecForge Production Guide

SpecForge is a collaborative specification authoring platform with AI-assisted review and governed patch workflows.

## Overview

SpecForge enables teams to:
- **Create specifications** with guided wizards and AI assistance
- **Collaborate in real-time** with multiplayer editing and presence
- **Review changes** through governed patch proposals
- **Export deliverables** as deterministic bundles
- **Track progress** with acceptance tests and depth gates

## Quick Start

### Local Development

```bash
# Install dependencies
bun install

# Start the web app
cd web && bun run dev

# Start the collab server
cd collab-server && bun run dev
```

The web app will be available at `http://localhost:3000`.

### Production Deployment

See the [Operations Guide](../operations/README.md) for detailed deployment instructions.

## Key Features

### 1. Guided Spec Creation
- Structured wizard for specification authoring
- AI-assisted field population
- Competitive analysis integration
- Business model generation

### 2. Real-time Collaboration
- Multiplayer editing with Yjs CRDT
- Presence indicators and cursor tracking
- Comment threads and clarifications
- Change history and version snapshots

### 3. Governed Patch Workflow
- AI-generated patch proposals
- Human review and approval
- Stale patch detection
- Audit trail for all changes

### 4. Export & Handoff
- Deterministic export bundles
- Starter handoff packages
- Execution briefs
- Launch packets

### 5. Acceptance Testing
- Built-in acceptance test matrix
- Test status tracking
- Export blocking gates
- Test execution reports

## Architecture

SpecForge consists of:

- **Web App** (Next.js) - User interface and API
- **Collab Server** (Hocuspocus) - Real-time collaboration
- **Desktop App** (Tauri) - Native desktop wrapper
- **CLI** - Terminal-native specforge command

See [ARCHITECTURE_DECISIONS.md](../../spec/ARCHITECTURE_DECISIONS.md) for detailed architecture.

## Security

SpecForge implements enterprise-grade security:

- GitHub OAuth with state verification
- Comprehensive security headers
- Rate limiting and CSRF protection
- Input validation and sanitization
- SQL injection prevention
- Secrets management
- Audit logging

See [Security Policy](../security/README.md) for complete security documentation.

## Monitoring & Observability

Production deployments include:

- Metrics collection (API requests, latency, errors)
- Health checks (database, memory, disk)
- Performance monitoring
- Structured logging with log levels
- Circuit breakers for resilience
- Retry mechanisms for transient failures

See [Operations Guide](../operations/README.md) for monitoring setup.

## Pricing & Plans

SpecForge offers multiple workspace plans:

- **Free** - Limited documents and users
- **Pro** - Unlimited documents, 5 users
- **Team** - Unlimited documents, 20 users
- **Enterprise** - Custom limits and features

See the [pricing page](/pricing) for current pricing.

## Integration

SpecForge integrates with:

- **GitHub** - OAuth authentication
- **Claude** - AI assistance
- **Kimi** - AI assistance (via skill)
- **Stripe** - Billing (SaaS deployments)

## Support

For production issues:
- Check the [Operations Guide](../operations/README.md)
- Review [Security Policy](../security/README.md)
- Check [GitHub Issues](https://github.com/chimera-defi/specforge/issues)
- Contact: chimera_defi@protonmail.com

## Documentation

- [Development Guide](../development/README.md) - For developers
- [Operations Guide](../operations/README.md) - For operators
- [Security Policy](../security/README.md) - Security documentation
- [Product Spec](../../spec/SPEC.md) - Detailed product specification
- [PRD](../../spec/PRD.md) - Product requirements document

## License

See the project repository for license information.