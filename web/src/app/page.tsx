import Link from "next/link";
import {
  GitMerge,
  Users,
  ShieldCheck,
  Package,
  Terminal,
  ArrowRight,
  CheckCircle2,
  FileText,
  Zap,
} from "lucide-react";
import { heroVariantOrder, heroVariants, type HeroVariant } from "@/lib/specforge/marketing";

type Props = {
  searchParams?: Promise<{ variant?: string }>;
};

// ── Shared nav component ────────────────────────────────────────────────────
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
            href="/download"
            className="rounded-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[2.75rem] inline-flex items-center"
          >
            Download
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

// ── Patch review mockup — hero visual ──────────────────────────────────────
function PatchMockup() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-light/60 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-destructive/40" />
        <span className="h-3 w-3 rounded-full bg-warning/40" />
        <span className="h-3 w-3 rounded-full bg-success/40" />
        <span className="ml-3 text-xs text-muted-foreground font-mono">patch-queue · 3 pending</span>
      </div>

      {/* Patch card */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-subtle px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-blue-info border border-blue-subtle">
              Agent patch
            </span>
            <span className="text-xs text-muted-foreground">Claude Code · 2m ago</span>
          </div>
          <span className="text-xs text-muted-foreground">Auth section</span>
        </div>

        <p className="text-sm font-medium leading-snug text-foreground">
          Add structured error handling to the authentication flow for token expiry edge cases.
        </p>

        {/* Diff preview */}
        <div className="rounded-lg border border-success-subtle bg-success-subtle/60 p-3 font-mono text-xs leading-relaxed text-success space-y-0.5">
          <div>+ try-catch around token refresh calls</div>
          <div>+ return 401 with &quot;refresh_required&quot; hint</div>
          <div>+ add expiry timestamp to JWT decode check</div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button className="inline-flex min-h-[2rem] items-center rounded-full bg-success px-4 py-1 text-xs font-semibold text-white gap-1.5 hover:opacity-90 transition-opacity">
            <CheckCircle2 size={12} />
            Accept
          </button>
          <button className="inline-flex min-h-[2rem] items-center rounded-full border border-border bg-card px-4 py-1 text-xs font-semibold text-muted-foreground gap-1.5 hover:bg-muted transition-colors">
            Reject
          </button>
          <button className="inline-flex min-h-[2rem] items-center rounded-full border border-border bg-card px-4 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors">
            Cherry-pick
          </button>
        </div>
      </div>

      {/* Queue footer */}
      <div className="border-t border-border bg-surface-light/40 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs text-muted-foreground">2 more patches in queue</span>
        </div>
        <span className="text-xs text-muted-foreground">Spec v4 · 3 contributors</span>
      </div>
    </div>
  );
}

