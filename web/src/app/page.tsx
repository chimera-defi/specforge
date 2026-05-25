import Link from "next/link";
import { ArrowRight, Zap, Shield } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardPanel } from "@/components/ui/card";

const GITHUB_URL = "https://github.com/chimera-defi/specforge";

const auditStages = [
  { n: "01", title: "Problem framing", sub: "Product thesis, kill criteria, competitive landscape." },
  { n: "02", title: "CEO review", sub: "10-star vision, scope decisions, financial model." },
  { n: "03", title: "Engineering review", sub: "Architecture, failure modes, implementation brief." },
  { n: "04", title: "Design review", sub: "Design constraints, interaction model, UX pack." },
  { n: "05", title: "Security review", sub: "Threat model, trust boundaries, risk register." },
];

const reviewQueue = [
  { block: "Problem Statement", type: "structural edit", status: "pending" },
  { block: "Success Metrics", type: "content addition", status: "pending" },
  { block: "Architecture", type: "task export change", status: "accepted" },
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

      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-6 pb-14 pt-16 sm:px-8 md:pt-24 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div className="space-y-6">
            <Badge variant="outline" className="border-border-dark text-primary-foreground/60">
              Idea validation · Spec creation
            </Badge>

            <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
              From idea to<br className="hidden sm:block" /> build-ready spec.
            </h1>

            <p className="max-w-[42ch] text-base leading-relaxed text-primary-foreground/60">
              Validate your idea, spec it collaboratively with AI, and hand off a build-ready bundle — without losing the reasoning.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Button asChild variant="outline" size="lg">
                <Link href="/workspace?source=landing_hero">Try the demo</Link>
              </Button>
              <Button asChild variant="default" size="lg">
                <Link href="/pilot-access?source=landing_hero">
                  Request access
                  <ArrowRight size={15} />
                </Link>
              </Button>
            </div>
          </div>

          {/* Collaborator + review mockup */}
          <Card className="p-1">
            <CardPanel>
              <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
                <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Live collaborators
                </span>
                <Badge variant="success" className="shrink-0">3 online</Badge>
              </div>
              <div className="mb-4 space-y-2">
                {[
                  { name: "Alex", role: "Founder", action: "Editing Problem Statement", dotClass: "bg-role-human" },
                  { name: "Claude", role: "Agent", action: "Proposing Architecture patch", dotClass: "bg-role-agent" },
                  { name: "Sam", role: "Engineer", action: "Reviewing Success Metrics", dotClass: "bg-role-design" },
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
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Review queue · 2 pending
                </p>
                {[
                  { block: "Problem Statement", type: "structural edit", status: "pending" },
                  { block: "Architecture", type: "task export change", status: "accepted" },
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

      {/* ─── Step 1: Validate ─────────────────────────────── */}
      {/* Full-width step list — breaks rhythm from 2-col sections */}
      <section className="mx-auto w-full max-w-[1100px] px-6 py-16 sm:px-8 lg:px-10 lg:py-28">
        <div className="mb-10 max-w-[52ch] space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent/70">
            Step 1 — Validate
          </p>
          <h2 className="text-2xl font-bold leading-snug text-balance">
            Pressure-test before you write a line.
          </h2>
          <p className="text-base leading-relaxed text-primary-foreground/60">
            Five structured review stages run before spec authoring — each producing a governed patch proposal that nothing auto-applies.
          </p>
        </div>
        <ol className="grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {auditStages.map((s) => (
            <li key={s.n} className="flex flex-col gap-2 rounded-2xl border border-border-dark bg-surface-elevated px-5 py-4">
              <span className="text-xs font-bold tabular-nums text-accent/60">{s.n}</span>
              <p className="text-sm font-semibold text-primary-foreground">{s.title}</p>
              <p className="text-xs leading-relaxed text-primary-foreground/55">{s.sub}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="border-t border-border-dark" />

      {/* ─── Step 2: Spec ─────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-6 py-16 sm:px-8 lg:px-10 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-24">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent/70">
              Step 2 — Spec
            </p>
            <h2 className="text-2xl font-bold leading-snug text-balance">
              Every AI edit is a proposal.
            </h2>
            <p className="max-w-[44ch] text-base leading-relaxed text-primary-foreground/60">
              Humans and AI agents work on the same canvas in real time. Agent edits land as block-level patches with rationale — nothing merges silently.
            </p>
            <Link
              href="/workspace?source=feature_governance"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              See the workspace <ArrowRight size={13} />
            </Link>
          </div>

          <Card className="p-1">
            <CardPanel>
              <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
                <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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

      {/* ─── Step 3: Hand off ─────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-6 py-16 sm:px-8 lg:px-10 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-24">
          {/* Reverse column order on desktop — breaks visual rhythm */}
          <Card className="p-1 lg:order-2">
            <CardPanel>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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

          <div className="space-y-5 lg:order-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent/70">
              Step 3 — Hand off
            </p>
            <h2 className="text-2xl font-bold leading-snug text-balance">
              One bundle. Builders start immediately.
            </h2>
            <p className="max-w-[44ch] text-base leading-relaxed text-primary-foreground/60">
              PRD, SPEC, TASKS, and agent brief — one export downstream builders consume without reconstructing context from scratch.
            </p>
            <div className="flex flex-wrap gap-5 text-sm text-primary-foreground/55">
              <span className="inline-flex items-center gap-1.5">
                <Zap size={13} className="text-accent" /> Zero context reconstruction
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield size={13} className="text-accent" /> Full audit trail
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <div className="border-t border-border-dark" />
      <section className="mx-auto w-full max-w-[1100px] px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <h2 className="max-w-[20ch] text-balance text-2xl font-bold leading-tight tracking-tight">
              Apply for pilot access.
            </h2>
            <p className="max-w-[38ch] text-base leading-relaxed text-primary-foreground/60">
              Demo is open. Hosted team access reviewed from the intake queue.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-4">
            <Button asChild variant="outline" size="lg">
              <Link href="/workspace?source=landing_cta">Try the demo</Link>
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

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-border-dark">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
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
