"use client";

import { useState, useTransition } from "react";

import {
  resetWorkspaceDocumentsAction,
  seedReviewDemoAction,
} from "./actions";
import styles from "./page.module.css";

function isRedirectError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("NEXT_REDIRECT");
}

type Props = {
  authMode: "local" | "github" | "unauthenticated";
  activeDocumentId: string | null;
};

export function LocalAdminPanel({ authMode, activeDocumentId }: Props) {
  const [isResetPending, startResetTransition] = useTransition();
  const [isSeedPending, startSeedTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const isPending = isResetPending || isSeedPending;

  if (authMode !== "local") {
    return null;
  }

  function handleReset(formData: FormData) {
    const confirmed = window.confirm(
      "This will permanently delete all documents in this workspace. Are you sure?",
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    setPendingAction("reset");

    startResetTransition(async () => {
      try {
        await resetWorkspaceDocumentsAction(formData);
      } catch (err) {
        if (isRedirectError(err)) {
          throw err;
        }
        console.error("Reset workspace failed:", err);
        setError("Failed to reset workspace. Please try again.");
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleSeed(formData: FormData) {
    setError(null);
    setPendingAction("seed");

    startSeedTransition(async () => {
      try {
        await seedReviewDemoAction(formData);
      } catch (err) {
        if (isRedirectError(err)) {
          throw err;
        }
        console.error("Seed review activity failed:", err);
        setError("Failed to seed review activity. Please try again.");
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <details className={styles.panel}>
      <summary className={styles.disclosureSummary}>
        <span>Local admin</span>
        <span>Mock + reset</span>
      </summary>
      <div className={styles.disclosureBody}>
        <p className={styles.stageDescription}>
          Use local-only controls to reset the demo workspace or seed review activity without
          editing the store by hand.
        </p>
        {error ? (
          <p className={styles.context} style={{ color: "var(--color-danger, #ef4444)" }}>
            {error}
          </p>
        ) : null}
        <div className={styles.inlineActions}>
          <form action={handleReset}>
            <input type="hidden" name="return_to" value="/workspace?stage=start" />
            <button type="submit" disabled={isPending && pendingAction === "reset"}>
              {isPending && pendingAction === "reset" ? "Resetting\u2026" : "Reset workspace data"}
            </button>
          </form>
          {activeDocumentId ? (
            <form action={handleSeed}>
              <input type="hidden" name="document_id" value={activeDocumentId} />
              <button type="submit" disabled={isPending && pendingAction === "seed"}>
                {isPending && pendingAction === "seed"
                  ? "Seeding\u2026"
                  : "Seed review activity"}
              </button>
            </form>
          ) : null}
        </div>
        <span className={styles.metaText}>Local demo only. Hidden once pilot auth is active.</span>
      </div>
    </details>
  );
}
