import type { Metadata } from "next";
import Link from "next/link";
import { Terminal, Wifi, Cpu, ArrowRight, MonitorDot, Cloud, Download } from "lucide-react";
import { CopyButton } from "./copy-button";
import { SiteNav } from "@/components/site-nav";

const GITHUB_URL = "https://github.com/chimera-defi/specforge";

export const metadata: Metadata = {
  title: "Download SpecForge",
  description: "Run SpecForge locally — no account required.",
};

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="overflow-hidden rounded-panel border border-border-dark shadow-card">
      {label && (
        <div
          className="flex items-center justify-between border-b border-border-dark bg-surface-elevated/70"
          style={{ paddingLeft: "1rem", paddingRight: "1rem", paddingTop: "0.625rem", paddingBottom: "0.625rem" }}
        >
          <span className="font-mono text-xs font-semibold text-primary-foreground/60">{label}</span>
          <CopyButton text={code} />
        </div>
      )}
      <div className="bg-ink-dark" style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "1rem", paddingBottom: "1rem" }}>
        <pre className="overflow-x-auto whitespace-pre font-mono text-sm leading-relaxed text-primary-foreground">
          {code}
        </pre>
        <p className="text-[0.72rem] text-primary-foreground/70 md:hidden" style={{ marginTop: "0.5rem" }}>
          Swipe horizontally to view long commands.
        </p>
      </div>
    </div>
  );
}

const roadmap = [
  {
    status: "now",
    label: "Local Bun alpha",
    icon: <Terminal size={18} />,
    description:
      "Run SpecForge locally with your existing Bun setup. No account required, no cloud lock-in.",
    statusClass: "bg-success-subtle text-success border-success-subtle",
  },
  {
    status: "next",
    label: "Tauri desktop app",
    icon: <MonitorDot size={18} />,
    description:
      "One-click launcher for web + collab sidecars with runtime checks and local diagnostics.",
    statusClass: "bg-warning-subtle text-warning border-warning-subtle",
  },
  {
    status: "later",
    label: "Hosted pilot",
    icon: <Cloud size={18} />,
    description:
      "Managed collaboration runtime for teams that want hosted onboarding and centralized workspace ops.",
    statusClass: "bg-border text-primary-foreground/60 border-border",
  },
];

const quickStart = `# 1. Clone and install
git clone https://github.com/chimera-defi/specforge
cd specforge
bun install

# 2. Start the web app
bun run dev:web

# 3. Open the workspace
open http://localhost:3000/workspace`;

const multiplayerCode = `# In a second terminal
bun run dev:collab
# Opens a WebSocket room at ws://localhost:4321`;

