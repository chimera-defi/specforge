import Link from "next/link";
import { Check, ArrowRight, HelpCircle, Sparkles } from "lucide-react";
import { formatWorkspacePlanSeatPrice, listWorkspacePlans } from "@/lib/specforge/plans";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const GITHUB_URL = "https://github.com/chimera-defi/specforge";

const container: React.CSSProperties = {
  maxWidth: "1100px",
  marginLeft: "auto",
  marginRight: "auto",
  paddingLeft: "clamp(1.5rem, 5vw, 4rem)",
  paddingRight: "clamp(1.5rem, 5vw, 4rem)",
};

const comparisons = [
  {
    name: "Notion",
    note: "Plus $10 / member · Business $20 / member",
    focus: "Strong docs base, no governed agent patch workflow.",
  },
  {
    name: "Linear",
    note: "Basic $10 / user · Business $16 / user",
    focus: "Excellent delivery tracker, not spec-first authoring.",
  },
  {
    name: "Confluence",
    note: "Premium ~$10.44 / user",
    focus: "Enterprise docs, weaker realtime AI governance.",
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
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav
        variant="light"
        ctaHref="/workspace?source=pricing_nav"
        ctaLabel="Open workspace"
        ctaVariant="default"
      />

      <main>
        <section className="w-full animate-fade-up" style={{ ...container, paddingTop: "3.5rem", paddingBottom: "2.5rem" }}>
          <Badge variant="amber" style={{ marginBottom: "0.75rem" }}>Pricing</Badge>
          <h1 className="text-balance text-[clamp(2.2rem,5vw,3.8rem)] font-black leading-[1.05] tracking-tight" style={{ marginBottom: "1rem", maxWidth: "22ch" }}>
            Start with the spec. Pay for collaboration and delivery depth.
          </h1>
          <p className="text-base leading-[1.72] text-muted-foreground" style={{ maxWidth: "58ch" }}>
            Seat pricing covers realtime authoring, governed patch review, and launch-packet
            handoff. Sign in with GitHub for hosted team workspaces.
          </p>
          <div className="flex flex-wrap gap-3" style={{ marginTop: "1.5rem" }}>
            <Button asChild variant="default" size="lg">
              <Link href="/pilot-access?source=pricing_intro">
                Request pilot access
                <ArrowRight size={14} />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/workspace?source=pricing_intro#billing-readiness">
                Open billing status
              </Link>
            </Button>
          </div>
        </section>

        <section className="w-full" style={{ ...container, paddingBottom: "3.5rem" }}>
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
                  className={cn(
                    "relative flex flex-col gap-5 rounded-card border shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] animate-fade-up",
                    isPilot
                      ? "border-teal-border bg-gradient-to-b from-teal-subtle via-card to-card ring-2 ring-teal-border"
                      : "border-border-mid bg-card"
                  )}
                  style={{ padding: "1.5rem", animationDelay: `${0.08 * (index + 1)}s` }}
                >
                  {isPilot && (
                    <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-accent-foreground shadow-accent">
                      <Sparkles size={11} />
                      Recommended
                    </span>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
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

                  <Button asChild variant={isPilot ? "default" : "primary"}>
                    <Link href={ctaHref}>
                      {ctaLabel}
                      <ArrowRight size={14} />
                    </Link>
                  </Button>
                </article>
              );
            })}
          </div>
        </section>

        {/* Comparison table */}
        <section className="w-full" style={{ ...container, paddingBottom: "3.5rem" }}>
          <h2 className="text-xl font-black tracking-tight" style={{ marginBottom: "1.5rem" }}>How we compare</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border-mid bg-muted/40">
                    <th className="text-left text-xs font-black uppercase tracking-[0.1em] text-muted-foreground" style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.75rem", paddingBottom: "0.75rem" }}>
                      Tool
                    </th>
                    <th className="text-left text-xs font-black uppercase tracking-[0.1em] text-muted-foreground" style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.75rem", paddingBottom: "0.75rem" }}>
                      Pricing
                    </th>
                    <th className="text-left text-xs font-black uppercase tracking-[0.1em] text-muted-foreground" style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "0.75rem", paddingBottom: "0.75rem" }}>
                      Gap
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map(({ name, note, focus }) => (
                    <tr key={name} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                      <td className="font-semibold text-foreground" style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "1rem", paddingBottom: "1rem" }}>{name}</td>
                      <td className="break-words text-muted-foreground" style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "1rem", paddingBottom: "1rem" }}>{note}</td>
                      <td className="break-words italic text-muted-foreground" style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "1rem", paddingBottom: "1rem" }}>{focus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* FAQs */}
        <section className="w-full" style={{ ...container, paddingBottom: "4rem" }}>
          <h2 className="text-xl font-black tracking-tight" style={{ marginBottom: "1.5rem" }}>Common questions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {faqs.map(({ q, a }, index) => (
              <div
                key={q}
                className="rounded-[var(--radius-panel)] border border-border-mid bg-card shadow-card animate-fade-up"
                style={{ padding: "1.25rem", animationDelay: `${0.06 * (index + 1)}s` }}
              >
                <div className="flex items-start gap-2">
                  <HelpCircle size={15} className="mt-0.5 shrink-0 text-accent" />
                  <strong className="text-sm font-semibold leading-snug">{q}</strong>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground" style={{ paddingLeft: "1.4rem", paddingTop: "0.5rem" }}>{a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="flex w-full flex-wrap items-center justify-between gap-4" style={{ ...container, paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
          <span className="text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">
            SpecForge Studio
          </span>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-5">
            {[
              { href: "/", label: "Home" },
              { href: "/download", label: "Download" },
              { href: GITHUB_URL, label: "GitHub", external: true },
              { href: "/pilot-access", label: "Pilot access" },
              { href: "/workspace", label: "Workspace" },
            ].map((l) =>
              l.external ? (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub (opens in new tab)"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              ),
            )}
          </nav>
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} SpecForge</p>
        </div>
      </footer>
    </div>
  );
}
