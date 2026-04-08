import Link from "next/link";
import { Check, ArrowRight, HelpCircle } from "lucide-react";
import { formatWorkspacePlanSeatPrice, listWorkspacePlans } from "@/lib/specforge/plans";

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
            href="/download"
            className="rounded-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[2.75rem] inline-flex items-center"
          >
            Download
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

const comparisons = [
  {
    name: "Notion",
    note: "Plus at $10 / member · Business at $20 / member",
    focus: "Docs and wikis — no governed patch review, no agent workflow",
  },
  {
    name: "Linear",
    note: "Basic at $10 / user · Business at $16 / user",
    focus: "Issue tracking — project management, not spec authoring",
  },
  {
    name: "Confluence",
    note: "Premium listed at $10.44 / user",
    focus: "Enterprise docs — no real-time collab or AI patch governance",
  },
];

const faqs = [
  {
    q: "What counts as a seat?",
    a: "One seat = one team member with write access to the workspace. Read-only reviewers do not count toward your seat total.",
  },
  {
    q: "What are AI assist requests?",
    a: "Each time you ask the AI to iterate on a section or run a planning stage, that counts as one assist request. Free plans include a generous monthly allowance. Team plans have no cap.",
  },
  {
    q: "Do you store my API keys?",
    a: "On hosted plans, your Claude or Codex keys are encrypted and stored server-side — never exposed to the browser. On the free local plan, you manage your own keys.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes — the Local / OSS plan is free to run locally or self-host. You bring your own API key and get full workspace functionality with up to 8 collaborators.",
  },
];

export default function PricingPage() {
  const plans = listWorkspacePlans();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-4 pt-12 pb-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-3">Pricing</p>
        <h1 className="text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.0] text-balance max-w-[22ch] mb-4">
          Start with the spec. Pay for collaboration and delivery depth.
        </h1>
        <p className="text-[1.05rem] leading-[1.7] max-w-[58ch] text-muted-foreground">
          One seat covers real-time collaboration, governed agent patch review, and the full
          launch-packet export — everything from the first draft to the final handoff bundle.
        </p>
      </section>

      {/* ── Pricing cards ───────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-4 pb-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isPilot = plan.plan === "pilot";
            return (
              <article
                key={plan.plan}
                className={`relative flex flex-col rounded-2xl border p-6 gap-5 transition-shadow hover:shadow-[var(--shadow-card-hover)] ${
                  isPilot
                    ? "border-teal-border bg-gradient-to-b from-teal-subtle to-card shadow-[var(--shadow-card)]"
                    : "border-border bg-card shadow-[var(--shadow-card)]"
                }`}
              >
                {isPilot && (
                  <span className="absolute -top-3 left-5 inline-flex items-center rounded-full bg-accent px-3 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-accent-foreground">
                    Recommended
                  </span>
                )}

                <div className="space-y-1">
                  <strong className="block text-base font-bold">{plan.label}</strong>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[2rem] font-extrabold leading-none">
                      {formatWorkspacePlanSeatPrice(plan)}
                    </span>
                    {plan.seatPriceMonthlyUsd !== null && (
                      <span className="text-sm text-muted-foreground">/ seat / month</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug">{plan.summary}</p>
                </div>

                <ul className="flex flex-col gap-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check
                        size={15}
                        className="mt-0.5 shrink-0 text-accent"
                        strokeWidth={2.5}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/workspace"
                  className={`inline-flex min-h-[2.5rem] items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.98] ${
                    isPilot
                      ? "bg-accent text-accent-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {plan.plan === "enterprise" ? "Contact us" : "Get started"}
                  <ArrowRight size={14} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Comparison ──────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-4 pb-14">
        <h2 className="text-xl font-bold text-balance mb-6">How we compare</h2>
        <div className="border-t border-border">
          {comparisons.map(({ name, note, focus }) => (
            <div
              key={name}
              className="grid grid-cols-1 sm:grid-cols-[8rem_1fr_1fr] gap-x-6 gap-y-1 items-baseline border-b border-border py-4"
            >
              <span className="font-bold text-sm">{name}</span>
              <span className="text-sm text-muted-foreground">{note}</span>
              <span className="text-sm text-muted-foreground italic">{focus}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-4 pb-16">
        <h2 className="text-xl font-bold text-balance mb-6">Common questions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {faqs.map(({ q, a }) => (
            <div
              key={q}
              className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start gap-2">
                <HelpCircle size={15} className="mt-0.5 shrink-0 text-accent" />
                <strong className="text-sm font-semibold leading-snug">{q}</strong>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-[1.4rem]">{a}</p>
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
            <Link href="/download" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Download
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
