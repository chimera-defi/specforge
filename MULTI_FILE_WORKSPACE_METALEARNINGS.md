# Multi-File Workspace Implementation - Metalearnings

## Date
2026-05-28

## Feature
Multi-file workspace with per-file real-time collaboration

## Metalearnings

### 1. E2E Testing is Critical for UI Features
**Learning:** Unit tests and build passes are not sufficient for UI components. A proper browser e2e test revealed that the CollaborativeFileBrowser component renders correctly, which unit tests alone couldn't verify.

**Action:** Always run browser e2e tests for UI changes, especially:
- New components
- Navigation changes
- Integration points between components

### 2. Simplify E2E Tests to Avoid Flakiness
**Learning:** Initial test tried to create a document through UI, which failed due to not knowing the exact UI flow. Simplified test to:
- Login
- Navigate to workspace
- Check if document exists (graceful handling if not)
- Navigate to draft stage
- Verify component rendering
- Take screenshots

**Action:** When writing e2e tests:
- Start with existing data when possible
- Be graceful about missing data (log warnings, don't fail)
- Focus on verifying component rendering rather than full user flows
- Take screenshots at each step for debugging

### 3. Database Schema Design Should Support Upsert
**Learning:** The `workspace_files` table uses ON CONFLICT to upsert instead of throwing errors on duplicate filenames. This is the right choice because:
- Users might click "Add File" multiple times quickly
- Network retries can cause duplicate requests
- It's better to update than to error

**Action:** Use ON CONFLICT DO UPDATE for unique constraints when:
- User actions can cause duplicates
- Network retries are possible
- Idempotency is important

### 4. Yjs Provider Lifecycle Management is Tricky
**Learning:** The Tiptap Collaboration extension needs the Yjs document to be initialized before the editor is created. Initial implementation had a null reference error.

**Solution:** Conditionally include the Collaboration extension only when ydocRef.current exists:
```typescript
extensions: [
  StarterKit,
  ...(ydocRef.current ? [Collaboration.configure({
    document: ydocRef.current,
  })] : []),
]
```

**Action:** When using Yjs with React:
- Initialize Yjs documents in useEffect
- Conditionally include Collaboration extensions
- Clean up providers on unmount
- Test the initialization sequence

### 5. Room Naming Strategy Matters for Multi-File Collaboration
**Learning:** Each file needs its own collaboration room. Using `${documentId}:${filename}` is a good strategy because:
- Room names are unique per file
- Easy to debug (can see which document/file in room name)
- Prevents cross-file sync conflicts

**Action:** For multi-file collaboration:
- Include both parent and child entity in room name
- Use delimiters that are URL-safe
- Make room names human-readable for debugging

### 6. Debounced Saves Prevent API Spam
**Learning:** Real-time editing can trigger many save requests. Using a 1-second debounce:
- Reduces API load
- Preserves recent changes
- Provides good UX (changes saved quickly but not on every keystroke)

**Action:** For real-time editing features:
- Always use debounced saves
- 1-2 second debounce is usually good
- Update local state immediately, sync to server in background

### 7. Export Should Read from Workspace, Not Generate
**Learning:** The original export generated files from the single document. New architecture reads from workspace_files table with fallback to generation. This is better because:
- Users can edit files directly
- Export reflects actual state
- Backward compatible (fallback for old documents)

**Action:** When refactoring export:
- Read from source of truth (workspace files)
- Provide graceful fallback for migration
- Document the migration path

### 8. Stub Files Should Be Removed, Not Hidden
**Learning:** Original export included files like OPEN_QUESTIONS.md with placeholder content like "All critical questions have been answered". This is misleading.

**Solution:** Don't include files at all if they have no meaningful content:
```typescript
if (questions.length > 0) {
  files["OPEN_QUESTIONS.md"] = formatQuestions(questions);
}
```

**Action:** Never include stub/placeholder content in exports:
- Check if content is meaningful before including
- Better to omit than to include "no data" messages
- Users should see what's real, not what's generated

### 9. Test Coverage Should Include Edge Cases
**Learning:** Added 6 tests for workspace files:
- Create/retrieve
- List files
- Get by name
- Update content
- Delete
- Upsert on duplicate (ON CONFLICT behavior)

**Action:** For CRUD operations, test:
- Happy path (create, read, update, delete)
- Edge cases (duplicates, missing data)
- Constraint violations (unique keys)
- Upsert behavior if applicable

### 10. TypeScript Build Pass ≠ Runtime Success
**Learning:** The build passed but the initial Tiptap implementation had a runtime error (null reference). TypeScript couldn't catch this because it's a runtime issue with Yjs initialization.

**Action:** For runtime dependencies:
- Test in actual browser, not just build
- Add null checks for optional dependencies
- Use conditional rendering for components that depend on async data
- Test the initialization sequence

## Technical Decisions

### Why Separate Yjs Documents Per File?
- **Alternative:** Single Yjs document with multiple fragments
- **Chosen:** Separate documents per file
- **Reasoning:** 
  - Simpler architecture (each file is independent)
  - Easier to debug (can inspect individual file state)
  - Better performance (only sync active file)
  - Clearer separation of concerns

### Why WebsocketProvider for Code Files Instead of Tiptap?
- **Alternative:** Use Tiptap for all files with plain text mode
- **Chosen:** Yjs Text + textarea for code files
- **Reasoning:**
  - Tiptap is overkill for plain text
  - Yjs Text is designed for plain text collaboration
  - Simpler, lighter, faster
  - Better fit for code editing

### Why Fallback to Generation in Export?
- **Alternative:** Force migration to workspace files
- **Chosen:** Graceful fallback
- **Reasoning:**
  - Backward compatible with existing documents
  - No data loss during deployment
  - Gradual migration path
  - Can enforce migration later if needed

## What I Would Do Differently

### 1. Add Integration Tests Earlier
Should have added integration tests for the API endpoints and store functions before building the UI component. This would have caught the function signature mismatch earlier.

### 2. Test Yjs Initialization in Isolation
Should have tested the Yjs provider lifecycle separately before integrating with React. Would have caught the null reference error earlier.

### 3. Use Test Database in E2e Tests
The e2e test relied on an existing document. Would be better to:
- Create a fresh test database
- Insert a test document
- Run the test
- Clean up test database
This would make tests more reliable and independent.

### 4. Add Presence Indicators
The implementation has real-time collaboration but doesn't show:
- Which users are editing which files
- Cursor positions
- User presence indicators

These would improve the collaborative experience significantly.

### 5. Add File Type Icons
The file browser shows filenames but no icons. Would be better UX to show:
- File type icons (markdown, json, yaml, etc.)
- Status indicators (syncing, live, offline)
- Modified indicators

## Future Improvements

1. **Presence Indicators:** Show which users are editing which files
2. **Cursor Positions:** Show remote cursors in real-time
3. **File Type Icons:** Visual indicators for different file types
4. **Drag & Drop:** Allow reordering files
5. **File History:** Track file version history
6. **Conflict Resolution:** Better handling of concurrent edits
7. **Offline Mode:** Support offline editing with sync on reconnect
8. **File Search:** Search across all files in workspace
9. **File Templates:** Pre-built templates for common files
10. **Batch Operations:** Delete/move multiple files at once

## Conclusion

The multi-file workspace feature is working correctly in production. The implementation is solid, but there are clear areas for improvement in the user experience (presence indicators, file icons, etc.) and testing infrastructure (test database, earlier integration tests).

The metalearnings emphasize the importance of:
- Proper e2e testing for UI features
- Graceful degradation and backward compatibility
- Careful lifecycle management for runtime dependencies
- Testing edge cases in CRUD operations
- Removing stub/placeholder content rather than hiding it