# SpecForge Agent Guide

## Scope

This repo is the standalone SpecForge product plus the original idea/spec pack that drove the MVP.

Primary surfaces:
- `web/` for the Next.js app
- `collab-server/` for the Hocuspocus/Yjs collaboration service
- `desktop/` for the Tauri shell
- `cli/` for the terminal-native `specforge` command
- `skills/specforge/` for agent-facing skill prompts

Primary docs:
- `README.md`
- `EXECUTIVE_SUMMARY.md`
- `PRD.md`
- `SPEC.md`
- `ARCHITECTURE_DECISIONS.md`
- `TECH_STACK.md`
- `TASKS.md`
- `LOCAL_RUNBOOK.md`

## Working Rules

- Treat `SPEC.md`, `PRD.md`, and `ARCHITECTURE_DECISIONS.md` as the canonical product intent before changing behavior.
- Keep the web app, CLI, skills, and desktop wrapper aligned; avoid shipping workflow drift across surfaces.
- Prefer fixing root workspace scripts and docs when repo layout changes, not just leaf package commands.
- Do not commit local runtime state from `web/.data/`, `collab-server/.data/`, `.backups/`, or browser artifacts.
- Keep the original idea pack in place; it is part of the product handoff and validation story, not dead documentation.

## Verification

- `bun install`
- `bun run contracts:validate`
- `bun run lint`
- `bun run test`
- `bun run test:acceptance`
- `bun run build:web`
- `bun run test:cli`
- `bun run build:desktop`

<!-- SHARED_ATTRIBUTION_RULES_START -->
## Shared Attribution & Meta Learnings

- Commit author should be the active agent model identity.
- Commit trailer must include: `Co-authored-by: Chimera <chimera_defi@protonmail.com>`.
- PR description must include:
  - `**Agent:** <actual model name>`
  - `**Co-authored-by:** Chimera <chimera_defi@protonmail.com>`
- Never use placeholder model names; record the actual model used.
- Never push directly to `main`/`master`; use a feature branch and PR.
- Keep one task per PR for clear review and rollback.
- Verify before claiming complete: run relevant tests/lint/checks or explicitly note what was not run.
<!-- SHARED_ATTRIBUTION_RULES_END -->
