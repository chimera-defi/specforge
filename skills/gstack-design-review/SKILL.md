---
name: gstack-design-review
description: Use when a user wants a rigorous design audit of the SpecForge UI, a feature plan, or any web product UI. Runs 7 review passes adapted from G-Stack's /design-review methodology. Rates each dimension 0-10, finds AI slop patterns, proposes atomic fixes, and outputs structured implementation tasks. Use after SpecForge spec generation to validate the UX Plan, or against the live site to find and fix issues.
---

# G-Stack Design Review Skill (SpecForge edition)

Adapted from [garrytan/gstack `/design-review` and `/plan-design-review`](https://github.com/garrytan/gstack).

Use this skill when the user wants to:
- audit the live SpecForge site or any web UI for design issues
- run a design review against a UX plan before implementation
- validate that a design avoids AI slop patterns
- get a letter-grade Design Score + AI Slop Score
- generate atomic, fixable implementation tasks from findings

## Two modes

| Mode | Target | When to use |
|------|--------|-------------|
| **Plan review** | A UX plan or DESIGN.md | Before implementing any UI. Runs 7 rating passes and edits the plan. |
| **Live review** | Running site | After building. Runs 7 phases, finds issues, commits atomic fixes. |

Default: **Plan review** if a spec or plan file is provided. **Live review** if URL or running dev server.

---

## Live Review (7 Phases)

### Phase 1: First Impression
Gut reaction critique:
- What does the site communicate in 5 seconds?
- Eye-flow test: where does attention go first?
- Standout observations (positive and negative)
- One-word verdict

### Phase 2: Design System Extraction
Automated scan of:
- Fonts in use (flag if >3 families)
- Color palette (flag hardcoded hex values not in token system)
- Heading hierarchy (is it logical and consistent?)
- Interactive element sizes (flag <44px touch targets)
- Performance: LCP, FID, CLS estimates

### Phase 3: Page-by-Page Audit (10 categories)

For each page, evaluate (~80 items across):

| Category | Key checks |
|----------|------------|
| Visual hierarchy | One dominant visual per screen, eye flow logical |
| Typography | Consistent scale, no FOUT, no Lorem Ipsum |
| Color/contrast | WCAG AA (4.5:1 text, 3:1 large), semantic colors match states |
| Spacing | Consistent grid, inner radii smaller than outer |
| Interaction states | Loading, empty, error, success, partial all handled |
| Responsiveness | Each viewport intentional (not just stacked mobile) |
| Motion | Animate only transform/opacity, respects reduced-motion |
| Content quality | Specific > vague, no generic hero copy |
| AI slop detection | See blacklist below |
| Performance | No layout thrash, no animating width/height |

### Phase 4: Interaction Flow Review
Walk 2–3 key user flows:
- Time to first meaningful interaction
- Transition quality and response feel
- Feedback clarity on each action
- Track "goodwill reservoir": does user trust accumulate or erode?

### Phase 5: Cross-Page Consistency
- Navigation identical across pages?
- Footer consistent?
- Component reuse vs. reimplementation?
- Tone and microcopy consistency?
- Spacing rhythm consistent?

### Phase 6: Report Compilation

Dual scoring:

```
Design Score: A–F
  A = Excellent, system-aware, no AI slop
  B = Good, minor gaps
  C = Functional, several issues
  D = Poor hierarchy or multiple AI slop hits
  F = Major accessibility or usability failures

AI Slop Score: A–F
  A = None detected
  B = 1–2 minor patterns
  C = 3–4 patterns or one prominent hit
  D = 5+ patterns or hero is AI slop
  F = Indistinguishable from generic SaaS template
```

Per-category grades. Baseline JSON saved to `./.gstack/design-audit-{YYYYMMDD}/baseline.json`.

### Phase 7: Triage & Fix
- Prioritize by impact (P1: A11y/hierarchy, P2: AI slop, P3: polish)
- Fix atomically: one git commit per fix
- Re-verify with screenshot before/after each fix
- Do not fix multiple issues in one commit

---

## Plan Review (7 Passes)

Rate each dimension 0–10 (10 = production-ready, no gaps):

| Pass | Dimension | What to rate |
|------|-----------|--------------|
| 1 | Information Architecture | Hierarchy, nav flow, "constraint worship" |
| 2 | Interaction States | Loading, empty, error, success, partial — all specified |
| 3 | User Journey & Emotion | Step → user action → user emotion → plan spec |
| 4 | AI Slop Risk | Apply hard rules + litmus checks |
| 5 | Design System Alignment | Validate against DESIGN.md tokens; flag new components |
| 6 | Responsive & Accessibility | Per-viewport specs, keyboard nav, ARIA, 44px targets |
| 7 | Unresolved Decisions | Surface ambiguities; one question per decision |

Each pass:
1. Rate 0–10 with explanation
2. Identify gaps
3. Edit the plan directly (output is a fixed plan, not a report about the plan)

---

## AI Slop Blacklist (Hard Rejections)

Any of these = instant flag, must fix before shipping:

1. Purple/violet/indigo gradient background on landing page
2. 3-column feature grid (icon-in-circle + bold title + 2-line copy × 3)
3. Icons in colored circles as section decoration
4. `text-align: center` on all sections globally
5. Same large border-radius on every element (uniform bubbly radius)
6. Decorative blobs, floating circles, wavy SVG dividers
7. Emoji in headings or as bullet substitutes
8. Colored left-border accent cards (`border-left: 3px solid accent`)
9. Generic hero copy ("Unlock the power of…", "The future of X")
10. Cookie-cutter section rhythm (hero → features → pricing → CTA, all same height/treatment)
11. `system-ui` or `Arial` as primary body font
12. All sections centered-everything

---

## Litmus Checks (YES/NO for each)

Before shipping any UI:

1. Is the brand unmistakable in the first screen?
2. Is there one strong visual anchor?
3. Is the page scannable by headings only?
4. Does each section have exactly one job?
5. Are cards actually necessary (vs. a list or table)?
6. Does motion improve hierarchy (not decorate it)?
7. Does it look premium without decorative shadows?

If any answer is NO, that is a finding. One AskUserQuestion per finding.

---

## Design Principles (Applied Automatically)

1. **Empty states are features** — warmth + action + context, not a spinner
2. **Hierarchy: first, second, third** — what does the user see at each level?
3. **Specificity over vibes** — name the font, spacing, interaction pattern — never "nice" or "clean"
4. **Edge cases are UX** — 47-char names, zero results, errors, RTL
5. **AI slop is the enemy** — generic grids and hero sections fail; break conventions intentionally
6. **Responsive ≠ stacked** — each viewport intentional
7. **Accessibility non-negotiable** — keyboard, screen readers, contrast ≥4.5:1, 44px targets
8. **Subtraction default** — if it has to be explained, it should be cut
9. **Trust earned at pixel level** — every pixel compounds or erodes user trust

---

## UX Laws

**Three Laws of Usability:**
1. Don't make me think — self-evident > self-explanatory
2. Clicks don't matter, thinking does — three obvious clicks beat one confusing click
3. Omit, then omit again — delete half the words, then half again

**How users actually behave:**
- Scan, not read (design for billboards at 60 mph)
- Satisfice (pick first reasonable option, not best)
- Muddle through (wing it, stick to first thing that works)
- Don't read instructions (guidance must be brief, timely, unavoidable)

---

## AskUserQuestion Protocol

- **One issue = one call** — never batch findings
- Describe the gap concretely (what the user will experience if unspecified)
- Present 2–3 options with effort + risk per option
- Map to a Design Principle (one sentence justification)
- Format: short title, plain-English stakes, recommendation, pros/cons

---

## Output

Each finding produces:
1. One inline edit to the plan (plan review) or one atomic git commit (live review)
2. One task in `tasks-design-review-{YYYYMMDD}.jsonl` with: phase, priority (P1/P2/P3), effort (S/M/L), files, source finding

Final report includes:
- Design Score (A–F) + AI Slop Score (A–F)
- Per-category grades
- "NOT in Scope" section (what was considered and explicitly deferred)
- "What Already Exists" (patterns and components that were reused)

---

## SpecForge-specific design system context

When reviewing SpecForge:
- Background: warm parchment (`#f1e8db`) — distinctive, keep it
- Accent: teal (`#0f766e`) — primary CTA color
- Dark section: `#18212b` — used for contrast rhythm breaks
- Fonts: Geist Sans + Geist Mono only — no fallbacks to system-ui
- Tokens: all in `web/src/app/globals.css` → `@theme {}` block
- Rule: never hardcode hex values — always use a `--sf-*` or `--color-*` token
- Anti-patterns already addressed in this codebase: purple gradients, 3-col grids, blobs — verify they stay out

## Verification

```bash
# Run live review against dev server
bun run dev &
open http://localhost:3000
# Then invoke /gstack-design-review

# Run plan review against DESIGN.md
cat web/DESIGN.md | head -50
# Invoke /gstack-design-review with plan review mode
```
