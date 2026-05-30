## SpecForge PRD

**Status**: Production Ready for YC Interview | **Last Updated**: 2026-05-30 | **Owner**: SpecForge

### Problem
Teams doing startup/product planning often draft PRD/spec/design docs in fragmented tools:
1. chat in one place,
2. docs in another,
3. AI output pasted manually,
4. poor provenance and messy merges.

### Product Thesis
Create a focused collaborative spec IDE for humans and AI agents where work happens on the same markdown canvas and edits are:
1. real-time,
2. attributable,
3. merge-safe,
4. depth-gated before milestone close,
5. workflow-linked to implementation.
6. optionally convertible into a starter GitHub repository flow.

### Current Shipped Product
The product currently ships:
1. **Idea Generation & Validation** - 5-stage structured validation (demand reality, status quo, desperate specificity, narrowest wedge, observation, future fit)
2. **Guided Spec Creation** - Multi-file workspace with structured form fields and validation
3. **Shared OpenSpec Core** - Reusable spec schema, readiness logic, and handoff contracts
4. **Agent-Assist Integration** - Mini agent-assist for populating guided fields from rough briefs
5. **Multiplayer Drafting** - Real-time collaborative editing with Yjs + Hocuspocus (multi-file workspace)
6. **Governed Patch Review** - Accept/reject/cherry-pick AI edits at block or section granularity
7. **Comments & Clarifications** - Anchored comment threads and clarification writeback
8. **Readiness Gates** - Validation checks before build handoff with depth gates
9. **Enhanced Export Bundle** - 15 artifacts including PRD, SPEC, TASKS, agent_spec.json, COMPETITIVE_ANALYSIS.md, BUSINESS_MODEL.md
10. **Handoff with Metadata** - Complete traceability from idea generation through validation to handoff
11. **Terminal-Native CLI** - `specforge` CLI for guided creation, status, backlog review, and TUI
12. **Desktop Packaging** - macOS (dmg, app) and Windows (msi, nsis) targets with service log viewing
13. **SaaS Scaffolding** - Complete Stripe billing integration with entitlements system
14. **Hybrid Bridge Model** - Local bridge for hybrid hosted + local CLI access
15. **UX Pack Section** - First-class UX design section for explicit design handoff
16. **Design Feedback Loop** - Design feedback converted to governed patch proposals
17. **Marketing Surfaces** - Landing page at `/` and pricing page at `/pricing`
18. **Security Hardening** - CSP headers, input sanitization, accessibility improvements
19. **Form Validation** - Required field validation with inline errors and accessibility support

### Architecture
Refactored into explicit components:
1. **Shared OpenSpec Core** - Spec schema, readiness logic, handoff contracts
2. **Multiplayer Web Workspace** - Next.js 16.2.0 + Tiptap + Yjs
3. **Collaboration Runtime** - Hocuspocus + Yjs CRDT server
4. **Orchestration Runtime** - Patch engine, policy guardrails, depth gates
5. **CLI/TUI Entry Point** - Terminal-native `specforge` wizard
6. **Desktop Shell** - Tauri wrapper with configuration panel
7. **Local Bridge** - HTTP bridge for hybrid hosted + local CLI

The CLI/TUI and the web app use the same spec schema, readiness logic, and handoff contracts.

### Company Plan
The broader company plan:
1. ✅ Validate design-partner demand and retention
2. ✅ Decide hosted SaaS vs self-hosted OSS packaging (SaaS path chosen)
3. ✅ Add billing, metering, backup/restore, and operational dashboards
4. 🔄 Expand starter generation after real demand proves which templates matter
5. 🔄 Deepen commercial onboarding, conversion instrumentation, and self-serve setup

### What Exists Already (Reality Check)
- Real-time collaborative docs are mature (Google Docs, Notion, Coda).
- Collaborative Markdown tools exist (HackMD, HedgeDoc).
- Therefore the wedge is not "another editor"; it is **agent-native specification workflow on a shared human+agent canvas**.

### Differentiation Wedge
1. **Idea Validation First** - 5-stage structured validation before spec creation
2. **AI Agent Edits as Patch Proposals** - Not silent overwrites
3. **Section/Block-Level Attribution** - Review and approval gates
4. **Depth Gates** - Force missing decisions, risks, and recap before phase close
5. **Citation/Provenance Tagging** - Per generated block
6. **"Spec-to-Build" Outputs** - Tasks, acceptance criteria, agent handoff bundles
7. **Complete Data Traceability** - From idea generation through validation to handoff
8. **Multi-Surface Architecture** - Web, CLI, Desktop, API all aligned

### Core Users
1. Startup teams writing PRD/specs with AI assistance
2. Engineering leads managing multiple agent contributors
3. Product+engineering pods needing auditable decision history
4. YC companies preparing for demo day with validated specs

### Non-Goals (MVP)
1. Full Google Docs replacement for all document types
2. General office suite features (slides/spreadsheets)
3. Enterprise knowledge-base platform scope

