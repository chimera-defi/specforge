"use client";

/**
 * AcceptanceTestSection
 *
 * Client wrapper that manages acceptance test state and wires CRUD + run
 * callbacks for the AcceptanceTestMatrix component.
 *
 * Receives initial tests as a server-side prop; subsequent mutations call
 * the API and refresh local state so the page doesn't need a full reload.
 */

import { useCallback, useState } from "react";

import type { AcceptanceTest } from "@/lib/specforge/acceptance-tests";
import {
  AcceptanceTestMatrix,
  type AcceptanceTestDraft,
} from "./AcceptanceTestMatrix";
import { acceptanceTestApi } from "@/lib/api-client";

type RunResult = {
  evaluated: number;
  passed: number;
  failed: number;
};

type AcceptanceTestSectionProps = {
  documentId: string;
  initialTests: AcceptanceTest[];
};

export function AcceptanceTestSection({
  documentId,
  initialTests,
}: AcceptanceTestSectionProps) {
  const [tests, setTests] = useState<AcceptanceTest[]>(initialTests);
  const [runResult, setRunResult] = useState<RunResult | null>(null);

  const handleAddTest = useCallback(
    async (draft: AcceptanceTestDraft) => {
      const json = await acceptanceTestApi.create(documentId, draft) as { matrix: { tests: AcceptanceTest[] } };
      setTests(json.matrix.tests);
    },
    [documentId],
  );

  const handleUpdateTest = useCallback(
    async (testId: string, updates: Partial<AcceptanceTestDraft>) => {
      const json = await acceptanceTestApi.update(documentId, testId, updates) as { test: AcceptanceTest };
      setTests((prev) => prev.map((t) => (t.test_id === testId ? json.test : t)));
    },
    [documentId],
  );

  const handleDeleteTest = useCallback(
    async (testId: string) => {
      await acceptanceTestApi.delete(documentId, testId);
      setTests((prev) => prev.filter((t) => t.test_id !== testId));
    },
    [documentId],
  );

  const handleRunTests = useCallback(async () => {
    setRunResult(null);
    const json = await acceptanceTestApi.run(documentId) as RunResult & { matrix: { tests: AcceptanceTest[] } };
    setTests(json.matrix.tests);
    setRunResult({ evaluated: json.evaluated, passed: json.passed, failed: json.failed });
  }, [documentId]);

  return (
    <div>
      {runResult && runResult.evaluated > 0 && (
        <div
          style={{
            marginBottom: "12px",
            padding: "8px 14px",
            borderRadius: "6px",
            background: runResult.failed === 0 ? "var(--sf-success-subtle)" : "var(--sf-warning-subtle)",
            border: `1px solid ${runResult.failed === 0 ? "var(--sf-success)" : "var(--sf-warning)"}`,
            fontSize: "13px",
            color: "var(--sf-ink)",
          }}
        >
          Evaluated {runResult.evaluated} pending tests — {runResult.passed} passed, {runResult.failed} need spec expansion.
        </div>
      )}
      <AcceptanceTestMatrix
        tests={tests}
        documentId={documentId}
        onAddTest={handleAddTest}
        onUpdateTest={handleUpdateTest}
        onDeleteTest={handleDeleteTest}
        onRunTests={handleRunTests}
      />
    </div>
  );
}
