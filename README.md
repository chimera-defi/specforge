# SpecForge

SpecForge is an idea-validation and multiplayer spec-creation workspace. It helps a founder, team, or AI pair turn a raw product idea into a validated, implementation-ready spec without losing the reasoning, tradeoffs, and review history that make the spec trustworthy.

The product combines a guided idea audit, a collaborative spec canvas, governed AI patch review, and handoff exports. The goal is not another generic document editor. The goal is a shared operating room for deciding whether an idea is worth building, then producing the PRD, technical spec, acceptance criteria, and launch packet needed to build it.

Repository: https://github.com/chimera-defi/specforge

## Current Shared Demo

- Landing page: https://placing-constructed-cabinets-happen.trycloudflare.com/
- Demo workspace: https://placing-constructed-cabinets-happen.trycloudflare.com/workspace
- Pilot request form: https://placing-constructed-cabinets-happen.trycloudflare.com/pilot-access

These URLs are Cloudflare quick-tunnel links for the local demo machine. They only work while both the local SpecForge server and the `cloudflared` tunnel process are running. If the browser says the site cannot be reached, the tunnel or local dev server is down or has been restarted with a new public URL.

When sharing the free demo publicly, configure the temporary Basic Auth gate with runtime-only credentials. Do not commit the password.

```bash
SPECFORGE_DEMO_GATE_USERNAME=specforge \
SPECFORGE_DEMO_GATE_PASSWORD=<share-out-of-band> \
bun --filter specforge-web dev --hostname 0.0.0.0
```

Then expose the web server:

```bash
cloudflared tunnel --url http://127.0.0.1:3000 --no-autoupdate
```

## What It Does

SpecForge is built around four jobs:

1. Validate the idea before writing a full build plan.
2. Let multiple humans and agents co-author the same spec in real time.
3. Keep AI edits governed through patches, review states, and attribution.
4. Export a build-ready packet instead of a vague brainstorm transcript.

The core workflow is:

1. Capture the idea, audience, constraints, risks, and proof points.
2. Draft the spec with structured depth gates.
3. Collaborate in the workspace with live cursors and shared state.
4. Review AI-suggested patches before applying them.
5. Export PRD/spec artifacts, handoff notes, and launch planning material.

## Pilot Intake

The pilot access form is wired to real persistence. Submissions are saved as pending records in the SpecForge store, can be reviewed from the workspace triage panel, and can optionally notify an external workflow.

Configure these variables for hosted or shared demos:

```bash
SPECFORGE_PILOT_TRIAGE_WORKSPACE_ID=<private-workspace-id>
SPECFORGE_PILOT_WEBHOOK_URL=<optional-notification-webhook>
```

Without a webhook, the app still stores the request; it does not send email by itself. The review queue in `/workspace` is the source of truth.

## Run Locally

Install dependencies:

```bash
bun install
```

Start the web app and collaboration server in separate terminals:

```bash
bun run dev:web
bun run dev:collab
```

Open:

- `http://localhost:3000/` for the landing page
- `http://localhost:3000/workspace` for the demo workspace
- `http://localhost:3000/pilot-access` for the pilot request flow
- `http://localhost:4322/health` for the collaboration server health check

Local state is stored under `web/.data/` and is intentionally ignored by git.

## Product Surfaces

| Surface | Purpose | Path |
| --- | --- | --- |
| Web app | Landing page, pilot intake, multiplayer workspace | `web/` |
| Collaboration server | Hocuspocus/Yjs realtime editing service | `collab-server/` |
| CLI | Terminal-native spec workflow | `cli/` |
| Desktop shell | Tauri wrapper around the local product | `desktop/` |
| Agent skill | Agent-facing SpecForge workflow prompts | `skills/specforge/` |
| Spec pack | Product, architecture, UX, validation, and runbook docs | `spec/` |

## Documentation

The repo root is intentionally small. The original planning pack now lives in `spec/` so the product root stays readable.

Start here:

- `spec/SPEC.md` - product intent and binding feature behavior
- `spec/PRD.md` - requirements and acceptance expectations
- `spec/ARCHITECTURE_DECISIONS.md` - architecture choices
- `spec/TECH_STACK.md` - stack decisions
- `spec/TASKS.md` - current backlog
- `spec/LOCAL_RUNBOOK.md` - local development and operations
- `web/DESIGN.md` - design system for the web app
- `spec/API_REFERENCE.md` - service and API endpoints

## Verification

Canonical checks from the repo root:

```bash
bun run contracts:validate
bun run lint
bun run test
bun run test:acceptance
bun run build:web
```

Run `bun run test:cli` when touching `cli/`, and `bun run build:desktop` when touching `desktop/`.
