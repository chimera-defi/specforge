# IdeaGenerator Form Validation Plan

**Date:** 2026-05-29
**Task:** Add validation to IdeaGenerator form (deferred from form validation task)
**Context:** Follow-up to guided form validation - extend to IdeaGenerator form

---

## Current State

**IdeaGenerator Form (IdeaGenerator.tsx):**
- No validation currently
- User can submit empty or incomplete forms
- No error feedback
- No ARIA attributes for accessibility

**IdeaScaffold Type:**
- Has title, thesis, problem, targetUser, solutionApproach, and other fields
- competitiveAnalysis and businessModel fields added in Item #5
- No validation function exists

---

## Comprehensive Plan

### Phase 1: Add Validation Function to ideas-generator.ts
1. Add validateIdeaScaffold function
2. Define required fields: title (3+ chars), thesis (10+ chars), problem (10+ chars), targetUser (5+ chars), solutionApproach (10+ chars)
3. Define optional fields: competitiveAnalysis, businessModel, etc.
4. Return structured validation errors

### Phase 2: Add Validation to IdeaGenerator Component
1. Add validation error state
2. Add helper functions (getFieldError, hasFieldError, etc.)
3. Add validateForm function
4. Update form submission to validate first

### Phase 3: Add Inline Error Messages
1. Add error messages for required fields
2. Style consistent with guided form
3. Clear errors when user types

### Phase 4: Add ARIA Attributes for Accessibility
1. Add aria-invalid to fields with errors
2. Add aria-describedby linking fields to errors
3. Add role="alert" to error messages
4. Add unique IDs to error spans
5. Add live region for screen reader announcements

### Phase 5: Testing and Verification
1. Test validation with empty forms
2. Test validation with partial forms
3. Test validation with complete forms
4. Test ARIA attributes
5. Run lint and tests

### Phase 6: Documentation Updates
1. Update CHANGELOG with IdeaGenerator validation

### Phase 7: Git Finalization
1. Commit changes
2. Push to feature branch
3. Merge to main

---

## Anti-Discovery Measures

**NO NEW TASKS WILL BE ADDED** during execution. This plan covers:
- Only adding validation to IdeaGenerator form
- Only adding ARIA attributes for accessibility
- NO new features
- NO refactoring
- NO new investigations
- ONLY validation and accessibility

**Scope Boundaries:**
- Focus ONLY on IdeaGenerator form validation
- Focus ONLY on ARIA attributes and error messages
- NO changes to other components
- NO changes to validation logic in guided form
- ONLY IdeaGenerator validation

---

## Success Criteria

- [ ] Validation function added to ideas-generator.ts
- [ ] Validation added to IdeaGenerator component
- [ ] Inline error messages displayed
- [ ] ARIA attributes added for accessibility
- [ ] Screen reader announcements working
- [ ] Lint passes
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Changes merged to main
- [ ] NO new tasks discovered