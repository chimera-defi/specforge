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

<!-- token-reduce:begin -->
## Token-Reduce Routing

- If file location is unknown, your first discovery command MUST be `./skills/token-reduce/scripts/token-reduce-paths.sh topic words`.
- Use the user’s literal nouns from the prompt in that first query (feature name, file stem, hook name, symbol).
- Use `./skills/token-reduce/scripts/token-reduce-snippet.sh topic words` only if one ranked excerpt is needed after the path list.
- Do not start repo discovery with `find .`, `ls -R`, `grep -R`, `rg --files .`, or broad `Glob` patterns.
- Use scoped `rg -g` and targeted reads only after helper output.
<!-- token-reduce:end -->

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
