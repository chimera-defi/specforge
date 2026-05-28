---
name: specforge-handoff
description: Use when a user wants to emit the final SpecForge handoff.json — a build-agnostic artifact containing the full export bundle (PRD, SPEC, TASKS, agent_spec.json, optional DESIGN_SYSTEM.md and SECURITY.md) plus idea validation stage provenance (which stages were completed or skipped, with their structured outputs). This is the terminal output of the SpecForge workflow. Build tooling is not specified.
---

# SpecForge Handoff Skill

Use this skill when the user wants to:
- emit the final `handoff.json` after spec generation is complete
- include idea validation stage provenance in the handoff (which stages were done vs. skipped)
- get a machine-readable artifact for downstream build pipelines, CI, or agent workflows
- mark the document as "build-ready" in the workspace

## What handoff.json contains

```json
{
  "version": "1",
  "documentId": "...",
  "workspaceId": "...",
  "generatedAt": "...",
  "ideaValidationSession": {
    "mode": "startup",
    "stages": [
      { "name": "demand-reality",         "status": "completed", "patchId": "...", "question": "...", "systemPrompt": "...", "outputs": { ... }, "answers": { ... } },
      { "name": "status-quo",             "status": "completed", "patchId": "...", "question": "...", "systemPrompt": "...", "outputs": { ... }, "answers": { ... } },
      { "name": "desperate-specificity",   "status": "completed", "patchId": "...", "question": "...", "systemPrompt": "...", "outputs": { ... }, "answers": { ... } },
      { "name": "narrowest-wedge",         "status": "skipped",   "patchId": null,  "question": "...", "systemPrompt": "...", "outputs": null,    "answers": null },
      { "name": "observation",             "status": "completed", "patchId": "...", "question": "...", "systemPrompt": "...", "outputs": { ... }, "answers": { ... } },
      { "name": "future-fit",              "status": "skipped",   "patchId": null,  "question": "...", "systemPrompt": "...", "outputs": null,    "answers": null }
    ]
  },
  "exportBundle": {
    "prd":          "PRD.md contents",
    "spec":         "SPEC.md contents",
    "tasks":        "TASKS.md contents",
    "agentSpec":    { ... },
    "ideaValidation": {
      "demandReality": { "answers": { ... }, "outputs": { ... }, "question": "..." },
      "statusQuo": { "answers": { ... }, "outputs": { ... }, "question": "..." },
      "desperateSpecificity": { "answers": { ... }, "outputs": { ... }, "question": "..." },
      "narrowestWedge": { "answers": { ... }, "outputs": { ... }, "question": "..." },
      "observation": { "answers": { ... }, "outputs": { ... }, "question": "..." },
      "futureFit": { "answers": { ... }, "outputs": { ... }, "question": "..." }
    }
  },
  "executionBrief": "...",
  "launchPacket":   { ... }
}
```

**Build tooling is not specified.** The handoff JSON is consumable by any build workflow — G-Stack, Codex, CI pipelines, or manual processes. SpecForge does not encode a preferred downstream.

## Default flow

### Emit handoff from CLI

```bash
bun run specforge -- handoff
# machine-readable:
bun run specforge -- handoff --json
# write to file:
bun run specforge -- handoff --output handoff.json
```

### Emit from hosted API

```bash
POST $SPECFORGE_API_URL/documents/:id/handoff
```

Returns the full handoff JSON. Also marks the document as "build-ready" in the workspace.

### Preflight check

Before emitting handoff, the CLI checks:
- At least one spec section has been authored (not a blank document)
- The export bundle can be generated without errors

Warnings (not hard blocks) are shown for:
- No idea validation stages completed (handoff will have all stages as `null`)
- Clarification queue has unresolved items
- Readiness score below threshold

### After handoff

The `handoff.json` is the input to whatever build pipeline the user has chosen. Common next steps:

- Pass `executionBrief` + `launchPacket` to a coding agent (Codex, Claude Code, G-Stack `/plan-eng-review` if starting fresh build review, etc.)
- Commit `handoff.json` to the repo alongside the spec bundle
- Use `agentSpec` to generate scaffolding with a repo generation tool

## Rules

- Do not reference a specific build tool in the handoff JSON or the skill output.
- If planning stages were skipped, include them with `"status": "skipped"` — do not omit them.
- `DESIGN_SYSTEM.md` and `SECURITY.md` are only included in `exportBundle` if the corresponding planning stages were completed.
- The handoff is a snapshot of canonical document state at emission time; re-emit to refresh.

## Verification

```bash
bun run specforge -- handoff --json | jq '.ideaValidationSession.stages | length'
# should return 6 (all stages present, completed or skipped)
bun run specforge -- handoff --json | jq '.exportBundle.prd | length'
# should return > 0 (non-empty PRD)
```
