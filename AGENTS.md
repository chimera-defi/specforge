# SpecForge Agent Guide

> **Also read:** `CLAUDE.md` — session workflow, attribution format, token efficiency, meta learnings

## Scope

This repo is the standalone SpecForge product plus the original idea/spec pack that drove the MVP.

Primary surfaces:
- `web/` — Next.js app
- `collab-server/` — Hocuspocus/Yjs collaboration service
- `desktop/` — Tauri shell
- `cli/` — terminal-native `specforge` command
- `skills/specforge/` — agent-facing skill prompts

Spec archive (v1 planning docs): `spec/` — 45 files, read-only reference

## Canonical Docs (Read Before Changing Product Behavior)

| Doc | Path | Purpose |
|-----|------|---------|
| Product spec | `spec/SPEC.md` | Binding feature intent |
| Requirements | `spec/PRD.md` | Binding requirements |
| Architecture | `spec/ARCHITECTURE_DECISIONS.md` | Binding architectural choices |
| Tech stack | `spec/TECH_STACK.md` | Stack decisions |
| Work items | `spec/TASKS.md` | Current backlog |
| Runbook | `spec/LOCAL_RUNBOOK.md` | Local dev procedures |
| Frontend vision | `spec/FRONTEND_VISION.md` | UI/IA model |
| UX principles | `spec/UX_PRINCIPLES.md` | Interaction constraints |
| Design system | `web/DESIGN.md` | Colors, typography, components |

## Working Rules

- Read `spec/SPEC.md`, `spec/PRD.md`, and `spec/ARCHITECTURE_DECISIONS.md` before changing behavior.
- Keep the web app, CLI, skills, and desktop wrapper aligned; avoid workflow drift across surfaces.
- Prefer fixing root workspace scripts when repo layout changes, not just leaf package commands.
- Do not commit local runtime state: `web/.data/`, `collab-server/.data/`, `.backups/`, browser artifacts.
- Keep `spec/` in place; it is part of the product handoff and validation story, not dead docs.

## Session Workflow

```bash
# Start of session
git fetch origin && git rebase origin/main
git checkout -b feat/<short-slug>    # ALWAYS branch — never work on main

# End of session
cd web && bun run contracts:validate && bun run lint && bun run build:web
git add <specific files>
git commit  # see CLAUDE.md for required format
git push -u origin feat/<slug>
gh pr create  # see CLAUDE.md for required PR template
```

**Hooks:** Install once per clone: `git config core.hooksPath .githooks`
- `.githooks/commit-msg` — validates header format and Co-authored-by trailer
- `.githooks/pre-push` — blocks direct pushes to `main`/`master`

## Verification

Run from repo root:

```bash
bun install
bun run contracts:validate   # when contracts.ts changes
bun run lint
bun run test
bun run test:acceptance
bun run build:web            # canonical build command (not "bun run build")
bun run test:cli             # when cli/ changes
bun run build:desktop        # when desktop/ changes
```
