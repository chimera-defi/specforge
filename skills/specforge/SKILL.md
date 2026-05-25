---
name: specforge
description: Use when a user wants to turn a rough product idea into a thoroughly planned, collaboratively authored spec bundle. This skill drives the full SpecForge workflow — 5-stage G-Stack idea audit (Act 0), Sprint Planning stages (Act 1), guided spec generation (Act 2), section-level iteration, and build-agnostic handoff. Includes idea pack generation meeting the IDF depth standard (executive summary, financial model, risk register, competitor analysis, UX pack, validation plan). Works in CLI/TUI for solo or agent-native flows; directs to the web workspace for multiplayer collaboration.
---

# SpecForge Skill

Use this skill when the user wants:
- a rough prompt expanded into a structured spec brief
- to walk through planning stages (discovery, CEO review, engineering review, design review, security review) before writing a spec
- guided follow-up questions before committing to a PRD
- terminal-native spec creation through SpecForge
- to iterate on a specific section of a spec with AI assistance
- a path from idea → Sprint Planning → PRD/SPEC/TASKS → handoff JSON
- explicit UX coverage for frontend design, wireframes, or UI guidelines before build kickoff

## Workflow overview

SpecForge is a three-act workflow:
- **Act 0 (Idea Audit):** optional 5-stage G-Stack idea audit. Runs before any spec authoring. Pressure-tests the concept across problem, strategy, engineering, design, and security lenses. Each stage produces a governed patch proposal. All stages skippable. Run with `/specforge-idea-audit` or `bun run specforge -- audit`.
- **Act 1 (Sprint Planning):** optional planning stages inspired by the G-Stack sprint discipline. Each stage produces a governed patch proposal. All stages skippable. Run via CLI (`bun run specforge -- plan`) or the web workspace.
- **Act 2 (Spec Generation):** guided spec wizard, multiplayer CRDT editing, governed patch review, export bundle.
- **Handoff:** `handoff.json` with export bundle + stage provenance. Build tooling agnostic.

## Idea Pack Depth Standard (IDF)

An idea is "spec-ready" only when all of the following exist. Use `/specforge-idea-audit` to check and fill gaps.

| Artifact | CLI flag | Description |
|---|---|---|
| `EXECUTIVE_SUMMARY` | auto | One-line thesis, wedge, top 3 risks |
| `PRD` | auto | Users, scope, GTM, business model, kill criteria |
| `SPEC` | auto | Architecture, components, data model, APIs, NFRs, phase plan |
| `ARCHITECTURE_DIAGRAMS` | auto | Value flow and failure/recovery diagrams |
| `VALIDATION_PLAN` | `--validation` | Pilot plan with measurable go/no-go thresholds |
| `RISK_REGISTER` | `--risk` | Legal, policy, abuse, reliability risks |
| `FINANCIAL_MODEL` | `--financial` | Pricing logic, cost drivers, margin assumptions |
| `AGENT_HANDOFF` | auto | Implementation readiness criteria |
| UX Pack | `--ux` | Principles, user flows, frontend vision, wireframes |
| `COMPETITOR_ANALYSIS` | `--competitors` | Named alternatives and why you still win |
| `COMPETITOR_MATRIX` | `--competitors` | Capability scoring against 3–5 named competitors |

## Idea Audit questioning behavior

If any required IDF artifacts are missing, ask focused questions before generating. Priority categories:
1. **User and pain** — who pays, who uses, what is urgent right now
2. **Scope and constraints** — MVP boundary, excluded features, timeline
3. **Economics** — pricing logic, cost drivers, margin assumptions
4. **Architecture** — control points, failure handling, trust boundaries
5. **GTM** — first segment, acquisition channel, validation signal
6. **Risks** — legal/policy/abuse/reliability failure modes
7. **Competition** — named alternatives, why you still win, where you are weaker

## End-of-iteration recap (after each idea audit pass)

1. Current one-paragraph product thesis
2. What changed from prior iteration
3. Open decisions requiring user input
4. Current go/no-go posture and why
5. UX drift note: what changed in user journey and why

## Exit gates before spec generation

Before advancing from Idea Audit → Spec Generation, SpecForge checks:
1. **Spec completeness gate** — all IDF artifacts present (or explicitly deferred)
2. **Consistency gate** — no contradiction across PRD/SPEC/financial/risk docs
3. **Validation gate** — pilot plan has measurable pass/fail thresholds
4. **Alignment gate** — user confirms final summary matches intended vision
5. **UX gate** — user flows and wireframes cover primary path and failure states

## Default flow

### Run the full automated pipeline (recommended)

```bash
bun run specforge -- autoplan --title "<title>"
# or interactively:
bun run specforge -- tui
```

