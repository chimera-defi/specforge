import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  FileText,
  GitMerge,
  Package,
  ShieldCheck,
  Users,
  Lightbulb,
  BarChart3,
  Cpu,
  Palette,
  Lock,
} from "lucide-react";
import { heroVariantOrder, heroVariants, type HeroVariant } from "@/lib/specforge/marketing";

type Props = {
  searchParams?: Promise<{ variant?: string }>;
};

function Nav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[4rem] w-full max-w-[1180px] items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="shrink-0 text-[0.78rem] font-black uppercase tracking-[0.22em] text-foreground transition-opacity hover:opacity-70"
        >
          SpecForge
        </Link>
        <nav className="flex min-w-0 items-center justify-end gap-1">
          <Link
            href="/pricing"
            className="hidden min-h-[2.75rem] items-center rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Pricing
          </Link>
          <Link
            href="/download"
            className="hidden min-h-[2.75rem] items-center rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
          >
            Download
          </Link>
          <Link
            href="/workspace"
            className="hidden min-h-[2.75rem] items-center rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:inline-flex"
          >
            Demo workspace
          </Link>
          <Link
            href="/pilot-access?source=landing_nav"
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-accent)] transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-accent-hover)] active:scale-[0.98]"
          >
            Pilot access
          </Link>
        </nav>
      </div>
    </header>
  );
}

function ProductPreview() {
  return (
    <figure className="overflow-hidden rounded-[var(--radius-xl)] border border-border-mid bg-card shadow-[var(--shadow-card)]">
      <div className="flex min-h-[2.75rem] items-center gap-2 border-b border-border bg-surface-light/75 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/55" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/55" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/55" />
        <span className="ml-2 truncate font-mono text-xs text-muted-foreground">
          workspace · reviewable agent patches
        </span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-teal-border bg-teal-subtle px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Live
        </span>
      </div>
      <div className="bg-surface-panel p-2 sm:p-3">
        <Image
          src="/marketing/specforge-workspace-preview.png"
          alt="SpecForge workspace showing a shared specification, review queue, and launch handoff panels"
          width={1360}
          height={850}
          priority
          sizes="(min-width: 1024px) 560px, calc(100vw - 2rem)"
          className="aspect-[16/10] w-full rounded-[var(--radius-md)] border border-border object-cover object-top"
        />
      </div>
      <figcaption className="grid gap-3 border-t border-border bg-card px-4 py-4 text-sm text-muted-foreground sm:grid-cols-3">
        <span className="inline-flex items-center gap-2">
          <Users size={15} className="shrink-0 text-accent" />
          Multiplayer canvas
        </span>
        <span className="inline-flex items-center gap-2">
          <GitMerge size={15} className="shrink-0 text-accent" />
          Patch approvals
        </span>
        <span className="inline-flex items-center gap-2">
          <Package size={15} className="shrink-0 text-accent" />
          Export handoff
        </span>
      </figcaption>
    </figure>
  );
}

const auditStages = [
  {
    number: "01",
    name: "Problem framing",
    label: "Office Hours",
    icon: <Lightbulb size={14} />,
    output: "Product thesis, named competitors, kill criteria, validation signal",
  },
  {
    number: "02",
    name: "CEO review",
    label: "Strategy",
    icon: <BarChart3 size={14} />,
    output: "10-star vision, scope decisions, financial model, explicit non-goals",
  },
  {
    number: "03",
    name: "Engineering review",
    label: "Architecture",
    icon: <Cpu size={14} />,
    output: "Architecture choices, data flow, failure modes, implementation brief",
  },
  {
    number: "04",
    name: "Design review",
    label: "UX",
    icon: <Palette size={14} />,
    output: "Design system constraints, interaction model, wireframes, UX pack",
  },
  {
    number: "05",
    name: "Security review",
    label: "Risk",
    icon: <Lock size={14} />,
    output: "OWASP threat model, trust boundaries, risk register, requirements",
  },
];

const roleRows = [
  {
    role: "Founders and product leads",
    value:
      "Run a structured G-Stack idea audit before any spec is written — problem framing, CEO review, engineering, design, and security in one pipeline.",
  },
  {
    role: "Engineering teams",
    value:
      "Review agent edits as targeted patch proposals instead of accepting hidden rewrites across the whole document. Every change is attributable.",
  },
  {
    role: "AI build agents",
    value:
      "Receive one governed launch packet with PRD, SPEC, TASKS, acceptance criteria, and full provenance — no reconstructing context from chat history.",
  },
];

