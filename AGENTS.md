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

## Meta Learnings (2026-05-29)

### Testing Strategy
- **E2E Tests:** Use `critical-flows.spec.ts` (11/11 passing) for CI/CD gating
- **Complex Tests:** Complex workspace operations in `demo.spec.ts` have environment timing issues
- **Recommendation:** Separate smoke tests from integration tests; investigate complex test failures separately
- **Context:** Timeout fixes (60s → 120s) helped but didn't fully resolve all e2e test failures

### Refactoring Approach
- **Code Quality:** The codebase is already high-quality (no TODO/FIXME comments, strict TypeScript, no duplication)
- **Recommendation:** Defer refactoring unless specific need exists; focus on new features instead
- **Risk:** High-risk refactoring without clear benefit can introduce bugs
- **Context:** Large file refactoring (workspace/page.tsx - 1578 lines) deferred due to risk

### Security Monitoring
- **Posture:** Good - no hardcoded secrets, proper CSP, auth/authorization implemented
- **Dependencies:** 26 vulnerabilities in transitive dependencies (all at latest versions)
- **Recommendation:** Run `bun audit` weekly, `bun update` monthly; don't panic about transitive dep vulnerabilities
- **Context:** Vulnerabilities will be addressed by upstream maintainers; regular updates are sufficient

### Documentation Patterns
- **Value:** Comprehensive documentation (CHANGELOG, security audits, test status) provides context
- **Recommendation:** Document analysis even when no changes are made to prevent repeated investigation
- **Context:** Created 5 documentation files this session (CHANGELOG, E2E_TEST_STATUS, SECURITY_AUDIT, REFACTORING_ANALYSIS, SESSION_LEARNINGS)

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

<!-- kimi-delegate:begin -->
## Kimi Delegate Routing — MANDATORY

All Kimi subagent calls MUST route through the skill wrapper. Direct `pi --provider kimi-coding` calls are **prohibited** — they bypass telemetry, fallback, auth detection, and timeout scaling.

- **One-liner:** `kimi-delegate --task "..."`
- **Interactive:** `kimi-delegate --interactive`
- **Long path (fallback):** `./skills/kimi-delegate/scripts/delegate.py --task "..."`

**Why this matters:**
- Structured envelopes prevent vague handoffs
- Auto-scaling timeouts prevent hangs on large repos
- Auth error detection gives explicit resume steps instead of silent failures
- Codex fallback ensures tasks always complete
- Telemetry enables continuous improvement

**Bypassing the wrapper will be detected and reported.**

- Always produce an envelope first with `./skills/kimi-delegate/scripts/plan_prompt.py --task "..."`.
- Keep delegation scoped and include acceptance criteria.
- If Kimi fails, keep fallback enabled and inspect telemetry (`./skills/kimi-delegate/scripts/kimi_delegate_telemetry.py summary --days 14`).
<!-- kimi-delegate:end -->

<!-- devin-delegate:begin -->
## Devin Delegate Routing — MANDATORY

All Devin calls MUST route through the skill wrapper. Direct `devin --print` and `devin --task` calls are **prohibited** — they bypass envelope checks, fallback routing, clarification handling, and telemetry.

- **One-liner:** `devin-delegate --task "..."`
- **Interactive:** `devin-delegate --interactive`
- **Long path (fallback):** `./skills/devin-delegate/scripts/delegate.py --task "..."`

**Why this matters:**
- Structured envelopes prevent vague handoffs
- Codex then Claude guidance resolves many clarification loops before human escalation
- Provider fallback keeps execution moving when Devin fails
- Telemetry enables continuous improvement

**Bypassing the wrapper will be detected and reported.**

- Always produce an envelope first with `./skills/devin-delegate/scripts/plan_prompt.py --task "..."`.
- Keep delegation scoped and include acceptance criteria.
- If Devin asks for clarification, use Codex guidance first and Claude second before asking a human.
- Inspect telemetry regularly (`./skills/devin-delegate/scripts/devin_delegate_telemetry.py summary --days 14`).
<!-- devin-delegate:end -->
