# SpecForge Improvements Review

## Issues Found

### 1. AI Assist Integration ✅ FIXED
- **Issue:** Only supported Codex CLI and Claude CLI
- **Fix:** Added Devin CLI support with proper priority ordering (Devin > Codex > Claude > heuristic)
- **Impact:** Users can now use their preferred local AI agent for spec assistance

### 2. Export Output - Generic/Empty Files
The following files generate generic content that should be removed or improved:

**REMOVE:**
- `ARCHITECTURE_DECISIONS.md` - Only generates "TBD" stubs with no real content
- `ADVERSARIAL_TESTS.md` - Generic template tests unrelated to actual project  
- `SUBAGENT_PROMPT_PACK.md` - Generic prompts not specific to the project

**KEEP BUT IMPROVE:**
- `DECISIONS.md` - Actually reasonable, only generates when there are real decisions
- Other files like README.md, PRD.md, SPEC.md, TASKS.md generate real content from document metadata

**RECOMMENDED CORE FILES (keep these):**
- README.md
- EXECUTIVE_SUMMARY.md  
- PRD.md
- SPEC.md
- AGENT_HANDOFF.md
- TASKS.md
- OPEN_QUESTIONS.md
- FIRST_60_MINUTES.md
- RISK_REGISTER.md
- ACCEPTANCE_TEST_MATRIX.md
- DECISIONS.md
- USER_FLOWS.md
- VALIDATION_PLAN.md
- agent_spec.json
- DESIGN_SYSTEM.md (conditional, from design-review stage)
- SECURITY.md (conditional, from security-review stage)

### 3. Agent Guidance Quality
The current prompts are decent but could be more specific. The heuristic fallback is good but the AI agent prompts could be improved with:
- More specific guidance about what makes a good spec
- Better examples of good vs. bad content
- More context about the specific project domain

### 4. Workspace Page Review
Need to check for:
- Unwired buttons
- Dead UI elements
- Redundant interfaces
- Unused text output boxes

## Next Steps
1. Remove generic export files
2. Review workspace page for dead UI
3. Improve agent prompts
4. Test all changes