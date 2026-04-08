import type { Metadata } from "next";
import Link from "next/link";
import { Terminal, Wifi, Cpu, ArrowRight, Copy, MonitorDot, Cloud } from "lucide-react";

export const metadata: Metadata = {
  title: "Download SpecForge",
  description: "Run SpecForge locally — no account required.",
};

function Nav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-[0.8rem] font-bold uppercase tracking-[0.2em] text-foreground hover:opacity-70 transition-opacity"
        >
          SpecForge
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[2.75rem] inline-flex items-center"
          >
            Home
          </Link>
          <Link
            href="/pricing"
            className="rounded-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[2.75rem] inline-flex items-center"
          >
            Pricing
          </Link>
          <Link
            href="/workspace"
            className="ml-2 inline-flex min-h-[2.75rem] items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            Open workspace
          </Link>
        </nav>
      </div>
    </header>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-[var(--shadow-card)]">
      {label && (
        <div className="flex items-center justify-between border-b border-border bg-surface-light/60 px-4 py-2.5">
          <span className="text-xs font-semibold text-muted-foreground font-mono">{label}</span>
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Copy to clipboard"
          >
            <Copy size={11} />
            Copy
          </button>
        </div>
      )}
      <div className="bg-[#121922] px-5 py-4">
        <pre className="overflow-x-auto text-sm leading-relaxed text-[#f7f4ec] font-mono whitespace-pre">
          {code}
        </pre>
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
      "Run SpecForge entirely locally. Works with your existing Bun setup — no cloud, no account, full multiplayer when you start the collab server.",
    statusClass: "bg-success-subtle text-success border-success-subtle",
  },
  {
    status: "next",
    label: "Tauri desktop app",
    icon: <MonitorDot size={18} />,
    description:
      "Tauri shell around the existing local product. Start all services with one click — no terminal required. Same assist model, cleaner onboarding.",
    statusClass: "bg-warning-subtle text-warning border-warning-subtle",
  },
  {
    status: "later",
    label: "Hosted pilot",
    icon: <Cloud size={18} />,
    description:
      "Managed SaaS for teams that want shared workspaces without running anything locally. Remote collaboration and persistence, workspace-managed credentials.",
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
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-4 pt-12 pb-12 grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="flex flex-col gap-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Get SpecForge</p>
          <h1 className="text-[clamp(2.3rem,4.5vw,4rem)] font-extrabold leading-[1.0] text-balance max-w-[14ch]">
            Run SpecForge locally
          </h1>
          <p className="text-[1.05rem] leading-[1.7] max-w-[55ch] text-muted-foreground">
            No account. No cloud. Your specs stay on your machine. The fastest way to try
            SpecForge is the local Bun path below.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/workspace"
              className="inline-flex min-h-[2.9rem] items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
            >
              Open workspace
              <ArrowRight size={16} />
            </Link>
            <a
              href="#quick-start"
              className="inline-flex min-h-[2.9rem] items-center rounded-full border border-border bg-card px-5 py-3 font-semibold text-foreground transition-colors hover:bg-surface-light active:scale-[0.98]"
            >
              Quick start
            </a>
          </div>
        </div>

        {/* Distribution roadmap summary */}
        <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] p-5 space-y-3">
          <h2 className="text-base font-bold mb-4">Distribution plan</h2>
          {roadmap.map(({ status, label, icon, statusClass }) => (
            <div key={status} className="flex items-center gap-3">
              <span
                className={`inline-flex min-w-[3.5rem] items-center justify-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${statusClass}`}
              >
                {status}
              </span>
              <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="text-muted-foreground/60">{icon}</span>
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quick start ─────────────────────────────────────────────────── */}
      <section id="quick-start" className="mx-auto w-full max-w-[1100px] px-4 pb-12">
        <h2 className="text-xl font-bold text-balance mb-2">Quick start</h2>
        <p className="text-muted-foreground leading-relaxed max-w-[55ch] mb-5">
          Clone, install, and open the workspace in under a minute. Requires{" "}
          <a
            href="https://bun.sh"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Bun
          </a>
          . No database setup needed — SpecForge uses embedded PGlite.
        </p>
        <CodeBlock code={quickStart} label="terminal" />
      </section>

      {/* ── With multiplayer ────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-4 pb-12">
        <div className="flex items-center gap-2 mb-2">
          <Wifi size={18} className="text-accent" />
          <h2 className="text-xl font-bold text-balance">With multiplayer</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-[55ch] mb-5">
          Start the collab server alongside the web app for live collaboration via WebSocket.
          Remote cursors and real-time presence work automatically once connected.
        </p>
        <CodeBlock code={multiplayerCode} label="second terminal" />
      </section>

      {/* ── AI assist ───────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-4 pb-12">
        <div className="flex items-center gap-2 mb-2">
          <Cpu size={18} className="text-accent" />
          <h2 className="text-xl font-bold text-balance">AI assist (optional)</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-[55ch] mb-5">
          SpecForge uses your local Claude Code CLI or Codex CLI for guided spec suggestions.
          Install either one to enable AI-powered field population and patch proposals.
        </p>
        <CodeBlock code={aiAssistCode} label="install AI CLI" />
      </section>

      {/* ── Distribution roadmap ────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-4 pb-16">
        <h2 className="text-xl font-bold text-balance mb-2">How we will distribute it</h2>
        <p className="text-muted-foreground leading-relaxed max-w-[55ch] mb-8">
          The local alpha is available now. Desktop packaging is next, then a hosted SaaS pilot.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {roadmap.map(({ status, label, icon, description, statusClass }) => (
            <div
              key={status}
              className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {icon}
                  <strong className="text-sm font-semibold text-foreground">{label}</strong>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${statusClass}`}
                >
                  {status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-4 px-4 py-6">
          <span className="text-[0.8rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            SpecForge
          </span>
          <nav className="flex flex-wrap items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/workspace" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Workspace
            </Link>
          </nav>
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} SpecForge</p>
        </div>
      </footer>
    </div>
  );
}
