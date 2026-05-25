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
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border-mid shadow-[var(--shadow-card)]">
      {label && (
        <div className="flex items-center justify-between border-b border-border bg-surface-light/70 px-4 py-2.5">
          <span className="font-mono text-xs font-semibold text-muted-foreground">{label}</span>
          <CopyButton text={code} />
        </div>
      )}
      <div className="bg-ink-dark px-5 py-4">
        <pre className="overflow-x-auto whitespace-pre font-mono text-sm leading-relaxed text-primary-foreground">
          {code}
        </pre>
        <p className="mt-2 text-[0.72rem] text-primary-foreground/70 md:hidden">
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
    statusClass: "bg-border text-muted-foreground border-border",
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
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav
        variant="light"
        ctaHref="/workspace?source=download_nav"
        ctaLabel="Open workspace"
        ctaVariant="default"
      />

      <section className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-10 px-4 pb-12 pt-14 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
        <div className="space-y-5 animate-fade-up">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-accent">Get SpecForge</p>
          <h1 className="max-w-[16ch] text-balance text-[clamp(2.55rem,5.5vw,4.3rem)] font-black leading-[1.05] tracking-tight">
            Start with the local alpha now. Ship the desktop app next.
          </h1>
          <p className="max-w-[56ch] text-[1.03rem] leading-[1.72] text-muted-foreground">
            Current alpha truth: local-first workflow, governed patch review, and launch-packet export
            without handing your source context to a hosted editor.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#quick-start"
              className="inline-flex min-h-[2.95rem] items-center gap-2 rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground shadow-[var(--shadow-accent)] transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-accent-hover)] active:scale-[0.98]"
            >
              Install local alpha
              <ArrowRight size={16} />
            </a>
            <Link
              href="/workspace"
              className="inline-flex min-h-[2.95rem] items-center rounded-full border border-border-mid bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-light active:scale-[0.98]"
            >
              Open workspace demo
            </Link>
            <Link
              href="/pricing"
              className="inline-flex min-h-[2.95rem] items-center rounded-full border border-border-mid bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-light active:scale-[0.98]"
            >
              See hosted pilot plans
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border-mid bg-card px-4 py-2 text-sm text-muted-foreground">
              <Download size={14} className="text-accent" />
              Current alpha truth
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border-mid bg-card px-4 py-2 text-sm text-muted-foreground">
              Desktop app next
            </span>
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border-mid bg-card p-5 shadow-[var(--shadow-card)] animate-fade-up [animation-delay:120ms]">
          <h2 className="mb-4 text-base font-black tracking-tight">Distribution plan</h2>
          <div className="space-y-3">
            {roadmap.map(({ status, label, icon, statusClass }) => (
              <div key={status} className="flex items-center gap-3 rounded-lg border border-border-mid bg-surface-light/40 px-3 py-2.5">
                <span
                  className={`inline-flex min-w-[3.5rem] items-center justify-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${statusClass}`}
                >
                  {status}
                </span>
                <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <span className="text-muted-foreground/70">{icon}</span>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="quick-start" className="mx-auto w-full max-w-[1180px] px-4 pb-12">
        <h2 className="mb-2 text-xl font-black tracking-tight">Quick start</h2>
        <p className="mb-5 max-w-[55ch] text-muted-foreground leading-relaxed">
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

      <section className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-4 px-4 pb-12 md:grid-cols-[1fr_1fr]">
        <div className="rounded-[var(--radius-panel)] border border-border-mid bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-2 flex items-center gap-2">
            <Wifi size={18} className="text-accent" />
            <h2 className="text-xl font-black tracking-tight">With multiplayer</h2>
          </div>
          <p className="mb-5 max-w-[55ch] text-muted-foreground leading-relaxed">
            Start the collab server beside the web app for realtime presence and shared room state.
          </p>
          <CodeBlock code={multiplayerCode} label="second terminal" />
        </div>

        <div className="rounded-[var(--radius-panel)] border border-border-mid bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-2 flex items-center gap-2">
            <Cpu size={18} className="text-accent" />
            <h2 className="text-xl font-black tracking-tight">AI assist (optional)</h2>
          </div>
          <p className="mb-5 max-w-[55ch] text-muted-foreground leading-relaxed">
            Reuse local Claude Code CLI or Codex CLI credentials for guided field population and patch proposals.
          </p>
          <CodeBlock code={aiAssistCode} label="install AI CLI" />
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-4 px-4 py-6">
          <span className="text-[0.76rem] font-black uppercase tracking-[0.24em] text-muted-foreground">
            SpecForge Studio
          </span>
          <nav className="flex flex-wrap items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Home
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <Link href="/workspace" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Workspace
            </Link>
          </nav>
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} SpecForge</p>
        </div>
      </footer>
    </div>
  );
}
