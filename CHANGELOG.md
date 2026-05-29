# Changelog

All notable changes to SpecForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Desktop Packaging** (Item #1)
  - macOS packaging targets: dmg, app
  - Windows packaging targets: msi, nsis
  - Icon generation script with ImageMagick support
  - Service log viewing Tauri commands (`get_service_logs`, `get_version`)
  - Desktop configuration panel with configurable ports and timeout
  - Enhanced sidecar logging with piped stdout/stderr capture
  - localStorage persistence for desktop settings

- **Local Alpha UX Polish** (Item #2)
  - Migrated acceptance test components to Tailwind classes
  - Migrated design review components to Tailwind classes
  - Removed 152 lines of inline CSS for better maintainability
  - Improved design system compliance across components

- **SaaS Scaffolding** (Item #3)
  - Complete Stripe billing provider abstraction
  - Billing provider switching via `BILLING_PROVIDER` env var
  - Full Stripe API integration (subscriptions, checkout, cancellation)
  - Webhook signature verification with timing tolerance
  - Comprehensive entitlements system with quotas and feature flags
  - Hosted ops surfaces (diagnostics, backups, incidents, summary)
  - Added missing Stripe environment variables to production template

- **Hybrid Bridge Model** (Item #4)
  - Local bridge HTTP server implementation (design spike)
  - Health check endpoint at `localhost:4323/health`
  - CLI proxy endpoint with validation and error handling
  - Graceful shutdown handling (SIGTERM, SIGINT)
  - Bridge documentation and package configuration
  - Diagnostics export already fully functional at `/api/ops/diagnostics-pack`

- **Ideas Generator Improvements** (Item #5)
  - Enhanced guided fields with specific examples and better placeholders
  - Added competitiveAnalysis and businessModel fields to IdeaScaffold
  - Added COMPETITIVE_ANALYSIS.md export artifact
  - Added BUSINESS_MODEL.md export artifact
  - Improved export bundle with 15 total artifacts

### Changed
- Updated README with bridge component documentation
- Added bridge startup instructions and health check URLs
- Updated TASKS.md to mark all priority items as complete

### Security
- Verified no hardcoded secrets in source code
- Confirmed CSP policies are appropriately scoped
- Bridge server binds to localhost only for security
- Stripe webhook signature verification with configurable tolerance

## [0.1.0] - 2026-05-29

### Added
- Initial SpecForge MVP release
- Multiplayer spec-creation workspace with Tiptap + Yjs + Hocuspocus
- Five-stage validation workflow (problem framing, CEO review, engineering review, design, security)
- Agent patch proposal system with block-level review
- Governed handoff bundle export (PRD, SPEC, TASKS, agent brief)
- Pilot access form with triage panel
- Terminal-native `specforge` CLI with guided wizard
- Desktop Tauri shell wrapper
- GitHub OAuth authentication
- Local-first persistence with pglite
- Collaboration server with real-time editing
- Design system with dark theme support
- Acceptance test matrix with inline CRUD operations
- Design handoff panel with feedback submission
- Billing provider abstraction (local/stripe)
- Workspace entitlements and quotas
- Ops diagnostics pack export
- Backup management system
- Incident tracking

### Security
- Workspace-scoped authorization (owner/editor/viewer roles)
- GitHub OAuth for pilot access
- Local dev bypass for MVP
- All API endpoints require authentication except `/auth/*`
- CSP policies for XSS prevention
- No eval/innerHTML in production code

---

## Version Policy

- **Major version**: Breaking changes to API, data models, or workflow
- **Minor version**: New features, backward-compatible changes
- **Patch version**: Bug fixes, documentation updates, internal improvements

## Release Notes

For detailed release information, see:
- `spec/TASKS.md` - Current backlog and work items
- `spec/SPEC.md` - Product specification
- `spec/ARCHITECTURE_DECISIONS.md` - Architectural decisions