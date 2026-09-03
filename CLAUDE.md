# SpecForge — Claude Code Instructions

> **Primary agent guide:** `AGENTS.md`
> **Design system:** `web/DESIGN.md`
> **Global rules source:** `Etc-mono-repo/.cursorrules` + `Etc-mono-repo/CLAUDE.md`
> **Spec archive:** `spec/` — all v1 planning and design docs

---

## Session Start (Every Time)

```bash
# 1. Sync with remote
git fetch origin && git rebase origin/main

# 2. Branch before touching anything
git checkout -b feat/<short-slug>

# 3. Read canonical intent before changing product behavior
# spec/SPEC.md · spec/PRD.md · spec/ARCHITECTURE_DECISIONS.md
```

**Never push directly to `main`.** The `.githooks/pre-push` hook blocks it.
Install hooks once per clone: `git config core.hooksPath .githooks`

---

## Session End (Every Time)

```bash
# Verify
cd web && bun run contracts:validate && bun run lint && bun run build:web
# (add bun run test, bun run test:acceptance when test suite is green)

# Commit, push, PR
git add <specific files>    # never git add -A blindly
git commit -m "feat(scope): description [Agent: Claude Sonnet 4.6]"
# trailer: Co-authored-by: Chimera <chimera_defi@protonmail.com>
git push -u origin feat/<slug>
gh pr create  # use required PR template below
```

---

## Context Compaction Prevention

Use sub-agents to protect main context:

| Situation | Use |
|-----------|-----|
| >5 files to read | `Task(subagent_type="Explore")` |
| Unsure where info lives | `Task(subagent_type="Explore")` |
| Pattern search across codebase | `Task(subagent_type="Explore")` |
| Complex multi-step research | `Task(subagent_type="general-purpose")` |

Hooks enforce: Read >300 lines, Grep content dump, Glob >50 files — all warn or block.

---

## Token Efficiency (Auto-Active)

1. **QMD BM25 first:** `qmd search "topic" -n 5 --files` (99% savings vs naive reads)
2. **Scoped search:** `rg -g "*.tsx" pattern` not broad directory scans
3. **Targeted reads:** offset + limit, not whole files
4. **Parallel tool calls** when there are no dependencies between reads
5. **Diffs over full file reposts**
6. No preambles, no rule restatement, no "Great question!" filler

Benchmarked savings: 89% concise · 99% QMD vs naive · 33% targeted reads

---

## Verification Checklist

Run from **repo root** (not inside `web/`):

```bash
bun install
bun run contracts:validate   # whenever contracts.ts changes
bun run lint
bun run build:web            # NOT "bun run build"
bun run test
bun run test:acceptance
bun run test:cli             # if cli/ was touched
bun run build:desktop        # if desktop/ was touched
```

---

## Attribution — Enforced by CI

**Commit format:**
```
feat(scope): description [Agent: Claude Sonnet 4.6]

Body explaining what and why.

Co-authored-by: Chimera <chimera_defi@protonmail.com>
```

**PR description (all three sections required — CI validates):**
```markdown
**Agent:** Claude Sonnet 4.6
**Co-authored-by:** Chimera <chimera_defi@protonmail.com>

## Summary
- What changed and why

## Original Request
> [User's exact prompt]

## Changes Made
- Change 1
- Change 2

## Verification
- [x] bun run build:web passes
- [x] bun run lint passes
- [x] No hallucinated results
- [x] Multi-pass review done
```

CI checks:
- `.github/workflows/pr-attribution-check.yml` — validates PR description
- `.github/workflows/commit-message-check.yml` — validates commit headers on PR commits

**Who goes where:**

| Location | Field | Value |
|----------|-------|-------|
| Commit author | name | AI model identity |
| Commit trailer | Co-authored-by | `Chimera <chimera_defi@protonmail.com>` |
| PR `**Agent:**` | model name | `Claude Sonnet 4.6` |
| PR `**Co-authored-by:**` | human | `Chimera <chimera_defi@protonmail.com>` |

Never include session links (`https://claude.ai/code/session_*`).

---

## Hallucination Prevention

After any subagent completes, verify before reporting:

- [ ] Output files exist (`ls -lh` confirms)
- [ ] File timestamps within minutes of execution
- [ ] JSON/config parses without errors
- [ ] All required fields populated (not empty)
- [ ] Metrics traceable in source code
- [ ] No dead code or debug artifacts

