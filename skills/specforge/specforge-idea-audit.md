---
name: specforge-idea-audit
description: Use when a user wants to pressure-test a rough idea before writing any spec. Runs the full G-Stack Act 0 audit (Office Hours → CEO Review → Eng Review → Design Review → Security Review). Each stage produces structured outputs that become governed patch proposals in Act 1. Checks all IDF depth standard artifacts. All stages skippable. Works in CLI/TUI for solo flows; multiplayer in the web workspace.
---

# SpecForge Idea Audit Skill

Use this skill when the user wants to:
- validate a rough idea before committing to a spec
- run structured pre-spec interrogation (G-Stack style)
- generate a complete IDF-compliant idea pack
- check that all required depth artifacts exist before speccing
- get a machine-readable go/no-go scorecard

## IDF Depth Standard

An idea is "spec-ready" when ALL of these exist (or are explicitly deferred with rationale):

| # | Artifact | Produced by stage |
|---|----------|-------------------|
| 1 | `EXECUTIVE_SUMMARY` | Office Hours |
| 2 | `PRD` with users, scope, GTM, kill criteria | CEO Review |
| 3 | `SPEC` with architecture, data model, APIs | Eng Review |
| 4 | `ARCHITECTURE_DIAGRAMS` (value flow + failure) | Eng Review |
| 5 | `VALIDATION_PLAN` with measurable go/no-go | Office Hours |
| 6 | `RISK_REGISTER` (legal, abuse, reliability) | Security Review |
| 7 | `FINANCIAL_MODEL` (pricing, cost, margin) | CEO Review |
| 8 | `AGENT_HANDOFF` (implementation readiness) | Eng Review |
| 9 | UX Pack (principles, flows, frontend vision, wireframes) | Design Review |
| 10 | `COMPETITOR_ANALYSIS` (named alternatives, why you win) | Office Hours |
| 11 | `COMPETITOR_MATRIX` (capability scoring, 3–5 competitors) | Office Hours |

## Stages

### Stage 1: Office Hours (Problem Interrogation)
**G-Stack equivalent:** `/office-hours`

Six forcing questions that reframe the concept before any planning:
1. What specific painful problem does this solve, and for whom exactly?
2. Why does this need to be a product (vs. a script, a spreadsheet, or a manual process)?
3. What would make someone pay for this on day one?
4. Who are the three named competitor products, and where are they weakest?
5. What is the riskiest assumption, and how would you know in 30 days if it's wrong?
6. What does success look like at 90 days, and what metric would make you kill it?

Outputs: one-paragraph product thesis, named competitors, validation signal, kill criteria.

### Stage 2: CEO Review (Strategy)
**G-Stack equivalent:** `/plan-ceo-review`

Four scope modes (user selects or defaults to SELECTIVE_EXPANSION):
- `EXPANSION` — what would make this 10x better for 2x effort?
- `SELECTIVE` — hold scope, surface cherry-pick opportunities
- `HOLD` — make the current plan bulletproof
- `REDUCTION` — strip to absolute minimum viable version

10-star product framework: ask "what would a 10/10 version of this look like?" and work backwards to MVP.

Outputs: `EXECUTIVE_SUMMARY`, `FINANCIAL_MODEL`, `PRD` (vision + non-goals), scope decisions table.

### Stage 3: Engineering Review (Architecture)
**G-Stack equivalent:** `/plan-eng-review`

Evaluates: architecture choices, data flow across 4 shadow paths (happy, nil input, empty/zero-length, upstream error), coupling analysis, scaling characteristics, failure modes, rollback procedures.

Mandatory: evaluation of 2–3 distinct architecture approaches with effort/risk/trajectory scoring.

Temporal interrogation: what ambiguities will implementers hit at hour 1, 2–3, 4–5, 6+?

Outputs: `SPEC`, `ARCHITECTURE_DIAGRAMS`, `AGENT_HANDOFF`.

### Stage 4: Design Review (UX)
**G-Stack equivalent:** `/plan-design-review`

Rates the design plan 0–10 across 7 dimensions:
1. Information Architecture
2. Interaction States (loading, empty, error, success, partial)
3. User Journey & Emotion
4. AI Slop Risk (see AI Slop Blacklist)
5. Design System Alignment
6. Responsive & Accessibility
7. Unresolved Decisions

