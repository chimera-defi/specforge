import Link from "next/link";
import { Check, ArrowRight, HelpCircle, Sparkles } from "lucide-react";
import { formatWorkspacePlanSeatPrice, listWorkspacePlans } from "@/lib/specforge/plans";

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
            href="/"
            className="inline-flex min-h-[2.7rem] items-center rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="/download"
            className="inline-flex min-h-[2.7rem] items-center rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Download
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

const comparisons = [
  {
    name: "Notion",
    note: "Plus at $10 / member · Business at $20 / member",
    focus: "Strong docs base, but no governed agent patch workflow.",
  },
  {
    name: "Linear",
    note: "Basic at $10 / user · Business at $16 / user",
    focus: "Excellent delivery tracker, not spec-first authoring.",
  },
  {
    name: "Confluence",
    note: "Premium listed at $10.44 / user",
    focus: "Enterprise docs system, weaker realtime AI governance model.",
  },
];

const faqs = [
  {
    q: "What counts as a seat?",
    a: "One seat is one collaborator with write access to a workspace. Read-only reviewers do not count toward seat quota.",
  },
  {
    q: "What are AI assist requests?",
    a: "Each guided assist, section iteration, or planning-stage AI run counts as one request. Team plans remove the monthly cap.",
  },
  {
    q: "Do you store my API keys?",
    a: "Hosted mode stores keys encrypted server-side and never exposes them to the browser. Local mode lets you manage keys yourself.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. Local/OSS mode is free and supports real workflow testing before you upgrade to collaborative pilot plans.",
  },
];

export default function PricingPage() {
  const plans = listWorkspacePlans();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute left-[-10rem] top-[-5rem] h-[24rem] w-[24rem] rounded-full bg-teal-subtle blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-[20rem] w-[20rem] rounded-full bg-blue-subtle blur-3xl" />

      <Nav />

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-10 pt-14 animate-fade-up">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-accent">Pricing</p>
        <h1 className="mb-4 max-w-[20ch] text-balance text-[clamp(2.4rem,5.2vw,4.2rem)] font-black leading-[1.05] tracking-tight">
          Start with the spec. Pay for collaboration and delivery depth.
        </h1>
        <p className="max-w-[58ch] text-[1.04rem] leading-[1.72] text-muted-foreground">
          Seat pricing covers realtime authoring, governed patch review, and launch-packet handoff.
          Sign in with GitHub for hosted team workspaces, then scale from local alpha to managed pilots.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/pilot-access?source=pricing_intro"
            className="inline-flex min-h-[2.85rem] items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-accent)] transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-accent-hover)] active:scale-[0.98]"
          >
            Request pilot access
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/workspace?source=pricing_intro#billing-readiness"
            className="inline-flex min-h-[2.85rem] items-center gap-2 rounded-full border border-border-mid bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-light active:scale-[0.98]"
          >
            Open billing status
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-14">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const isPilot = plan.plan === "pilot";
            const ctaHref =
              plan.plan === "pilot"
                ? "/pilot-access?source=pricing_card&plan=pilot"
                : plan.plan === "enterprise"
                  ? "/pilot-access?source=pricing_card&plan=enterprise"
                  : "/workspace?source=pricing_card&plan=demo";
            const ctaLabel =
              plan.plan === "pilot"
                ? "Request pilot access"
                : plan.plan === "enterprise"
                  ? "Contact sales"
                  : "Open workspace";
            return (
              <article
                key={plan.plan}
                className={`relative flex flex-col gap-5 rounded-[var(--radius-card)] border p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] animate-fade-up ${
                  isPilot
                    ? "border-teal-border bg-gradient-to-b from-teal-subtle via-card to-card ring-2 ring-teal-border"
                    : "border-border-mid bg-card"
                }`}
                style={{ animationDelay: `${0.08 * (index + 1)}s` }}
              >
                {isPilot && (
                  <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.16em] text-accent-foreground shadow-[var(--shadow-accent)]">
                    <Sparkles size={11} />
                    Recommended
                  </span>
                )}

                <div className="space-y-1">
                  <strong className="block text-base font-black tracking-tight">{plan.label}</strong>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[2rem] font-black leading-none">{formatWorkspacePlanSeatPrice(plan)}</span>
                    {plan.seatPriceMonthlyUsd !== null && (
                      <span className="text-sm text-muted-foreground">/ seat / month</span>
                    )}
                  </div>
                  <p className="text-sm leading-snug text-muted-foreground">{plan.summary}</p>
                </div>

                <ul className="flex flex-1 flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check size={15} className="mt-0.5 shrink-0 text-accent" strokeWidth={2.5} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={ctaHref}
                  className={`inline-flex min-h-[2.7rem] items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-[1px] active:scale-[0.98] ${
                    isPilot
                      ? "bg-accent text-accent-foreground shadow-[var(--shadow-accent)]"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {ctaLabel}
                  <ArrowRight size={14} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-14">
        <h2 className="mb-6 text-xl font-black tracking-tight">How we compare</h2>
        <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border-mid bg-card shadow-[var(--shadow-card)]">
          {comparisons.map(({ name, note, focus }) => (
            <div
              key={name}
              className="grid grid-cols-1 gap-x-6 gap-y-1 border-b border-border px-5 py-4 last:border-b-0 sm:grid-cols-[8rem_1fr_1fr]"
            >
              <span className="text-sm font-semibold text-foreground">{name}</span>
              <span className="text-sm text-muted-foreground">{note}</span>
              <span className="text-sm italic text-muted-foreground">{focus}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-16">
        <h2 className="mb-6 text-xl font-black tracking-tight">Common questions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {faqs.map(({ q, a }, index) => (
            <div
              key={q}
              className="rounded-[var(--radius-panel)] border border-border-mid bg-card p-5 shadow-[var(--shadow-card)] animate-fade-up"
              style={{ animationDelay: `${0.06 * (index + 1)}s` }}
            >
              <div className="flex items-start gap-2">
                <HelpCircle size={15} className="mt-0.5 shrink-0 text-accent" />
                <strong className="text-sm font-semibold leading-snug">{q}</strong>
              </div>
              <p className="pl-[1.4rem] pt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </div>
          ))}
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
            <Link href="/download" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Download
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
