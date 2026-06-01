# SpecForge Documentation

Welcome to the SpecForge documentation. This guide is organized by audience and purpose.

## Quick Links

- **Production Deployment** → [Production Guide](./production/README.md)
- **Security** → [Security Policy](./security/README.md)
- **Development** → [Development Guide](./development/README.md)
- **Operations** → [Operations Guide](./operations/README.md)

## Documentation Structure

### 📦 Production (`docs/production/`)
For product managers, designers, and anyone deploying or using SpecForge.

- [Production Guide](./production/README.md) - Overview and getting started
- [Security Policy](../SECURITY.md) - Security features and best practices
- [Operations Guide](../PRODUCTION_OPS.md) - Production operations and monitoring

### 👨‍💻 Development (`docs/development/`)
For developers contributing to SpecForge.

- [Development Guide](./development/README.md) - Development setup and workflow
- [Agent Guide](../AGENTS.md) - AI agent configuration and usage
- [Claude Instructions](../CLAUDE.md) - Claude Code agent instructions
- [Local Runbook](../spec/LOCAL_RUNBOOK.md) - Local development procedures

### 🔧 Operations (`docs/operations/`)
For DevOps engineers and production operators.

- [Operations Guide](./operations/README.md) - Production operations overview
- [Deployment Guide](./operations/DEPLOYMENT.md) - Deployment procedures
- [Monitoring Guide](./operations/MONITORING.md) - Monitoring and observability
- [Alerting Guide](./operations/ALERTING.md) - Alerting configuration
- [Incident Response](./operations/INCIDENT_RESPONSE.md) - Incident response procedures

### 🔒 Security (`docs/security/`)
For security engineers and auditors.

- [Security Policy](./security/README.md) - Security overview
- [Security Audit](./security/SECURITY_AUDIT.md) - Security audit results
- [OWASP Coverage](./security/OWASP.md) - OWASP Top 10 coverage

## Legacy Documentation

The following directories contain legacy documentation kept for reference:

- **`spec/`** - Original v1 planning documents (read-only reference)
  - [SPEC.md](../spec/SPEC.md) - Product specification
  - [PRD.md](../spec/PRD.md) - Product requirements document
  - [ARCHITECTURE_DECISIONS.md](../spec/ARCHITECTURE_DECISIONS.md) - Architecture decisions
  - [TASKS.md](../spec/TASKS.md) - Current work items
  - [TECH_STACK.md](../spec/TECH_STACK.md) - Technology stack
  - [FRONTEND_VISION.md](../spec/FRONTEND_VISION.md) - Frontend vision
  - [UX_PRINCIPLES.md](../spec/UX_PRINCIPLES.md) - UX principles

- **`spec/archive/`** - Archived planning documents (historical reference)

- **`artifacts/`** - Session artifacts and temporary outputs

- **`archive/`** - Archived documentation

## Getting Started

### For Users
1. Read the [Production Guide](./production/README.md)
2. Review the [Security Policy](./security/README.md)

### For Developers
1. Read the [Development Guide](./development/README.md)
2. Follow the [Local Runbook](../spec/LOCAL_RUNBOOK.md)

### For Operators
1. Read the [Operations Guide](./operations/README.md)
2. Review the [Deployment Guide](./operations/DEPLOYMENT.md)

## Contributing to Documentation

Documentation should be:
- **Clear** - Easy to understand for the target audience
- **Concise** - Get to the point quickly
- **Current** - Keep documentation up to date with code changes
- **Organized** - Use the established structure

When adding new documentation:
1. Choose the appropriate directory (production/development/operations/security)
2. Follow the existing naming conventions
3. Update this README with a link to the new document
4. Update relevant section indexes

## Documentation Standards

- Use Markdown for all documentation
- Include code examples with syntax highlighting
- Use proper heading hierarchy (H1, H2, H3)
- Add tables of contents for long documents
- Include diagrams where helpful (Mermaid, ASCII art)
- Keep language consistent and professional
- Update changelog when documentation changes significantly

## Questions?

For questions about documentation:
- Check the appropriate guide in this directory
- Review the spec documents in `spec/`
- Check the [README](../README.md) for project overview