const steps = [
  {
    number: "01",
    title: "Audit the idea",
    body: "Five G-Stack planning stages pressure-test the concept before any spec authoring. Each stage produces a governed patch proposal — nothing auto-applies.",
  },
  {
    number: "02",
    title: "Govern the changes",
    body: "Humans collaborate live. AI agents propose block-level patches that can be accepted, rejected, or cherry-picked — every change is attributable and reversible.",
  },
  {
    number: "03",
    title: "Hand off cleanly",
    body: "Export a launch packet that downstream builders use without reconstructing context from chat history.",
  },
];

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

      <main>
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-10 px-4 pb-16 pt-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:pb-20 lg:pt-16">
          <div className="space-y-6 animate-fade-up">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber">
              {heroCopy.eyebrow}
            </p>
            <h1 className="max-w-[16ch] text-balance text-[clamp(2.45rem,5vw,4.8rem)] font-black leading-[1.02]">
              {heroCopy.headline}
            </h1>
            <p className="max-w-[62ch] text-[1.05rem] leading-[1.75] text-muted-foreground">
              {heroCopy.subhead}
            </p>

            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/pilot-access?source=landing_hero"
                className="inline-flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground shadow-[var(--shadow-accent)] transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-accent-hover)] active:scale-[0.98] sm:w-auto"
              >
                Request hosted pilot access
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/workspace?source=landing_hero"
                className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-full border border-border-mid bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-light active:scale-[0.98] sm:w-auto"
              >
                Try demo workspace
              </Link>
            </div>

            <div className="grid gap-2 rounded-[var(--radius-md)] border border-border-mid bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground sm:inline-grid">
              <span className="font-semibold text-foreground">Demo now. Hosted pilot by review.</span>
              <span>
                Local and demo access open immediately. Hosted team access is reviewed from the pilot
                queue and followed up by email when there is a fit.
              </span>
            </div>
          </div>

          <div className="animate-fade-up [animation-delay:120ms]">
            <ProductPreview />
          </div>
        </section>

        {/* Idea Audit Pipeline */}
        <section className="mx-auto w-full max-w-[1180px] px-4 pb-16">
          <div className="mb-8 grid gap-3 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber">Built-in idea audit</p>
              <h2 className="mt-3 max-w-[18ch] text-balance text-[clamp(1.8rem,3vw,2.6rem)] font-black leading-tight">
                Five stages before you write a single word of spec.
              </h2>
            </div>
            <p className="max-w-[58ch] leading-relaxed text-muted-foreground lg:pb-1">
              G-Stack inspired planning stages pressure-test every idea across problem, strategy, engineering, design, and security lenses. Each stage produces a governed patch proposal — nothing is auto-applied.
            </p>
          </div>

          <div className="grid grid-cols-1 divide-y divide-border-mid border border-border-mid rounded-[var(--radius-lg)] overflow-hidden sm:grid-cols-5 sm:divide-x sm:divide-y-0">
            {auditStages.map((stage) => (
              <div key={stage.name} className="bg-card px-4 py-5 sm:px-3 lg:px-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-light px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {stage.icon}
                    {stage.label}
                  </span>
                </div>
                <span className="block text-[1.8rem] font-black leading-none text-accent/30">
                  {stage.number}
                </span>
                <h3 className="mt-2 text-sm font-black tracking-tight text-foreground">{stage.name}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{stage.output}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            All stages optional and skippable.{" "}
            <Link href="/workspace?source=audit_strip" className="font-semibold text-foreground underline-offset-2 hover:underline">
              Try the demo workspace →
            </Link>
          </p>
        </section>

        {/* Who it's for */}
        <section className="mx-auto w-full max-w-[1180px] px-4 pb-16">
          <div className="grid gap-8 border-y border-border-mid py-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber">Who it is for</p>
              <h2 className="mt-3 max-w-[14ch] text-balance text-[clamp(1.8rem,3vw,2.6rem)] font-black leading-tight">
                Specs that survive real teams and real agents.
              </h2>
            </div>
            <div className="divide-y divide-border-mid border-y border-border-mid">
              {roleRows.map((item) => (
                <div key={item.role} className="grid gap-2 py-4 sm:grid-cols-[0.42fr_1fr] sm:gap-6">
                  <h3 className="font-semibold text-foreground">{item.role}</h3>
                  <p className="leading-relaxed text-muted-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why teams switch — dark section */}
        <section className="bg-ink-dark text-primary-foreground">
          <div className="mx-auto grid w-full max-w-[1180px] gap-8 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-foreground/60">
                Why teams switch
              </p>
              <h2 className="mt-3 max-w-[16ch] text-balance text-[clamp(2rem,4vw,3.4rem)] font-black leading-tight">
                Idea to build-ready. Governed the whole way.
              </h2>
            </div>
            <div className="grid gap-5">
              {[
                {
                  icon: <Lightbulb size={18} />,
                  title: "Idea audit before any spec authoring",
                  body: "Five structured G-Stack planning stages — problem framing, CEO review, engineering, design, security — each producing a governed patch proposal before spec work begins.",
                },
                {
                  icon: <ClipboardCheck size={18} />,
                  title: "No silent agent rewrites",
                  body: "Every AI contribution lands as a patch proposal with target block, rationale, confidence, and decision history. Humans decide what merges.",
                },
                {
                  icon: <ShieldCheck size={18} />,
                  title: "Depth before execution",
                  body: "UX coverage, risk register, financial model, and competitor analysis are part of the authoring flow — not cleanup work after build starts.",
                },
                {
                  icon: <FileText size={18} />,
                  title: "One governed launch packet",
                  body: "Export PRD, SPEC, TASKS, agent handoff JSON, and execution brief from the same canonical workspace. No reconstructing context from chat history.",
                },
              ].map((item) => (
                <div key={item.title} className="grid gap-2 border-t border-white/15 pt-5 first:border-t-0 first:pt-0">
                  <h3 className="flex items-center gap-2 font-semibold text-primary-foreground">
                    <span className="text-accent">{item.icon}</span>
                    {item.title}
                  </h3>
                  <p className="max-w-[66ch] leading-relaxed text-primary-foreground/72">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="mx-auto w-full max-w-[1180px] px-4 py-16">
          <div className="mb-8 max-w-[680px]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber">Workflow</p>
            <h2 className="mt-3 text-balance text-[clamp(1.85rem,3vw,2.7rem)] font-black leading-tight">
              Three passes from rough brief to governed build handoff.
            </h2>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.number} className="border-t border-border-mid pt-5">
                <span className="block text-[2.7rem] font-black leading-none text-accent">
                  {step.number}
                </span>
                <h3 className="mt-3 text-lg font-black tracking-tight">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Pilot access CTA */}
        <section className="mx-auto w-full max-w-[1180px] px-4 pb-16">
          <div className="grid gap-6 rounded-[var(--radius-lg)] border border-border-mid bg-card p-5 shadow-[var(--shadow-card)] sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber">Pilot access</p>
              <h2 className="mt-2 text-balance text-2xl font-black tracking-tight">
                Apply for hosted SpecForge with your team.
              </h2>
              <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                The demo workspace is open now. Hosted pilot access is reviewed from the intake
                queue so we can onboard teams with the right collaboration and governance needs.
              </p>
            </div>
            <div className="grid gap-2 sm:flex lg:grid">
              <Link
                href="/pilot-access?source=landing_footer"
                className="inline-flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-[var(--shadow-accent)] transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-accent-hover)] active:scale-[0.98] sm:w-auto"
              >
                Request pilot access
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/workspace?source=landing_footer"
                className="inline-flex min-h-[2.85rem] w-full items-center justify-center rounded-full border border-border-mid bg-card px-6 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-light active:scale-[0.98] sm:w-auto"
              >
                Try demo workspace
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[0.76rem] font-black uppercase tracking-[0.24em] text-muted-foreground">
            SpecForge Studio
          </span>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link href="/download" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Download
            </Link>
            <Link href="/pilot-access" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pilot access
            </Link>
            <Link href="/workspace" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Demo workspace
            </Link>
          </nav>
          <span className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} SpecForge</span>
        </div>
      </footer>
    </div>
  );
}