const aiAssistCode = `# Claude Code
npm install -g @anthropic-ai/claude-code

# Or Codex
npm install -g @openai/codex`;

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      <SiteNav
        variant="dark"
        ctaHref="/workspace?source=download_nav"
        ctaLabel="Open workspace"
        ctaVariant="default"
      />

      <main>
        <section
          className="grid w-full grid-cols-1 gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-start"
          style={{
            maxWidth: "1180px",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "clamp(1.5rem, 5vw, 4rem)",
            paddingRight: "clamp(1.5rem, 5vw, 4rem)",
            paddingTop: "3.5rem",
            paddingBottom: "3rem",
          }}
        >
          <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-accent">Get SpecForge</p>
            <h1 className="text-balance text-[clamp(2.55rem,5.5vw,4.3rem)] font-black leading-[1.05] tracking-tight" style={{ maxWidth: "16ch" }}>
              Start with the local alpha now. Ship the desktop app next.
            </h1>
            <p className="text-[1.03rem] leading-[1.72] text-primary-foreground/60" style={{ maxWidth: "56ch" }}>
              Current alpha truth: local-first workflow, governed patch review, and launch-packet export
              without handing your source context to a hosted editor.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#quick-start"
                className="inline-flex min-h-[2.95rem] items-center gap-2 rounded-full bg-accent font-semibold text-accent-foreground shadow-accent transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-accent-hover)] active:scale-[0.98]"
                style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
              >
                Install local alpha
                <ArrowRight size={16} />
              </a>
              <Link
                href="/workspace"
                className="inline-flex min-h-[2.95rem] items-center rounded-full border border-border-dark bg-surface-elevated text-sm font-semibold text-primary-foreground transition-colors hover:bg-surface-elevated/80 active:scale-[0.98]"
                style={{ paddingLeft: "1rem", paddingRight: "1rem", paddingTop: "0.625rem", paddingBottom: "0.625rem" }}
              >
                Open workspace demo
              </Link>
              <Link
                href="/pricing"
                className="inline-flex min-h-[2.95rem] items-center rounded-full border border-border-dark bg-surface-elevated text-sm font-semibold text-primary-foreground transition-colors hover:bg-surface-elevated/80 active:scale-[0.98]"
                style={{ paddingLeft: "1rem", paddingRight: "1rem", paddingTop: "0.625rem", paddingBottom: "0.625rem" }}
              >
                See hosted pilot plans
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className="inline-flex items-center gap-2 rounded-full border border-border-dark bg-surface-elevated text-sm text-primary-foreground/60"
                style={{ paddingLeft: "1rem", paddingRight: "1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
              >
                <Download size={14} className="text-accent" />
                Current alpha truth
              </span>
              <span
                className="inline-flex items-center gap-2 rounded-full border border-border-dark bg-surface-elevated text-sm text-primary-foreground/60"
                style={{ paddingLeft: "1rem", paddingRight: "1rem", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
              >
                Desktop app next
              </span>
            </div>
          </div>

          <div className="rounded-card border border-border-dark bg-surface-elevated shadow-card animate-fade-up [animation-delay:120ms]" style={{ padding: "1.25rem" }}>
            <h2 className="text-base font-black tracking-tight" style={{ marginBottom: "1rem" }}>Distribution plan</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {roadmap.map(({ status, label, icon, statusClass }) => (
                <div
                  key={status}
                  className="flex items-center gap-3 rounded-lg border border-border-dark bg-surface-elevated/40"
                  style={{ paddingLeft: "0.75rem", paddingRight: "0.75rem", paddingTop: "0.625rem", paddingBottom: "0.625rem" }}
                >
                  <span
                    className={`inline-flex min-w-[3.5rem] items-center justify-center rounded-full border text-[0.65rem] font-bold uppercase tracking-wider ${statusClass}`}
                    style={{ paddingLeft: "0.625rem", paddingRight: "0.625rem", paddingTop: "0.125rem", paddingBottom: "0.125rem" }}
                  >
                    {status}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-medium text-primary-foreground/60">
                    <span className="text-primary-foreground/60/70">{icon}</span>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="quick-start"
          className="w-full"
          style={{
            maxWidth: "1180px",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "clamp(1.5rem, 5vw, 4rem)",
            paddingRight: "clamp(1.5rem, 5vw, 4rem)",
            paddingBottom: "3rem",
          }}
        >
          <h2 className="text-xl font-black tracking-tight" style={{ marginBottom: "0.5rem" }}>Quick start</h2>
          <p className="text-primary-foreground/60 leading-relaxed" style={{ marginBottom: "1.25rem", maxWidth: "55ch" }}>
            Clone, install, and open the workspace in under a minute. Requires{" "}
            <a
              href="https://bun.sh"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline underline-offset-2 transition-opacity hover:opacity-80"
            >
              Bun
            </a>
            . No external database setup is required for local alpha use.
          </p>
          <CodeBlock code={quickStart} label="terminal" />
        </section>

        <section
          className="grid w-full grid-cols-1 gap-4 md:grid-cols-[1fr_1fr]"
          style={{
            maxWidth: "1180px",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "clamp(1.5rem, 5vw, 4rem)",
            paddingRight: "clamp(1.5rem, 5vw, 4rem)",
            paddingBottom: "3rem",
          }}
        >
          <div className="rounded-panel border border-border-dark bg-surface-elevated shadow-card" style={{ padding: "1.25rem" }}>
            <div className="flex items-center gap-2" style={{ marginBottom: "0.5rem" }}>
              <Wifi size={18} className="text-accent" />
              <h2 className="text-xl font-black tracking-tight">With multiplayer</h2>
            </div>
            <p className="text-primary-foreground/60 leading-relaxed" style={{ marginBottom: "1.25rem", maxWidth: "55ch" }}>
              Start the collab server beside the web app for realtime presence and shared room state.
            </p>
            <CodeBlock code={multiplayerCode} label="second terminal" />
          </div>

          <div className="rounded-panel border border-border-dark bg-surface-elevated shadow-card" style={{ padding: "1.25rem" }}>
            <div className="flex items-center gap-2" style={{ marginBottom: "0.5rem" }}>
              <Cpu size={18} className="text-accent" />
              <h2 className="text-xl font-black tracking-tight">AI assist (optional)</h2>
            </div>
            <p className="text-primary-foreground/60 leading-relaxed" style={{ marginBottom: "1.25rem", maxWidth: "55ch" }}>
              Reuse local Claude Code CLI or Codex CLI credentials for guided field population and patch proposals.
            </p>
            <CodeBlock code={aiAssistCode} label="install AI CLI" />
          </div>
        </section>
      </main>

      <footer className="border-t border-border-dark">
        <div
          className="flex w-full flex-wrap items-center justify-between gap-4"
          style={{
            maxWidth: "1180px",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "clamp(1.5rem, 5vw, 4rem)",
            paddingRight: "clamp(1.5rem, 5vw, 4rem)",
            paddingTop: "1.5rem",
            paddingBottom: "1.5rem",
          }}
        >
          <span className="text-[0.76rem] font-black uppercase tracking-[0.24em] text-primary-foreground/35">
            SpecForge Studio
          </span>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-6">
            <Link href="/" className="text-sm text-primary-foreground/35 transition-colors hover:text-primary-foreground/75">
              Home
            </Link>
            <Link href="/pricing" className="text-sm text-primary-foreground/35 transition-colors hover:text-primary-foreground/75">
              Pricing
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub (opens in new tab)"
              className="text-sm text-primary-foreground/35 transition-colors hover:text-primary-foreground/75"
            >
              GitHub
            </a>
            <Link href="/workspace" className="text-sm text-primary-foreground/35 transition-colors hover:text-primary-foreground/75">
              Workspace
            </Link>
          </nav>
          <p className="text-sm text-primary-foreground/35">&copy; {new Date().getFullYear()} SpecForge</p>
        </div>
      </footer>
    </div>
  );
}
