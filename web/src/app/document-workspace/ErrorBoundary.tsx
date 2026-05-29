"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  documentId: string;
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
    console.error("DocumentWorkspace ErrorBoundary caught an error:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export function DocumentWorkspaceErrorBoundary({ children, documentId }: Props) {
  const fallback = (
    <div style={{
      padding: "2rem",
      maxWidth: "600px",
      margin: "2rem auto",
      textAlign: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      <h2 style={{ color: "#ef4444", marginBottom: "1rem" }}>
        Document Error
      </h2>
      <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
        An error occurred while loading the document. Please try refreshing the page.
      </p>
      <details
        style={{
          textAlign: "left",
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "#f3f4f6",
          borderRadius: "0.5rem",
          fontSize: "0.875rem",
        }}
      >
        <summary style={{ cursor: "pointer", marginBottom: "0.5rem" }}>
          Error details
        </summary>
        <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
          Document ID: <code>{documentId}</code>
        </p>
      </details>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "0.375rem",
          cursor: "pointer",
          fontSize: "1rem",
          marginTop: "1rem",
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