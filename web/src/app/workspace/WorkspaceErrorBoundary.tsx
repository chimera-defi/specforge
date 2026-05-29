"use client";

import { Component, ReactNode } from "react";
import styles from "../page.module.css";

interface Props {
  children: ReactNode;
  stage?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

class ComponentErrorBoundary extends Component<
  ErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("Workspace ErrorBoundary caught an error:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export function WorkspaceErrorBoundary({ children, stage }: Props) {
  const fallback = (
    <div className={styles.panel} style={{ padding: "2rem" }}>
      <h2 style={{ color: "#ef4444", marginBottom: "1rem" }}>
        Workspace Error
      </h2>
      <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
        {stage ? `An error occurred in the ${stage} stage.` : "An error occurred in the workspace."}
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "0.375rem",
          cursor: "pointer",
        }}
      >
        Refresh Page
      </button>
    </div>
  );

  return (
    <ComponentErrorBoundary fallback={fallback}>
      {children}
    </ComponentErrorBoundary>
  );
}