Red flags: empty JSON fields, timestamp mismatches, claimed metrics without source code.

---

## File Organisation

```
specforge/
├── README.md          # project overview
├── AGENTS.md          # primary agent working rules
├── CLAUDE.md          # this file — Claude Code instructions
├── spec/              # all v1 planning docs (45 files)
│   ├── SPEC.md        # canonical product spec ← read before changing behavior
│   ├── PRD.md         # requirements ← read before changing behavior
│   ├── ARCHITECTURE_DECISIONS.md ← read before changing behavior
│   ├── TASKS.md       # current work items
│   ├── TECH_STACK.md
│   ├── LOCAL_RUNBOOK.md
│   ├── FRONTEND_VISION.md
│   ├── UX_PRINCIPLES.md
│   └── ...            # 37 more v1 planning docs
├── web/               # Next.js app
│   └── DESIGN.md      # authoritative design system
├── collab-server/     # Hocuspocus/Yjs collab service
├── desktop/           # Tauri shell
├── cli/               # terminal-native specforge command
└── .githooks/         # commit-msg + pre-push validation hooks
```

**Never litter root** with generated markdown — use `artifacts/` or `spec/`.

---

## Multi-Pass Review (Before Every PR)

1. **Functionality** — does it do what was asked? Edge cases handled?
2. **Style** — follows `web/DESIGN.md` token system, no hardcoded colors
3. **Hallucinations** — verify every claimed output actually exists
4. **Attribution** — commit header `[Agent: ...]` + `Co-authored-by` trailer

---

## Meta Learnings (Frontend/UI)

### Tailwind + Design Tokens
- **Never hardcode hex values** — use `--sf-*` tokens or Tailwind theme classes
- **Theme classes map:** `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`
- Hardcoded colors break theming. All tokens live in `web/src/app/globals.css`
- The `@theme {}` block generates Tailwind utilities; `:root {}` keeps `--sf-*` for CSS modules

### Component Patterns
- Use `cn()` from `web/src/lib/utils.ts` for conditional Tailwind classes
- `lucide-react` for all icons — tree-shakeable, consistent stroke weight
- Sticky nav uses `backdrop-blur-sm bg-background/90` — not opaque
- Patch review mockup in hero demonstrates UX Principle #2 directly

### UX Principles (from spec/UX_PRINCIPLES.md)
1. Collaboration state always visible
2. Agent actions **reviewable before apply** — by default
3. Human intent primary; agent work is assistive
4. Minimize context switching
5. Full traceability: requirement → patch → decision → artifact
6. Confidence/risk signals on generated edits
7. Fast convergence, not maximal feature density
8. Explicit, recoverable, low-drama failure states

### Code Quality & Refactoring (2026-05-29)
- **Code quality is high:** No TODO/FIXME comments, strict TypeScript, no duplication patterns
- **Refactoring caution:** Don't refactor for the sake of refactoring; focus on new features
- **Risk assessment:** Large file refactoring (workspace/page.tsx - 1578 lines) carries high risk
- **Recommendation:** Defer refactoring unless specific need exists; code quality already excellent

### Testing Strategy (2026-05-29)
- **E2E test complexity:** Complex workspace operations have environment timing issues
- **Smoke tests:** Use `critical-flows.spec.ts` (11/11 passing) for CI/CD gating
- **Complex tests:** Investigate separately; don't let them block deployment
- **Timeout configuration:** Increasing timeouts (60s → 120s) helped but didn't fully resolve issues

### Deps & CI (2026-06-08)
- PR CI fires 8 checks: Secret Scan, tauri, web-and-cli, CodeQL Analysis (javascript), Container Image Scan, Dependency Vulnerability Scan, CodeQL, Trivy — all passed after next/react/zod/vitest/pg non-major bumps.
- `bun install` (not `--frozen-lockfile`) required when bumping pinned deps; commit `web/package.json` + root `bun.lock` together.
- Monday deps skip list: typescript 5.9.3→6.x (major), eslint 9→10 (major), @types/node 20→25 (major) — defer until explicit migration.

<!-- kimi-delegate-claude:begin -->
## Kimi Delegation (enforced)

NEVER write `pi --provider kimi-coding`. Always use `kd --task "..."` instead.

Wrong: `pi --provider kimi-coding "summarize this"`
Right: `kd --task "summarize this"`

The wrapper handles auth, timeouts, fallback, and telemetry automatically.
<!-- kimi-delegate-claude:end -->