AI Slop Blacklist (auto-fail patterns): purple/violet gradients, 3-column feature grids, icons in colored circles, centered everything, bubbly uniform border-radius, decorative blobs/wavy dividers, emoji as design, colored left-border cards, generic hero copy, cookie-cutter section rhythm.

Outputs: UX Pack (WIREFRAMES.md, USER_FLOWS.md, UX_PRINCIPLES.md, FRONTEND_VISION.md).

### Stage 5: Security Review
**G-Stack equivalent:** `/cso`

OWASP Top 10 threat model, STRIDE analysis, trust boundary map, input validation requirements, secrets management, audit logging requirements.

Outputs: `RISK_REGISTER`, `SECURITY.md`.

## CLI Usage

```bash
# Run full audit (all 5 stages)
bun run specforge -- audit --title "<title>" --idea "<rough idea>"

# Run a specific stage
bun run specforge -- audit --stage office-hours
bun run specforge -- audit --stage ceo-review
bun run specforge -- audit --stage eng-review
bun run specforge -- audit --stage design-review
bun run specforge -- audit --stage security-review

# Skip a stage
bun run specforge -- audit --skip security-review

# Machine-readable output
bun run specforge -- audit --json

# Run full automated pipeline (audit → plan → spec → handoff)
bun run specforge -- autoplan --title "<title>"
```

## End-of-Audit Recap Protocol

After each stage, provide:
1. Current one-paragraph product thesis
2. What changed from prior iteration
3. Open decisions requiring user input
4. Current go/no-go posture and why
5. UX drift note (if design stage ran)

## Exit Gates

Before advancing to Spec Generation (Act 1):

| Gate | Check |
|------|-------|
| Completeness | All IDF artifacts present or explicitly deferred |
| Consistency | No contradiction across PRD/SPEC/financial/risk |
| Validation | Pilot plan has measurable pass/fail thresholds |
| Alignment | User confirms final summary matches intended vision |
| UX | User flows and wireframes cover primary path and failure states |

If any gate fails, surface the specific gap and ask one focused question before proceeding.

## Required Questioning Behavior

If any IDF artifact is missing, ask from this priority order — one question at a time, never batch:

1. **User and pain** — who pays, who uses, what is urgent right now
2. **Scope and constraints** — MVP boundary, excluded features, timeline
3. **Economics** — pricing logic, cost drivers, margin assumptions
4. **Architecture** — control points, failure handling, trust boundaries
5. **GTM** — first segment, acquisition channel, validation signal
6. **Risks** — legal/policy/abuse/reliability failure modes
7. **Competition** — named alternatives, where you are weaker, why you still win

## Output after all stages

```json
{
  "ideaAudit": {
    "stages": [
      { "name": "office-hours", "status": "completed", "outputs": { ... } },
      { "name": "ceo-review",   "status": "completed", "outputs": { ... } },
      { "name": "eng-review",   "status": "completed", "outputs": { ... } },
      { "name": "design-review","status": "skipped",   "outputs": null    },
      { "name": "security-review","status":"completed","outputs": { ... } }
    ],
    "ideaPack": {
      "executiveSummary": "...",
      "productThesis": "...",
      "goNoGo": "go | no-go | conditional",
      "killCriteria": "...",
      "riskiest_assumption": "...",
      "validationSignal": "..."
    },
    "exitGates": {
      "completeness": true,
      "consistency": true,
      "validation": true,
      "alignment": true,
      "ux": false,
      "blocking": "ux"
    }
  }
}
```

## Rules

- Never hard-block on a skipped stage. All audit stages are optional by design.
- Do not invent answers — ask the user, even if the question seems obvious.
- One question per AskUserQuestion call. Never batch.
- All stage outputs go through the governed patch workflow; never write directly to canonical doc state.
- The go/no-go scorecard is a recommendation, not a hard block. The user decides.
- After the audit, proceed directly to `bun run specforge -- plan` or `bun run specforge -- tui` for spec generation.

## Verification

```bash
bun run specforge -- audit --stage office-hours --json   # smoke test: should return structured JSON
bun run specforge -- audit --json | jq '.ideaAudit.stages | length'
# should return 5 (all stages present, completed or skipped)
```
