# Maintenance State
last_run: 2026-08-10
focus: deps
status: completed
completed: [next 16.2→16.3, tiptap 3.20→3.29, lucide 1.17→1.31, sentry 10.55→10.69, playwright 1.58→1.62, vitest 4.1.8→4.1.10, yjs 13.6.30→13.6.32, otel sdk 0.218→0.221, tailwind 4.3.0→4.3.3, @types/react 19.2.17→19.2.18, @types/pg 8.18→8.21, eslint-config-next 16.2→16.3 — PR #39]
in_progress:
pending: []
known_failures:
  - web-and-cli TypeScript errors pre-exist on main (ReadinessReport.open_clarification_count, PatchSeedLine.status, page.bodyText) — not from deps bump
  - Container Image Scan: Bun 1.3.9 SIGILL crash in Docker — infrastructure bug, not dep-related
  - Trivy: 10 alerts flagged; large-diff disclaimer applies; owner review needed
  - walletradar all deps are major version bumps — skip entire walletradar deps pass each Monday until ecosystem settles
skip_next_run: []
attempt_counts:
