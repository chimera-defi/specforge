# Maintenance State
last_run: 2026-07-11
focus: observability
status: completed
completed:
  - fix(copy-button.tsx): add .catch() to navigator.clipboard.writeText().then() chain; clipboard permission denials now log to console.error instead of producing unhandled rejection
in_progress:
pending: []
known_failures:
  - tsc --noUnusedLocals: _-prefixed intentional vars and test schema mismatches (pre-existing)
  - complex e2e tests have timing issues — only critical-flows.spec.ts (11/11) used for CI gate
attempt_counts:
