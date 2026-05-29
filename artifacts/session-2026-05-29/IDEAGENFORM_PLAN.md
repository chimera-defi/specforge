# IdeaGenerator Form Updates Plan

**Date:** 2026-05-29
**Task:** Add competitiveAnalysis and businessModel form fields to IdeaGenerator
**Context:** Follow-up from Item #5 where type changes were made but form UI was deferred

---

## Current State

**Type Changes (Already Complete):**
- ✅ competitiveAnalysis field added to IdeaScaffold type
- ✅ businessModel field added to IdeaScaffold type
- ✅ DEFAULT_IDEA_SCAFFOLD updated with new fields
- ✅ normalizeIdeaScaffold updated with new fields
- ✅ IdeaGenerator component state updated with new fields

**Missing:**
- ❌ Form input fields for competitiveAnalysis
- ❌ Form input fields for businessModel
- ❌ AI assist prompt updated to extract new fields

---

## Comprehensive Plan

### Phase 1: Add Form Fields
1. Locate the Business & Competition section in IdeaGenerator form
2. Add competitiveAnalysis textarea field with placeholder
3. Add businessModel textarea field with placeholder
4. Ensure proper styling and layout consistency

### Phase 2: Update AI Assist Prompt
1. Update the system prompt to include competitiveAnalysis and businessModel
2. Ensure AI can populate these fields from brief description

### Phase 3: Testing and Verification
1. Test form rendering
2. Test AI assist population
3. Verify TypeScript compilation
4. Run lint and tests

### Phase 4: Documentation Updates
1. Update CHANGELOG with form field additions
2. Update ITEM5_IMPROVEMENT_SUMMARY to note completion
3. Clean up plan files

### Phase 5: Git Finalization
1. Commit changes
2. Push to feature branch
3. Create PR
4. Merge to main

---

## Anti-Discovery Measures

**NO NEW TASKS WILL BE ADDED** during execution. This plan covers:
- Only adding 2 form fields (competitiveAnalysis, businessModel)
- Only updating AI assist prompt
- NO new features
- NO refactoring
- NO new investigations
- ONLY completing the deferred work from Item #5

**Scope Boundaries:**
- Focus ONLY on IdeaGenerator form fields
- Focus ONLY on AI assist prompt update
- NO changes to other components
- NO new export artifacts
- ONLY completing what was deferred

---

## Success Criteria

- [ ] competitiveAnalysis form field added
- [ ] businessModel form field added
- [ ] AI assist prompt updated
- [ ] Form renders correctly
- [ ] TypeScript compilation passes
- [ ] Lint passes
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Changes merged to main
- [ ] NO new tasks discovered