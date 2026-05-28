# Comprehensive Workspace Test Plan

## Test Objectives
1. Verify all workspace pages and stages work correctly
2. Test multiple ideas of varying complexity
3. Verify output quality for each idea
4. Test different AI assist preset modes
5. Check for regressions in existing functionality
6. Validate context variable interpolation in UI

## Test Ideas (Varying Complexity)

### Simple Ideas
1. "A simple task manager"
2. "A todo list app"
3. "A notes application"

### Medium Ideas
4. "A task manager for remote teams with deadline tracking"
5. "A project management tool for software teams"
6. "A calendar app with recurring events"

### Complex Ideas
7. "A collaborative project management platform with real-time editing, task dependencies, and automated workflows"
8. "An AI-powered knowledge management system that organizes notes automatically using semantic analysis"
9. "A multi-tenant SaaS application for customer support with ticket routing, SLA tracking, and analytics dashboard"

### Edge Cases
10. "A mobile app" (too vague)
11. "An app" (extremely vague)
12. "" (empty input)

## Workspace Pages/Stages to Test

### 1. Start Stage (Guided Draft Builder)
- [ ] Idea input field
- [ ] AI assist button (idea-to-spec mode)
- [ ] Field population (Problem, Goals, Users, Scope, Requirements, etc.)
- [ ] Navigation to next stage

### 2. Problem Stage
- [ ] Problem statement display
- [ ] AI assist for problem refinement (block-iteration mode)
- [ ] Edit functionality
- [ ] Patch proposal system

### 3. Goals Stage
- [ ] Goals display
- [ ] AI assist for goal refinement
- [ ] Edit functionality

### 4. Users Stage
- [ ] User personas display
- [ ] AI assist for user refinement
- [ ] Edit functionality

### 5. Scope Stage
- [ ] Scope boundaries display
- [ ] AI assist for scope refinement
- [ ] Edit functionality

### 6. Requirements Stage
- [ ] Requirements display
- [ ] AI assist for requirements refinement
- [ ] Edit functionality

### 7. Constraints Stage
- [ ] Constraints display
- [ ] AI assist for constraints refinement
- [ ] Edit functionality

### 8. UX Pack Stage
- [ ] UX requirements display
- [ ] AI assist for UX refinement (design-feedback mode)
- [ ] Edit functionality

### 9. Success Signals Stage
- [ ] Success metrics display
- [ ] AI assist for success signals refinement
- [ ] Edit functionality

### 10. Tasks Stage
- [ ] Implementation tasks display
- [ ] AI assist for task generation (planning-assist mode)
- [ ] Edit functionality

### 11. Non-Goals Stage
- [ ] Non-goals display
- [ ] AI assist for non-goals refinement
- [ ] Edit functionality

## AI Assist Preset Modes to Test

1. **idea-to-spec**: Initial spec generation from idea
2. **block-iteration**: Refining individual sections
3. **clarification-answer**: Answering clarification questions
4. **design-feedback**: UX/UI design review
5. **planning-assist**: Implementation planning
6. **custom**: User-specified prompts

## Regression Tests

### Before Changes (Baseline)
- Document existing behavior for each stage
- Note typical AI assist response quality
- Record navigation patterns

### After Changes
- Compare behavior with baseline
- Check for broken functionality
- Verify new features work as intended
- Ensure no performance degradation

## Test Execution Order

1. Login and navigate to workspace
2. Test Start stage with 3 different ideas (simple, medium, complex)
3. Navigate through all stages for each idea
4. Test AI assist on each stage with appropriate preset mode
5. Test edge cases (vague ideas, empty input)
6. Document output quality and any issues
7. Compare with expected behavior
8. Report regressions and bugs

## Success Criteria

- [ ] All workspace pages load without errors
- [ ] AI assist button works on all stages
- [ ] Output quality is good for simple, medium, and complex ideas
- [ ] Edge cases handled gracefully
- [ ] No regressions in existing functionality
- [ ] Different preset modes work as intended
- [ ] Navigation between stages works correctly
- [ ] Edit functionality preserved
- [ ] Patch proposal system still works

## Test Data Collection

For each test case, collect:
- Screenshot before AI assist
- Screenshot after AI assist
- Time taken for AI assist response
- Output text for quality assessment
- Any errors or warnings
- Browser console errors
- Network request failures

## Test Environment

- Browser: Chromium (Playwright)
- Auth: Demo credentials (demo/demo)
- Workspace: ws_demo
- Base URL: http://localhost:3000