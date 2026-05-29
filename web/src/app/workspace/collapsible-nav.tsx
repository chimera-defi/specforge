"use client";

import { useState } from "react";
import Link from "next/link";
import { APP_CONFIG } from "@/lib/constants";
import styles from "../page.module.css";

type Props = {
  docTitle: string;
  stageLabel: string | null;
  shareUrl: string;
};

export function CollapsibleWorkspaceNav({ docTitle, stageLabel, shareUrl }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), APP_CONFIG.COPY_FEEDBACK_DURATION);
    } catch {
      // ignore
    }
  }

  return (
    <header
      className={styles.workspaceNav}
      style={collapsed ? { height: "36px", padding: "0 16px" } : undefined}
    >
      <Link href="/" className={styles.workspaceNavBrand}>
        SpecForge
      </Link>

      {!collapsed && (
        <div className={styles.workspaceNavCenter}>
          <span className={styles.workspaceNavDoc}>{docTitle}</span>
          {stageLabel ? (
            <span className={styles.workspaceNavStage}>{stageLabel}</span>
          ) : null}
        </div>
      )}

      <nav className={styles.workspaceNavLinks} style={{ gap: "6px" }}>
        {!collapsed && (
          <>
            <Link href="/" className={styles.workspaceNavLink}>
              Home
            </Link>
            <Link href="/pricing" className={styles.workspaceNavLink}>
              Pricing
            </Link>
            <Link href="/download" className={styles.workspaceNavLink}>
              Download
            </Link>
          </>
        )}
        <button
          onClick={handleCopy}
          title="Copy share link to clipboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "6px 12px",
            borderRadius: "999px",
            fontSize: "0.84rem",
            fontWeight: 600,
            color: "var(--sf-surface-warm)",
            background: "var(--sf-teal)",
            border: "none",
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          {copied ? "✓ Copied" : "📤 Share"}
        </button>
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand nav" : "Collapse nav"}
          aria-label={collapsed ? "Expand nav" : "Collapse nav"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "999px",
            fontSize: "0.78rem",
            color: "var(--sf-muted-warm)",
            background: "transparent",
            border: "1px solid var(--sf-border)",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
        >
          {collapsed ? "▼" : "▲"}
        </button>
        <Link href="/pilot-access" className={styles.workspaceNavLinkAccent}>
          Pilot access
        </Link>
      </nav>
    </header>
  );
}
