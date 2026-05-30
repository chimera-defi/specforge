# Changelog

All notable changes to SpecForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Desktop Packaging** — macOS (dmg, app) and Windows (msi, nsis) targets with service log viewing
- **SaaS Scaffolding** — Complete Stripe billing integration with entitlements system
- **Hybrid Bridge Model** — Local bridge for hybrid hosted + local CLI access
- **Ideas Generator** — Enhanced fields (competitiveAnalysis, businessModel) with comprehensive export artifacts
- **Form Validation** — Required field validation with inline errors and accessibility support
- **Export Artifacts** — Enhanced COMPETITIVE_ANALYSIS.md and BUSINESS_MODEL.md templates
- **UX & Security** — Loading states, input sanitization, CSP headers, security hardening

### Changed
- Updated README with bridge documentation
- Marked all priority TASKS.md items as complete

### Security
- Verified no hardcoded secrets
- Configured CSP policies appropriately
- Bridge binds to localhost only
- Stripe webhook signature verification

## [0.1.0] - 2026-05-29

### Added
- Initial SpecForge MVP release
- Multiplayer spec-creation workspace (Tiptap + Yjs + Hocuspocus)
- Five-stage validation workflow (problem, CEO, engineering, design, security)
- Agent patch proposal system with block-level review
- Governed handoff bundle export (PRD, SPEC, TASKS, agent brief)
- Pilot access form with triage panel
- Terminal-native `specforge` CLI with guided wizard
- Desktop Tauri shell wrapper
- GitHub OAuth authentication
- Local-first persistence with pglite
- Collaboration server with real-time editing
- Design system with dark theme support
- Acceptance test matrix with inline CRUD
- Design handoff panel with feedback
- Billing provider abstraction (local/stripe)
- Workspace entitlements and quotas
- Ops diagnostics, backups, incident tracking

### Security
- Workspace-scoped authorization (owner/editor/viewer)
- GitHub OAuth for pilot access
- Local dev bypass for MVP
- API authentication except `/auth/*`
- CSP policies for XSS prevention
- No eval/innerHTML in production code

---

## Version Policy

- **Major version**: Breaking changes to API, data models, or workflow
- **Minor version**: New features, backward-compatible changes
- **Patch version**: Bug fixes, documentation updates, internal improvements

## Release Notes

For detailed release information, see:
- `spec/TASKS.md` — Current backlog
- `spec/SPEC.md` — Product specification
- `spec/ARCHITECTURE_DECISIONS.md` — Architectural decisions