`autoplan` runs: idea audit → CEO review → eng review → design review → security review → spec generation → handoff. Any stage can be skipped.

### Starting fresh with planning

0. Run the idea audit (Act 0) to validate the concept before planning:
```bash
bun run specforge -- audit --title "<title>" --idea "<rough idea>"
# or a specific stage:
bun run specforge -- audit --stage office-hours      # problem framing + 6 forcing questions
bun run specforge -- audit --stage ceo-review        # 10-star vision, scope decisions
bun run specforge -- audit --stage eng-review        # architecture, failure modes
bun run specforge -- audit --stage design-review     # design system, interaction model
bun run specforge -- audit --stage security-review   # OWASP threat model
```

1. Walk through sprint planning stages:
```bash
bun run specforge -- plan
# or a specific stage:
bun run specforge -- plan --stage discovery
bun run specforge -- plan --stage ceo-review
bun run specforge -- plan --stage eng-review
bun run specforge -- plan --stage design-review
bun run specforge -- plan --stage security-review
# skip a stage:
bun run specforge -- plan --skip security-review
# machine-readable output for agent use:
bun run specforge -- plan --json
```

2. After planning, move to spec generation:
```bash
bun run specforge -- init --title "<title>" --problem "<problem>"
```

### Jumping straight to spec (no planning)

```bash
bun run specforge -- init --title "<title>" --problem "<problem>"
```

If the brief is fuzzy, ask only the minimum missing questions:
- who is the user?
- what outcome matters most?
- what is explicitly out of scope?
- what constraints are real?
- what is the primary surface and what are the key screens or failure states?

### Interactive TUI (recommended for terminal-native flows)

```bash
bun run specforge -- tui   # includes plan, init, iterate, status, handoff menu
```

### Iterating on a specific section

```bash
bun run specforge -- iterate --section <block-id> --message "make user segments more specific"
# interactive (prompts for message):
bun run specforge -- iterate --section <block-id>
```

### Runtime status and backlog

```bash
bun run specforge -- status --json
bun run specforge -- context --json
bun run specforge -- backlog
```

### Handoff

```bash
bun run specforge -- handoff         # emit handoff.json with export bundle + stage provenance
bun run specforge -- handoff --json  # machine-readable
```

### Post-Spec Design Review

After exporting, designers can review the UX Pack and submit structured feedback:

1. In the Export stage, open the Design Handoff Panel
2. Review the UX Pack preview and design system outputs
3. Enter design feedback in the feedback box — submits as a governed patch
4. Switch to the Decide stage to review/accept the design patch
5. Re-export to get updated handoff.json with design feedback incorporated

Or via API:

```bash
curl -X POST /api/documents/:id/design-feedback \
  -H "Content-Type: application/json" \
  -d '{"feedback": "Primary CTA needs more contrast", "section": "ux-pack"}'
```

### Multiplayer / web workspace

When the user needs live multiplayer collaboration (all planning stages and spec editing support multiplayer):
- `/workspace` for the live web app
- the stable document share URL after the draft exists

## Related skills

- `/specforge-idea-audit` — runs the full Act 0 G-Stack idea audit (or a named stage)
- `/specforge-plan` — runs the full Act 1 planning pipeline (or a named stage)
- `/specforge-handoff` — emits the final handoff.json
- `/gstack-design-review` — runs the 7-pass G-Stack design review against the live site or UX plan
- `/shadcn-design` — applies shadcn design system principles and token review

## Rules

- Prefer the local CLI/TUI for solo or agent-native flows.
- Prefer the web workspace for multiplayer collaboration, review, comments, and patch decisions.
- All planning stages are optional — never hard-block on a skipped stage.
- Do not invent missing requirements; use a short clarifying question instead.
- Treat the first output as a minimum extensible product spec, not a final perfect spec.
- If the product has a human-facing interface, require a UX Pack:
  - primary surface
  - key screens
  - failure states
  - responsive expectations
  - or an explicit `API-only` / `CLI-only` note if no GUI is needed
- Treat the UX Pack as part of the canonical spec, not optional polish.
- When local Codex CLI or Claude Code CLI is available, the web assist flow can reuse that runtime; browser clients should not receive provider secrets.
- For design review, use `/gstack-design-review` against the UX Plan or live site. The skill runs 7 passes (IA, Interaction States, User Journey, AI Slop Risk, Design System, Responsive/A11y, Unresolved Decisions) and edits the plan directly.
- For component-level design, use `/shadcn-design` for token system review and component pattern validation.
- Both design skills can be run independently of the spec workflow or as part of `/specforge-plan --stage design-review`.

## Verification

```bash
bun run verify
bun run test:cli
```