export default async function LandingPage({ searchParams }: Props) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const heroVariant =
    typeof resolvedSearchParams.variant === "string" &&
    heroVariantOrder.includes(resolvedSearchParams.variant as HeroVariant)
      ? (resolvedSearchParams.variant as HeroVariant)
      : "handoff";
  const heroCopy = heroVariants[heroVariant];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-4 pt-12 pb-16 grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {heroCopy.eyebrow}
          </p>
          <h1 className="text-[clamp(2.5rem,5vw,4.4rem)] font-extrabold leading-[1.0] text-balance max-w-[14ch]">
            {heroCopy.headline}
          </h1>
          <p className="text-[1.05rem] leading-[1.7] max-w-[58ch] text-muted-foreground">
            {heroCopy.subhead}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/workspace"
              className="inline-flex min-h-[2.9rem] items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground border border-primary transition-opacity hover:opacity-90 active:scale-[0.98]"
            >
              Launch workspace
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/download"
              className="inline-flex min-h-[2.9rem] items-center rounded-full border border-border bg-card px-5 py-3 font-semibold text-foreground transition-colors hover:bg-surface-light active:scale-[0.98]"
            >
              Get the alpha
            </Link>
          </div>
          {/* Status badge — replacing the disclaimer callout box */}
          <div className="inline-flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">
              Local multiplayer alpha · desktop packaging next
            </span>
          </div>
        </div>

        <div className="lg:sticky lg:top-24">
          <PatchMockup />
        </div>
      </section>

      {/* ── Role table ────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-4 pb-14">
        <h2 className="text-xl font-bold text-balance mb-2">
          Safe multiplayer, not collaborative chaos
        </h2>
        <p className="text-muted-foreground leading-relaxed max-w-[60ch] mb-6">
          Every editor sees changes in real time. Agent suggestions arrive as patch proposals —
          not direct edits. You stay in control of what makes it into the canonical spec.
        </p>
        <ol className="border-t border-border">
          {[
            {
              icon: <Users size={16} />,
              label: "Human editing",
              desc: "Humans edit the shared document directly with realtime presence and conflict recovery.",
            },
            {
              icon: <Zap size={16} />,
              label: "Agent coauthoring",
              desc: "Agents propose structural or requirement changes against stable blocks and versions.",
            },
            {
              icon: <ShieldCheck size={16} />,
              label: "Review gates",
              desc: "Humans accept, reject, or cherry-pick patches before the canonical spec changes.",
            },
          ].map(({ icon, label, desc }) => (
            <li
              key={label}
              className="grid grid-cols-1 sm:grid-cols-[11rem_1fr] gap-x-6 gap-y-1 items-baseline border-b border-border py-4"
            >
              <span className="flex items-center gap-2 font-bold text-[0.9rem] text-foreground">
                <span className="text-accent">{icon}</span>
                {label}
              </span>
              <p className="text-muted-foreground leading-relaxed text-sm">{desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Dark section: Connect your AI ─────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-4 pb-14">
        <div className="rounded-2xl bg-ink-dark text-primary-foreground px-6 pt-8 pb-10">
          <h2 className="text-xl font-bold text-balance mb-2">Connect your AI agent</h2>
          <p className="text-sm text-primary-foreground/60 leading-relaxed max-w-[55ch] mb-8">
            Bring your own keys or use hosted credentials — either way, agents can only propose.
            No direct writes to the canonical spec.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: <Terminal size={18} />,
                title: "Your own keys",
                desc: "Bring your Claude or Codex API key. Credentials stay server-side — never exposed to the browser.",
              },
              {
                icon: <ShieldCheck size={18} />,
                title: "Managed credentials",
                desc: "On hosted plans, keys are stored encrypted and scoped to your workspace — no shared tokens.",
              },
              {
                icon: <GitMerge size={18} />,
                title: "Propose-only agents",
                desc: "No agent can rewrite the spec directly. Every suggestion goes through the patch queue first.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-white/6 p-4 space-y-2"
              >
                <div className="flex items-center gap-2 text-primary-foreground/80">
                  {icon}
                  <strong className="text-[0.95rem] font-semibold">{title}</strong>
                </div>
                <p className="text-sm text-primary-foreground/55 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How to ship — numbered steps ──────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-4 pb-14">
        <h2 className="text-xl font-bold text-balance mb-2">Start with the product that ships</h2>
        <p className="text-muted-foreground leading-relaxed max-w-[55ch] mb-8">
          Three stages from blank canvas to a launch packet a coding agent can actually use.
        </p>
        <ol className="grid grid-cols-1 sm:grid-cols-3">
          {[
            {
              num: "01",
              icon: <FileText size={16} />,
              title: "Shape the spec",
              bullets: ["Guided creation", "Comments and clarifications", "Readiness scoring"],
            },
            {
              num: "02",
              icon: <GitMerge size={16} />,
              title: "Review agent work",
              bullets: ["Patch queue", "Diff and attribution", "Audit trail"],
            },
            {
              num: "03",
              icon: <Package size={16} />,
              title: "Launch the handoff",
              bullets: [
                "Deterministic export bundle",
                "Starter template output",
                "Execution brief + launch packet",
              ],
            },
          ].map(({ num, icon, title, bullets }, i, arr) => (
            <li
              key={num}
              className={`py-6 px-6 space-y-4 border-border ${
                i < arr.length - 1 ? "sm:border-r" : ""
              } ${i === 0 ? "pl-0" : ""} ${i === arr.length - 1 ? "pr-0" : ""}`}
            >
              <span className="block text-[2.5rem] font-extrabold leading-none tracking-tight text-accent">
                {num}
              </span>
              <strong className="flex items-center gap-2 text-[0.95rem] font-semibold text-foreground">
                <span className="text-muted-foreground">{icon}</span>
                {title}
              </strong>
              <ul className="space-y-1.5">
                {bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-accent shrink-0">–</span>
                    {b}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-4 px-4 py-6">
          <span className="text-[0.8rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            SpecForge
          </span>
          <nav className="flex flex-wrap items-center gap-6">
            <Link href="/download" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Download
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/workspace" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Workspace
            </Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SpecForge
          </p>
        </div>
      </footer>
    </div>
  );
}
