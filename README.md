# SpecForge

> **Turn raw ideas into validated, implementation-ready specs — with full traceability.**

SpecForge is the complete workflow for product validation and spec creation. Start with structured idea validation, co-author specs in real-time with AI and teammates, then export governed handoff bundles that downstream builders can consume immediately.

**Why SpecForge?**
- **Validate before you build** — 5-stage structured review prevents wasted engineering effort
- **Never lose context** — every AI edit is a reviewable patch with full reasoning preserved
- **Ship with confidence** — governed handoff bundles include PRD, SPEC, TASKS, and execution context
- **Multiplayer by default** — real-time collaboration with humans and AI agents

**Repository:** https://github.com/chimera-defi/specforge

## What It Does

1. **Validate** — five structured review stages (problem framing, CEO review, engineering review, design, security) before any spec authoring. Each stage produces a governed patch proposal.
2. **Spec** — multiplayer canvas where humans and AI agents co-author in real time. Agent edits land as block-level patches; humans review and merge or reject.
3. **Hand off** — export PRD, SPEC, TASKS, agent brief, and execution context as a single bundle. No context reconstruction needed.

## Screenshots

![Mobile](web/artifacts/screenshots/specforge-demo-mobile.png) | ![Desktop](web/artifacts/screenshots/specforge-demo-home.png) | ![Pricing](web/artifacts/screenshots/specforge-pricing.png)

## Quick Start

```bash
bun install
bun run dev:web    # Landing page and workspace
bun run dev:collab  # Real-time collaboration server
```

Open http://localhost:3000

For the Docker-backed local stack, use the secure lifecycle helper. It binds
the app and collab server to loopback by default, keeps Redis/Postgres off the
host network, requires Redis auth, and checks for exposed data-service ports.

```bash
bun run security:local       # audit compose and live DB/broker listeners
bun run server:secure:cycle  # start, verify, then stop the secure local stack
bun run server:secure:up     # leave it running at http://127.0.0.1:3000
bun run server:secure:down   # stop SpecForge-owned local runtime services
```

## Demo Access

The demo workspace is open without login by default. To gate with credentials:

```bash
DEMO_USERNAME=specforge \
DEMO_PASSWORD=<your-password> \
bun run dev:web
```

For HTTP Basic Auth (browser popup), use:

```bash
SPECFORGE_DEMO_GATE_USERNAME=specforge \
SPECFORGE_DEMO_GATE_PASSWORD=<your-password> \
bun run dev:web
```

## Product Surfaces

| Surface | Purpose | Path |
| --- | --- | --- |
| Web app | Landing, pilot intake, multiplayer workspace | `web/` |
| Collab server | Hocuspocus/Yjs realtime editing | `collab-server/` |
| CLI | Terminal-native spec workflow | `cli/` |
| Desktop | Tauri wrapper | `desktop/` |
| Bridge | Hybrid hosted + local CLI | `bridge/` |
| Skills | Agent-facing workflow prompts | `skills/specforge/` |

## Documentation

**New Documentation Structure:**
- [📚 Documentation Index](docs/README.md) - Complete documentation overview
- [📦 Production Guide](docs/production/README.md) - For users and deployment
- [👨‍💻 Development Guide](docs/development/README.md) - For developers
- [🔧 Operations Guide](docs/operations/README.md) - For DevOps engineers
  - [Deployment Guide](docs/operations/DEPLOYMENT.md) - Docker, Kubernetes, Vercel deployment
  - [CDN Configuration](docs/operations/CDN.md) - CDN setup and optimization
  - [Load Testing](docs/operations/LOAD_TESTING.md) - Performance testing with k6
- [🔒 Security Policy](docs/security/README.md) - Security documentation
  - [Security Scanning](docs/security/SCANNING.md) - Automated security scanning

**Production Features:**
- ✅ Distributed tracing with OpenTelemetry
- ✅ API key management with rate limiting
- ✅ Email notification system (SendGrid, Mailgun, SES)
- ✅ Automated backup system
- ✅ Feature flags for gradual rollouts
- ✅ Background job processing
- ✅ Webhook infrastructure
- ✅ Improved session management
- ✅ Sentry error tracking
- ✅ Security scanning (Trivy, CodeQL, Gitleaks)
- ✅ Load testing with k6

**Legacy Spec Documentation (v1 Planning):**
- `spec/SPEC.md` — Product intent and binding feature behavior
- `spec/PRD.md` — Requirements and acceptance expectations
- `spec/ARCHITECTURE_DECISIONS.md` — Architecture choices
- `spec/TECH_STACK.md` — Stack decisions
- `spec/TASKS.md` — Current backlog
- `spec/LOCAL_RUNBOOK.md` — Local development and operations
- `web/DESIGN.md` — Design system for the web app

## Verification

```bash
bun run contracts:validate
bun run lint
bun run test
bun run test:acceptance
bun run build:web
```

Run `bun run test:cli` when touching `cli/`, `bun run build:desktop` when touching `desktop/`.

## Support

For issues or questions:
- Check the [Documentation Index](docs/README.md)
- Review [GitHub Issues](https://github.com/chimera-defi/specforge/issues)
- Contact: chimera_defi@protonmail.com
