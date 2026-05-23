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
  Workflow,
  Rocket,
} from "lucide-react";
import { heroVariantOrder, heroVariants, type HeroVariant } from "@/lib/specforge/marketing";

type Props = {
  searchParams?: Promise<{ variant?: string }>;
};

function Nav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-[0.8rem] font-black uppercase tracking-[0.24em] text-foreground transition-opacity hover:opacity-70"
        >
          SpecForge
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/download"
            className="inline-flex min-h-[2.7rem] items-center rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Download
          </Link>
          <Link
            href="/pricing"
            className="inline-flex min-h-[2.7rem] items-center rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/pilot-access"
            className="inline-flex min-h-[2.7rem] items-center rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pilot access
          </Link>
          <Link
            href="/workspace"
            className="ml-2 inline-flex min-h-[2.8rem] items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-accent)] transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-accent-hover)] active:scale-[0.98]"
          >
            Open workspace
          </Link>
        </nav>
      </div>
    </header>
  );
}

function PatchMockup() {
  return (
    <div className="group relative overflow-hidden rounded-[var(--radius-xl)] border border-border-mid bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-accent/16 to-transparent" />

      <div className="flex items-center gap-1.5 border-b border-border bg-surface-light/65 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-destructive/45" />
        <span className="h-3 w-3 rounded-full bg-warning/45" />
        <span className="h-3 w-3 rounded-full bg-success/45" />
        <span className="ml-3 text-xs text-muted-foreground font-mono">patch-queue · 3 pending</span>
        <span className="ml-auto inline-flex h-2 w-2 animate-pulse rounded-full bg-accent" />
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-teal-border bg-teal-subtle px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-accent">
              Agent patch
            </span>
            <span className="text-xs text-muted-foreground">Claude Code · 2m ago</span>
          </div>
          <span className="text-xs text-muted-foreground">Auth section</span>
        </div>

        <p className="text-sm font-medium leading-snug text-foreground">
          Add structured error handling to the authentication flow for token expiry edge cases.
        </p>

        <div className="space-y-0.5 rounded-lg border border-success-subtle bg-success-subtle/55 p-3 font-mono text-xs leading-relaxed text-success">
          <div>+ try-catch around token refresh calls</div>
          <div>+ return 401 with &quot;refresh_required&quot; hint</div>
          <div>+ add expiry timestamp to JWT decode check</div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button className="inline-flex min-h-[2rem] items-center gap-1.5 rounded-full bg-success px-4 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90">
            <CheckCircle2 size={12} />
            Accept
          </button>
          <button className="inline-flex min-h-[2rem] items-center rounded-full border border-border bg-card px-4 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted">
            Reject
          </button>
          <button className="inline-flex min-h-[2rem] items-center rounded-full border border-border bg-card px-4 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted">
            Cherry-pick
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border bg-surface-light/45 px-5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
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
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-teal-subtle blur-3xl" />
      <div className="pointer-events-none absolute right-[-8rem] top-[16rem] h-[22rem] w-[22rem] rounded-full bg-blue-subtle blur-3xl" />

      <Nav />

      <section className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-10 px-4 pb-16 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="space-y-6 animate-fade-up">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-accent">{heroCopy.eyebrow}</p>
          <h1 className="max-w-[13ch] text-balance text-[clamp(2.2rem,8vw,5.5rem)] font-black leading-[1.04] tracking-tight">
            {heroCopy.headline}
          </h1>
          <p className="max-w-[58ch] text-[1.05rem] leading-[1.75] text-muted-foreground">{heroCopy.subhead}</p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/workspace"
              className="inline-flex min-h-[2.95rem] items-center gap-2 rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground shadow-[var(--shadow-accent)] transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-accent-hover)] active:scale-[0.98]"
            >
              Launch workspace
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/pilot-access?source=landing_hero"
              className="inline-flex min-h-[2.95rem] items-center rounded-full border border-border-mid bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-light active:scale-[0.98]"
            >
              Request pilot access
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-border-mid bg-card px-3 py-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            <span className="text-xs text-muted-foreground">Design partner pilot · realtime collaboration</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Human in the loop", value: "Always" },
              { label: "Patch decisions", value: "Full audit" },
              { label: "Runs", value: "Local · Hosted" },
            ].map((item, idx) => (
              <div
                key={item.label}
                className="rounded-[var(--radius-md)] border border-border-mid bg-card px-4 py-3 shadow-[var(--shadow-card)] animate-fade-up"
                style={{ animationDelay: `${0.12 * (idx + 1)}s` }}
              >
                <div className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-mid">{item.label}</div>
                <div className="mt-1 text-xl font-black text-foreground">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-up [animation-delay:120ms] lg:sticky lg:top-24">
          <PatchMockup />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-14">
        <div className="rounded-[var(--radius-xl)] border border-border-mid bg-ink-dark px-6 py-7 text-primary-foreground shadow-[var(--shadow-card)] animate-fade-up [animation-delay:180ms]">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[0.8fr_1.2fr] md:items-start">
            <div>
              <h2 className="text-[1.35rem] font-black tracking-tight">Safe multiplayer, not collaborative chaos</h2>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/78">
                Humans edit in real time. Agents only submit reviewable patches. The canonical spec moves forward when humans decide.
              </p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
              {[
                {
                  icon: <Users size={16} />,
                  label: "Human editing",
                  desc: "Shared presence, conflict recovery, and section-level ownership.",
                },
                {
                  icon: <Zap size={16} />,
                  label: "Agent proposals",
                  desc: "Patches target stable blocks and carry provenance metadata.",
                },
                {
                  icon: <ShieldCheck size={16} />,
                  label: "Governed decisions",
                  desc: "Accept, reject, or cherry-pick before canonical state changes.",
                },
              ].map((item) => (
                <li key={item.label} className="rounded-[var(--radius-md)] border border-white/15 bg-[#232d38] px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary-foreground/92">
                    <span className="text-accent">{item.icon}</span>
                    {item.label}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-primary-foreground/78">{item.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-14">
        <h2 className="mb-2 text-xl font-black text-balance">One workflow, three decisive passes</h2>
        <p className="mb-8 max-w-[56ch] text-muted-foreground leading-relaxed">
          Move from rough idea to launch packet with one source of truth that survives handoff.
        </p>

        <ol className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_0.8fr_1fr]">
          {[
            {
              num: "01",
              icon: <FileText size={16} />,
              title: "Shape the spec",
              bullets: ["Guided creation", "Clarifications and readiness", "UX pack coverage"],
            },
            {
              num: "02",
              icon: <GitMerge size={16} />,
              title: "Review agent work",
              bullets: ["Patch queue", "Diff and provenance", "Audit-friendly decisions"],
            },
            {
              num: "03",
              icon: <Package size={16} />,
              title: "Launch the handoff",
              bullets: ["Deterministic export", "Starter handoff", "Execution + launch packet"],
            },
          ].map((item, idx) => (
            <li
              key={item.num}
              className="relative rounded-[var(--radius-card)] border border-border-mid bg-card px-5 py-6 shadow-[var(--shadow-card)] animate-fade-up"
              style={{ animationDelay: `${0.08 * (idx + 2)}s` }}
            >
              <div className="absolute right-4 top-4 text-[0.7rem] font-black uppercase tracking-[0.2em] text-muted-mid">Pass</div>
              <span className="block text-[2.6rem] font-black leading-none tracking-tight text-accent">{item.num}</span>
              <strong className="mt-2 flex items-center gap-2 text-[0.95rem] font-semibold text-foreground">
                <span className="text-accent">{item.icon}</span>
                {item.title}
              </strong>
              <ul className="mt-3 space-y-1.5">
                {item.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="shrink-0 text-accent">•</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-16">
        <div className="grid grid-cols-1 gap-4 rounded-[var(--radius-lg)] border border-border-mid bg-card p-6 shadow-[var(--shadow-card)] md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-xl font-black tracking-tight">Ship specs your engineers will actually build from.</h2>
            <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-muted-foreground">
              Start in the workspace today. Desktop packaging and hosted pilots ready when you are.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.78rem] uppercase tracking-[0.18em] text-muted-mid">
              <span className="inline-flex items-center gap-1"><Workflow size={14} /> governed flow</span>
              <span className="inline-flex items-center gap-1"><Rocket size={14} /> launch packet ready</span>
              <span className="inline-flex items-center gap-1"><Terminal size={14} /> byoa cli assist</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/pilot-access?source=landing_footer"
              className="inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-ink)] active:scale-[0.98]"
            >
              Request pilot access
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/workspace"
              className="inline-flex min-h-[2.7rem] items-center justify-center rounded-full border border-border-mid bg-card px-6 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-light active:scale-[0.98]"
            >
              Open workspace now
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-4 px-4 py-6">
          <span className="text-[0.76rem] font-black uppercase tracking-[0.24em] text-muted-foreground">
            SpecForge Studio
          </span>
          <nav className="flex flex-wrap items-center gap-6">
            <Link href="/download" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Download
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link href="/pilot-access" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pilot access
            </Link>
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
