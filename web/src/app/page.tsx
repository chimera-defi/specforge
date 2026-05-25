import Link from "next/link";
import { ArrowRight, Zap, Shield } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardPanel } from "@/components/ui/card";

const GITHUB_URL = "https://github.com/chimera-defi/specforge";

const auditStages = [
  { n: "01", title: "Problem framing", sub: "Six forcing questions. Product thesis, kill criteria, competitors." },
  { n: "02", title: "CEO review", sub: "10-star vision, scope decisions, financial model, non-goals." },
  { n: "03", title: "Engineering review", sub: "Architecture, failure modes, implementation brief." },
  { n: "04", title: "Design review", sub: "Design system constraints, interaction model, UX pack." },
  { n: "05", title: "Security review", sub: "OWASP threat model, trust boundaries, risk register." },
];

const reviewQueue = [
  { block: "§ Problem Statement", type: "structural edit", status: "pending" },
  { block: "§ Success Metrics", type: "content addition", status: "pending" },
  { block: "§ Architecture", type: "task export change", status: "accepted" },
];

const handoffFiles = ["PRD.md", "SPEC.md", "TASKS.md", "agent_spec.json", "execution_brief.json"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      <SiteNav
        variant="dark"
        ctaHref="/pilot-access?source=landing_nav"
        ctaLabel="Request access"
        ctaVariant="default"
      />

      {/* Hero */}
      <section className="mx-auto w-full max-w-[1100px] px-5 pb-10 pt-12 sm:px-8 md:pt-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div>
            <Badge variant="outline" className="mb-6 border-border-dark text-primary-foreground/60">
              Idea validation &amp; spec studio
            </Badge>

            <h1 className="max-w-[15ch] text-balance text-[clamp(1.6rem,8vw,2.2rem)] font-bold leading-[1.05] tracking-tight md:text-[clamp(2rem,5vw,4rem)]">
              From raw idea to build-ready spec — together.
            </h1>

            <p className="mt-5 max-w-[46ch] text-base leading-[1.7] text-primary-foreground/55">
              Validate the idea, spec it collaboratively with your team and AI agents, then hand off a governed bundle to builders — no context reconstruction needed.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild variant="outline" size="lg">
                <Link href="/workspace?source=landing_hero">Try demo workspace</Link>
              </Button>
              <Button asChild variant="default" size="lg">
                <Link href="/pilot-access?source=landing_hero">
                  Request pilot access
                  <ArrowRight size={15} />
                </Link>
              </Button>
            </div>
          </div>

          <Card className="p-1">
            <CardPanel>
              <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
                <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Live collaborators
                </span>
                <Badge variant="success" className="shrink-0">3 online</Badge>
              </div>
              <div className="mb-4 space-y-2">
                {[
                  { name: "Alex", role: "Founder", action: "Editing § Problem Statement", dotClass: "bg-role-human" },
                  { name: "Claude", role: "Agent", action: "Proposing § Architecture patch", dotClass: "bg-role-agent" },
                  { name: "Sam", role: "Engineer", action: "Reviewing § Success Metrics", dotClass: "bg-role-design" },
                ].map((p) => (
                  <div key={p.name} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${p.dotClass}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-semibold text-foreground">{p.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{p.role}</span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{p.action}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden border-t border-border pt-3 sm:block">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Review queue · 2 pending
                </p>
                {[
                  { block: "§ Problem Statement", type: "structural edit", status: "pending" },
                  { block: "§ Architecture", type: "task export change", status: "accepted" },
                ].map((p) => (
                  <div key={p.block} className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 last:mb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{p.block}</p>
                      <p className="text-xs text-muted-foreground">{p.type}</p>
                    </div>
                    <Badge variant={p.status === "accepted" ? "success" : "default"} className="shrink-0">{p.status}</Badge>
                  </div>
                ))}
              </div>
            </CardPanel>
          </Card>
        </div>
      </section>

      <div className="border-t border-border-dark" />

      {/* Validate first */}
      <section className="mx-auto w-full max-w-[1100px] px-5 py-14 sm:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/70">
              Step 1 — Validate
            </p>
            <h2 className="mt-4 max-w-[18ch] text-balance text-[clamp(1.5rem,4vw,2.5rem)] font-bold leading-[1.05] tracking-tight">
              Pressure-test the idea before you write a line.
            </h2>
            <p className="mt-4 max-w-[44ch] text-base leading-[1.7] text-primary-foreground/55">
              Five structured review stages run before any spec authoring — problem framing, CEO review, engineering review, design, and security. Each stage produces a governed patch proposal. Nothing auto-applies.
            </p>
          </div>

          <ol className="space-y-5">
            {auditStages.map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="mt-0.5 shrink-0 text-xs font-semibold tabular-nums text-accent/60">{s.n}</span>
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">{s.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-primary-foreground/55">{s.sub}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="border-t border-border-dark" />

      {/* Spec collaboratively */}
      <section className="mx-auto w-full max-w-[1100px] px-5 py-14 sm:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/70">
              Step 2 — Spec
            </p>
            <h2 className="mt-4 max-w-[18ch] text-balance text-[clamp(1.5rem,4vw,2.5rem)] font-bold leading-[1.05] tracking-tight">
              Every AI edit is a proposal. You decide what merges.
            </h2>
            <p className="mt-4 max-w-[46ch] text-base leading-[1.7] text-primary-foreground/55">
              Multiple humans and AI agents work on the same canvas in real time. Agent contributions land as block-level patches with rationale and confidence — nothing rewrites your document silently.
            </p>
            <Link
              href="/workspace?source=feature_governance"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              See the workspace <ArrowRight size={13} />
            </Link>
          </div>

          <Card className="p-1">
            <CardPanel>
              <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
                <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Review queue · 3 proposals
                </span>
                <Badge variant="success" className="shrink-0">1 accepted</Badge>
              </div>
              {reviewQueue.map((p) => (
                <div key={p.block} className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5 last:mb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{p.block}</p>
                    <p className="text-xs text-muted-foreground">{p.type}</p>
                  </div>
                  <Badge variant={p.status === "accepted" ? "success" : "default"} className="shrink-0">{p.status}</Badge>
                </div>
              ))}
            </CardPanel>
          </Card>
        </div>
      </section>

      <div className="border-t border-border-dark" />

      {/* Hand off */}
      <section className="mx-auto w-full max-w-[1100px] px-5 py-14 sm:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/70">
              Step 3 — Hand off
            </p>
            <h2 className="mt-4 max-w-[18ch] text-balance text-[clamp(1.5rem,4vw,2.5rem)] font-bold leading-[1.05] tracking-tight">
              One governed bundle. Builders can start immediately.
            </h2>
            <p className="mt-4 max-w-[46ch] text-base leading-[1.7] text-primary-foreground/55">
              PRD, SPEC, TASKS, and agent brief — one export downstream builders consume without reconstructing context from scratch.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-primary-foreground/55">
              <span className="inline-flex items-center gap-1.5">
                <Zap size={13} className="text-accent" /> Zero context reconstruction
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield size={13} className="text-accent" /> Full audit trail
              </span>
            </div>
          </div>

          <Card className="p-1">
            <CardPanel>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                handoff.json
              </p>
              <div className="space-y-2">
                {handoffFiles.map((f) => (
                  <div key={f} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2">
                    <span className="min-w-0 truncate font-mono text-sm text-foreground">{f}</span>
                    <Badge variant="success" className="shrink-0">ready</Badge>
                  </div>
                ))}
              </div>
            </CardPanel>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <div className="border-t border-border-dark" />
      <section className="mx-auto w-full max-w-[1100px] px-5 py-14 sm:px-8 lg:py-24">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="max-w-[20ch] text-balance text-[clamp(1.5rem,4vw,2.5rem)] font-bold leading-tight tracking-tight">
              Apply for pilot access.
            </h2>
            <p className="mt-3 max-w-[40ch] text-base leading-relaxed text-primary-foreground/55">
              Demo workspace is open. Hosted team access is reviewed from the intake queue.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="lg">
              <Link href="/workspace?source=landing_cta">Try demo workspace</Link>
            </Button>
            <Button asChild variant="default" size="lg">
              <Link href="/pilot-access?source=landing_cta">
                Request access
                <ArrowRight size={15} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-dark">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="text-xs font-black uppercase tracking-widest text-primary-foreground/35">
            SpecForge
          </span>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {[
              { href: "/pricing", label: "Pricing" },
              { href: GITHUB_URL, label: "GitHub", external: true },
              { href: "/pilot-access", label: "Pilot access" },
              { href: "/workspace", label: "Demo" },
            ].map((l) =>
              l.external ? (
                <a key={l.href} href={l.href} target="_blank" rel="noreferrer"
                  className="text-sm text-primary-foreground/35 transition-colors hover:text-primary-foreground/75">
                  {l.label}
                </a>
              ) : (
                <Link key={l.href} href={l.href}
                  className="text-sm text-primary-foreground/35 transition-colors hover:text-primary-foreground/75">
                  {l.label}
                </Link>
              ),
            )}
          </nav>
          <span className="text-sm text-primary-foreground/35">
            &copy; {new Date().getFullYear()} SpecForge
          </span>
        </div>
      </footer>
    </div>
  );
}
