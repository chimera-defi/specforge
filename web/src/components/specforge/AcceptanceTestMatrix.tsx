"use client";

/**
 * AcceptanceTestMatrix
 *
 * Renders a table of acceptance tests with inline add, edit, delete, and
 * batch-run controls. Pure presentation component -- all mutations are
 * handled via callback props provided by AcceptanceTestSection.
 */

import { useCallback, useState } from "react";

import type { AcceptanceTest } from "@/lib/specforge/acceptance-tests";

export type AcceptanceTestDraft = {
  feature: string;
  test_case: string;
  expected_result: string;
};

type AcceptanceTestMatrixProps = {
  tests: AcceptanceTest[];
  documentId: string;
  onAddTest: (draft: AcceptanceTestDraft) => Promise<void>;
  onUpdateTest: (testId: string, updates: Partial<AcceptanceTestDraft>) => Promise<void>;
  onDeleteTest: (testId: string) => Promise<void>;
  onRunTests: () => Promise<void>;
};

const EMPTY_DRAFT: AcceptanceTestDraft = {
  feature: "",
  test_case: "",
  expected_result: "",
};

const statusColors: Record<AcceptanceTest["status"], string> = {
  pending: "text-muted-light",
  pass: "text-success",
  fail: "text-danger",
  skip: "text-muted-lighter",
};

export function AcceptanceTestMatrix({
  tests,
  onAddTest,
  onUpdateTest,
  onDeleteTest,
  onRunTests,
}: AcceptanceTestMatrixProps) {
  const [draft, setDraft] = useState<AcceptanceTestDraft>(EMPTY_DRAFT);
  const [adding, setAdding] = useState(false);
  const [running, setRunning] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AcceptanceTestDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const handleAdd = useCallback(async () => {
    if (!draft.feature.trim() || !draft.test_case.trim()) return;
    setAdding(true);
    try {
      await onAddTest(draft);
      setDraft(EMPTY_DRAFT);
    } finally {
      setAdding(false);
    }
  }, [draft, onAddTest]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    try {
      await onRunTests();
    } finally {
      setRunning(false);
    }
  }, [onRunTests]);

  const startEdit = useCallback((test: AcceptanceTest) => {
    setEditingId(test.test_id);
    setEditDraft({
      feature: test.feature,
      test_case: test.test_case,
      expected_result: test.expected_result,
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditDraft(EMPTY_DRAFT);
  }, []);

  const handleSave = useCallback(
    async (testId: string) => {
      if (!editDraft.feature.trim() || !editDraft.test_case.trim()) return;
      setSaving(true);
      try {
        await onUpdateTest(testId, editDraft);
        setEditingId(null);
        setEditDraft(EMPTY_DRAFT);
      } finally {
        setSaving(false);
      }
    },
    [editDraft, onUpdateTest]
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="m-0 text-sm font-semibold">
          Acceptance Tests ({tests.length})
        </h3>
        <button
          onClick={handleRun}
          disabled={running || tests.length === 0}
          className={`px-3.5 py-1.5 text-sm rounded-md border cursor-pointer ${
            running
              ? "bg-surface-light cursor-wait"
              : "bg-surface-input"
          }`}
        >
          {running ? "Running..." : "Run Tests"}
        </button>
      </div>

      {tests.length > 0 && (
        <table className="w-full border-collapse text-sm mb-4">
          <thead>
            <tr>
              {["Feature", "Test Case", "Expected Result", "Status", ""].map(
                (header) => (
                  <th
                    key={header || "actions"}
                    className="text-left px-2 py-1.5 border-b border-border-mid font-medium text-muted-light"
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {tests.map((test) => {
              const isEditing = editingId === test.test_id;
              return (
                <tr key={test.test_id}>
                  {isEditing ? (
                    <>
                      <td className="px-2 py-1.5 border-b border-border-faint">
                        <input
                          value={editDraft.feature}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              feature: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md"
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-border-faint">
                        <input
                          value={editDraft.test_case}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              test_case: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md"
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-border-faint">
                        <input
                          value={editDraft.expected_result}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              expected_result: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md"
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-border-faint">
                        <span className={`${statusColors[test.status]} font-medium`}>
                          {test.status}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 border-b border-border-faint whitespace-nowrap">
                        <button
                          onClick={() => handleSave(test.test_id)}
                          disabled={saving}
                          className={`text-xs mr-2 border-none bg-none cursor-pointer ${
                            saving
                              ? "text-muted-light cursor-wait"
                              : "text-success"
                          }`}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className={`text-xs border-none bg-none cursor-pointer ${
                            saving
                              ? "text-muted-light cursor-not-allowed"
                              : "text-muted-lighter"
                          }`}
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-2 py-1.5 border-b border-border-faint">
                        {test.feature}
                      </td>
                      <td className="px-2 py-1.5 border-b border-border-faint">
                        {test.test_case}
                      </td>
                      <td className="px-2 py-1.5 border-b border-border-faint">
                        {test.expected_result}
                      </td>
                      <td className="px-2 py-1.5 border-b border-border-faint">
                        <span className={`${statusColors[test.status]} font-medium`}>
                          {test.status}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 border-b border-border-faint whitespace-nowrap">
                        <button
                          onClick={() => startEdit(test)}
                          className="text-xs text-muted-lighter border-none bg-none cursor-pointer mr-2"
                        >
                          edit
                        </button>
                        <button
                          onClick={() => onDeleteTest(test.test_id)}
                          className="text-xs text-muted-lighter border-none bg-none cursor-pointer"
                        >
                          remove
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
        <input
          placeholder="Feature"
          value={draft.feature}
          onChange={(e) => setDraft({ ...draft, feature: e.target.value })}
          className="px-2.5 py-1.5 text-sm border border-border rounded-md"
        />
        <input
          placeholder="Test case"
          value={draft.test_case}
          onChange={(e) => setDraft({ ...draft, test_case: e.target.value })}
          className="px-2.5 py-1.5 text-sm border border-border rounded-md"
        />
        <input
          placeholder="Expected result"
          value={draft.expected_result}
          onChange={(e) =>
            setDraft({ ...draft, expected_result: e.target.value })
          }
          className="px-2.5 py-1.5 text-sm border border-border rounded-md"
        />
        <button
          onClick={handleAdd}
          disabled={adding}
          className={`px-3.5 py-1.5 text-sm rounded-md border cursor-pointer ${
            adding
              ? "bg-gray-100 cursor-wait"
              : "bg-white"
          }`}
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}
