# Documentation Consolidation Plan

## Current State
45 files in spec/ directory, many historical or obsolete.

## Categorization

### ✅ Canonical Core Docs (KEEP - Authoritative)
- SPEC.md - Main product spec (34KB, actively maintained)
- PRD.md - Requirements (9KB)
- ARCHITECTURE_DECISIONS.md - Architectural choices (18KB)
- TASKS.md - Current backlog (17KB, actively maintained)
- TECH_STACK.md - Stack decisions (6KB)
- LOCAL_RUNBOOK.md - Local dev procedures (5KB)
- FRONTEND_VISION.md - UI/IA model (1KB)
- UX_PRINCIPLES.md - Interaction constraints (1KB)
- web/DESIGN.md - Design system (authoritative, in web/)

### 📋 Implementation Plans (EVALUATE - May be outdated)
- CLAUDE_BUILDOUT_PLAN.md (13KB) - Historical, likely superseded by actual implementation
- LOCAL_FIRST_SPEC_SYSTEM_PLAN.md (5KB) - Historical, may be superseded
- TAURI_DESKTOP_PLAN.md (6KB) - Still relevant for future bridge work
- FRONTEND_REDESIGN_PLAN.md (6KB) - Historical, likely superseded
- 90_DAY_EXECUTION_PLAN.md (2KB) - Historical, obsolete

### 🔬 Research/Analysis (ARCHIVE - Historical reference)
- COMPETITOR_ANALYSIS.md (3KB) - Historical research
- COMPETITOR_MATRIX.md (2KB) - Historical research
- RESEARCH_NOTES.md (2KB) - Historical research
- PRICING_BENCHMARKS.md (2KB) - Historical research
- FEASIBILITY_ANALYSIS.md (1KB) - Historical analysis

### 🏗️ Models/Architecture (ARCHIVE - Superseded by code)
- COMPONENT_MODEL.md (5KB) - Superseded by actual implementation
- EVENT_MODEL.md (2KB) - Superseded by actual implementation
- STATE_MODEL.md (2KB) - Superseded by actual implementation
- ARCHITECTURE_DIAGRAMS.md (4KB) - May be outdated

### 🔗 Handoffs/Integrations (ARCHIVE - Obsolete)
- AGENT_HANDOFF.md (4KB) - Historical
- DESIGN_AGENT_HANDOFF_PROMPT.md (1KB) - Historical
- KIRO_SPEC_BRIDGE.md (13KB) - Integration doc, may be obsolete

### ✅ Validation/Testing (KEEP IF ACCURATE)
- ACCEPTANCE_TEST_MATRIX.md (1KB) - May need update
- ADVERSARIAL_TESTS.md (1KB) - May need update
- VALIDATION_PLAN.md (3KB) - May need update
- SPEC_STAGE_CHECKLIST.md (1KB) - May need update

### 🧪 Trial/Pilot (ARCHIVE - Historical)
- DESIGN_PARTNER_TRIAL_PROMPT.md (2KB) - Historical
- PILOT_SCORECARD_TEMPLATE.md (1KB) - Historical
- SPRINT_PLANNING_COMPLETION.md (5KB) - Historical

### 📄 Other Low Value (ARCHIVE)
- spec/design.md (13KB) - OBSOLETE: duplicates web/DESIGN.md but with old architecture
- ALTERNATIVES_AND_VARIANTS.md (1KB) - Historical brainstorming
- DECISIONS.md (1KB) - Superseded by ARCHITECTURE_DECISIONS.md
- EXECUTIVE_SUMMARY.md (1KB) - Historical
- FINANCIAL_MODEL.md (2KB) - Historical
- FIRST_60_MINUTES.md (1KB) - Historical
- GO_NO_GO_SCORECARD.md (1KB) - Historical
- IDEA_DEVELOPMENT_FRAMEWORK.md (4KB) - Historical
- RISK_REGISTER.md (1KB) - Historical
- USER_FLOWS.md (1KB) - Historical
- VISION_AND_FLOW.md (2KB) - Historical
- WIREFRAMES.md (3KB) - Historical
- requirements.md (5KB) - Likely superseded by PRD.md

## Actions

### 1. Remove Obsolete Files (DELETE)
- spec/design.md (duplicates web/DESIGN.md, outdated)
- DECISIONS.md (superseded by ARCHITECTURE_DECISIONS.md)
- requirements.md (superseded by PRD.md)

### 2. Archive Historical Files (MOVE to spec/archive/)
Create spec/archive/ directory and move:
- CLAUDE_BUILDOUT_PLAN.md
- FRONTEND_REDESIGN_PLAN.md
- 90_DAY_EXECUTION_PLAN.md
- COMPETITOR_ANALYSIS.md
- COMPETITOR_MATRIX.md
- RESEARCH_NOTES.md
- PRICING_BENCHMARKS.md
- FEASIBILITY_ANALYSIS.md
- COMPONENT_MODEL.md
- EVENT_MODEL.md
- STATE_MODEL.md
- AGENT_HANDOFF.md
- DESIGN_AGENT_HANDOFF_PROMPT.md
- DESIGN_PARTNER_TRIAL_PROMPT.md
- PILOT_SCORECARD_TEMPLATE.md
- SPRINT_PLANNING_COMPLETION.md
- ALTERNATIVES_AND_VARIANTS.md
- EXECUTIVE_SUMMARY.md
- FINANCIAL_MODEL.md
- FIRST_60_MINUTES.md
- GO_NO_GO_SCORECARD.md
- IDEA_DEVELOPMENT_FRAMEWORK.md
- RISK_REGISTER.md
- USER_FLOWS.md
- VISION_AND_FLOW.md
- WIREFRAMES.md

### 3. Keep but Review (STAY in spec/)
- TAURI_DESKTOP_PLAN.md (still relevant for bridge work)
- ARCHITECTURE_DIAGRAMS.md (may need update)
- ACCEPTANCE_TEST_MATRIX.md (verify accuracy)
- ADVERSARIAL_TESTS.md (verify accuracy)
- VALIDATION_PLAN.md (verify accuracy)
- SPEC_STAGE_CHECKLIST.md (verify accuracy)
- KIRO_SPEC_BRIDGE.md (verify if still relevant)

### 4. Update Canonical Docs
- Update SPEC.md to reference web/DESIGN.md not spec/design.md
- Add ARCHIVE.md index to spec/archive/
- Update README.md to reflect new structure

## Result
After consolidation:
- spec/ will have ~15 files (from 45)
- spec/archive/ will have ~25 historical files
- Cleaner, more maintainable documentation structure