"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "../page.module.css";

type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";

type BillingApiResponse = {
  workspace: {
    workspace_id: string;
    name: string;
    plan: string;
  };
  billing: {
    plan: string;
    seatPriceMonthlyUsd: number | null;
    billableSeats: number;
    estimatedMonthlyUsd: number | null;
  };
  status: {
    plan: string;
    estimatedMonthlyUsd: number | null;
    upgradeRequired: boolean;
    recommendedPlan: string | null;
    reasons: string[];
  };
  subscription: {
    workspaceId: string;
    planId: string;
    status: SubscriptionStatus;
    currentPeriodEnd: string | null;
  } | null;
};

function formatCurrency(value: number | null) {
  if (value === null) {
    return "Free";
  }
  return `$${value}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusClass(status: SubscriptionStatus | "unknown") {
  if (status === "active" || status === "trialing") {
    return styles.success;
  }
  if (status === "past_due") {
    return styles.warning;
  }
  return styles.neutral;
}

function getStatusLabel(status: SubscriptionStatus | "unknown") {
  return status.replaceAll("_", " ");
}

export function BillingStatusPanel() {
  const [data, setData] = useState<BillingApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/workspace/billing")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Billing status unavailable");
        }

        const payload = (await response.json()) as BillingApiResponse;
        setData(payload);
        setError(null);
      })
      .catch(() => {
        setError("Could not load live subscription status.");
      })
      .finally(() => setLoading(false));
  }, []);

  const subscriptionStatus = data?.subscription?.status ?? "unknown";
  const statusBadgeClass = getStatusClass(subscriptionStatus);

  return (
    <details className={styles.panel} id="billing-readiness">
      <summary className={styles.disclosureSummary}>
        <span>Billing readiness</span>
        <span>
          <span className={`${styles.badge} ${statusBadgeClass}`}>
            {getStatusLabel(subscriptionStatus)}
          </span>
        </span>
      </summary>
      <div className={styles.disclosureBody}>
        {loading ? <p className={styles.context}>Loading live billing status...</p> : null}
        {error ? (
          <div className={styles.actorCard}>
            <strong>Billing check unavailable</strong>
            <span>{error}</span>
          </div>
        ) : null}
        {data ? (
          <>
            <div className={styles.actorCard}>
              <strong>{data.workspace.name}</strong>
              <span>Workspace plan: {data.workspace.plan}</span>
              <span>Subscription plan: {data.subscription?.planId ?? "none"}</span>
              <span>
                Period end: {formatDate(data.subscription?.currentPeriodEnd ?? null)}
              </span>
            </div>

            <div className={styles.metricGrid}>
              <div className={styles.metricCard}>
                <strong>{formatCurrency(data.billing.estimatedMonthlyUsd)}</strong>
                <span>monthly estimate</span>
              </div>
              <div className={styles.metricCard}>
                <strong>{data.billing.billableSeats}</strong>
                <span>billable seats</span>
              </div>
              <div className={styles.metricCard}>
                <strong>{data.billing.seatPriceMonthlyUsd === null ? "n/a" : `$${data.billing.seatPriceMonthlyUsd}`}</strong>
                <span>seat price</span>
              </div>
              <div className={styles.metricCard}>
                <strong>{data.status.recommendedPlan ?? "current"}</strong>
                <span>recommended plan</span>
              </div>
            </div>

            {data.status.upgradeRequired ? (
              <div className={styles.actorCard}>
                <strong>Upgrade suggested</strong>
                {data.status.reasons.map((reason) => (
                  <span key={reason}>{reason}</span>
                ))}
              </div>
            ) : (
              <div className={styles.actorCard}>
                <strong>No billing blockers detected</strong>
                <span>Your current usage is within workspace plan limits.</span>
              </div>
            )}

            <div className={styles.inlineActions}>
              <Link
                href="/pilot-access?source=workspace_billing_panel&plan=pilot"
                className={styles.exportLink}
              >
                Request pilot access
              </Link>
              <Link href="/pricing?source=workspace_billing_panel" className={styles.secondaryLink}>
                Compare plans
              </Link>
              <Link href="/api/workspace/billing" className={styles.secondaryLink}>
                Billing JSON
              </Link>
              <Link href="/api/workspace/entitlements" className={styles.secondaryLink}>
                Entitlements JSON
              </Link>
              <Link href="/api/workspace/plans" className={styles.secondaryLink}>
                Plans JSON
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </details>
  );
}