### MVP Scope
1. ✅ Multi-file Markdown editor with presence/cursors/comments
2. ✅ Idea generator with 5-stage validation
3. ✅ Agent-assist surface for populating guided spec fields
4. ✅ Accept/reject/cherry-pick AI edits at block or section granularity
5. ✅ Version history + per-edit attribution (human/agent)
6. ✅ Readiness gates and clarification loops before build handoff
7. ✅ Export to markdown + JSON spec bundle with 15 artifacts
8. ✅ Delivery loop with status/context/handoffs for terminal-native operators
9. ✅ Public landing and pricing surfaces
10. ✅ Desktop packaging for macOS and Windows
11. ✅ Stripe billing with entitlements system
12. ✅ Local bridge for hybrid hosted + local CLI access

### Phase 2 Scope (If MVP Validates)
1. Starter repository generation from approved spec bundle
2. Broader template-driven scaffolds (web app/API/docs-first presets)
3. Traceability from generated tasks/issues back to spec sections
4. Roll out on curated `ideas/` examples before opening arbitrary project generation
5. Expand commercial onboarding, billing, and plan enforcement
6. Grow terminal-native `specforge` wizard into fuller TUI/assistant surface

### Agent Service Workflow (OpenServ-Compatible)
SpecForge is productized as a repeatable agent service, not only an interactive app.

Service contract (v1):
1. Input: rough brief + optional constraints (deadline, stack, domain, risk tolerance)
2. Agent flow: idea validation → guided clarification → draft synthesis → patch/governance review → readiness checks
3. Output: execution-ready launch packet (PRD.md, SPEC.md, TASKS.md, agent_spec.json, COMPETITIVE_ANALYSIS.md, BUSINESS_MODEL.md) with complete metadata traceability
4. Delivery mode: asynchronous job with status + artifacts endpoints in addition to web/CLI/TUI UX

### Guided Idea-Depth Assistant (SpecForge Productization)
1. Built-in broad-to-deep wizard with required gates for PRD/SPEC/risk/validation/economics
2. Agent asks targeted continuation questions when required detail is missing
3. Agent must produce end-of-iteration recap:
   - thesis now
   - what changed
   - open decisions
   - current go/no-go posture
4. Goal: prevent shallow specs and reduce idea drift between user intent and produced artifacts
5. Delivery principle: every approved spec should first yield a minimum extensible product that is runnable and then be driven toward parity by the delivery loop

### Example Corpus Strategy
Use selected packs under `ideas/` as:
1. internal fixtures for regression and end-to-end evaluation
2. proof that authored specs can become executable downstream outputs
3. a benchmark corpus across rough, mid-fidelity, and mature idea stages

### Business Model
1. Team subscription by seats + AI usage credits
2. Premium for advanced governance/workflow controls
3. Enterprise plan for SSO/audit/compliance retention
4. Optional self-hosted packaging can widen adoption, but multiplayer still requires a backend runtime

### TAM/SAM/SOM Framing (Bottom-Up)
Use workflow-based TAM, not broad "document software" TAM:

- `target teams x monthly willingness-to-pay x attach rate`

Illustrative planning model:
- 25,000 target startup/eng teams x $40/team/mo x 20% reachable attach
- = ~$2.4M ARR initial reachable segment

Add-on AI usage and enterprise governance can expand this if retention is strong.

### GTM
1. Wedge into AI-heavy startup teams and dev shops
2. Lead with authoring and governance value before broad repo-generation claims
3. Treat autonomous backlog-driving as product value, not just internal build hygiene
4. Integrate with GitHub/Jira/Linear to connect spec -> execution
5. Content-led growth via templates and "good spec" playbooks
6. Viral loop: shared docs with guest review + easy import/export
7. Expand from "spec IDE" narrative to "spec-to-code" narrative once example-backed generation is stable

### Success Metrics
1. Activation: first collaborative spec reaches milestone-close recap
2. Value: percentage of AI patch suggestions accepted, segmented by patch type
3. Retention: weekly active teams writing/updating specs
4. Throughput: time from initial idea to implementation-ready spec
5. Quality: reduction in downstream rework for instrumented example builds
6. Trust: reviewer-rated confidence in accepted agent patches

### Risks
1. Crowded doc market with strong incumbents
2. AI patch quality may reduce trust if noisy
3. Multiplayer consistency and merge UX complexity
4. Cost control for AI-heavy sessions
5. Repo generation can distract from proving authoring behavior

### Kill Criteria
1. Teams use it once for ideation but return to incumbent docs for final specs
2. AI patch acceptance is persistently low
3. Collaboration reliability issues (conflicts/data loss) hurt trust
4. Example builds show little quality improvement despite heavier authoring flow

### Why This Could Work
A narrow, workflow-native product for "specs that lead to code" can win even in a crowded editor market if it makes collaborative authoring trustworthy, forces better decisions through validation, and materially reduces planning-to-build rework through complete data traceability.

### Naming Direction
Current preferred name: `SpecForge`