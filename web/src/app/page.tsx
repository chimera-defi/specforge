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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      <SiteNav
        variant="dark"
        ctaHref="/pilot-access?source=landing_nav"
        ctaLabel="Request access"
        ctaVariant="default"
      />

      {/* ── Hero — left-aligned, mockup right ───────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-5 pb-16 pt-20 md:pt-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div>
            <Badge variant="outline" className="mb-6 border-border-dark text-primary-foreground/60">
              Multiplayer spec studio
            </Badge>

            <h1 className="max-w-[15ch] text-balance text-[clamp(2.4rem,5vw,4rem)] font-bold leading-[1.0] tracking-tight">
              Teams spec together. Agents propose. Humans decide.
            </h1>

            <p className="mt-5 max-w-[46ch] text-base leading-[1.7] text-primary-foreground/55">
              Multiple humans and AI agents on the same canvas.
              Nothing merges silently — every agent edit lands as a reviewable patch.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
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

          {/* Hero mockup — patch review queue */}
          <Card className="p-1">
            <CardPanel>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Live collaborators
                </span>
                <Badge variant="success">3 online</Badge>
              </div>
              <div className="mb-4 space-y-2">
                {[
                  { name: "Alex", role: "Founder", action: "Editing § Problem Statement", color: "#0f766e" },
                  { name: "Claude", role: "Agent", action: "Proposing § Architecture patch", color: "#18536d" },
                  { name: "Sam", role: "Engineer", action: "Reviewing § Success Metrics", color: "#6d28a8" },
                ].map((p) => (
                  <div key={p.name} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {p.name}
                        <span className="ml-1.5 font-normal text-muted-foreground text-xs">{p.role}</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{p.action}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Review queue · 2 pending
                </p>
                {[
                  { block: "§ Problem Statement", type: "structural edit", status: "pending" },
                  { block: "§ Architecture", type: "task export change", status: "accepted" },
                ].map((p) => (
                  <div key={p.block} className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 last:mb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{p.block}</p>
                      <p className="text-xs text-muted-foreground">{p.type}</p>
                    </div>
                    <Badge variant={p.status === "accepted" ? "success" : "default"}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            </CardPanel>
          </Card>
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="border-t border-border-dark" />

      {/* ── Feature: Patch governance ────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-5 py-24">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/70">
              Patch governance
            </p>
            <h2 className="mt-4 max-w-[18ch] text-balance text-[clamp(1.8rem,3vw,2.5rem)] font-bold leading-[1.05] tracking-tight">
              Every AI edit is a proposal. You decide what merges.
            </h2>
            <p className="mt-4 max-w-[46ch] text-base leading-[1.7] text-primary-foreground/55">
              Agent contributions land as block-level patches with rationale, confidence,
              and decision history. Nothing rewrites your document silently.
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
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Review queue · 3 proposals
                </span>
                <Badge variant="success">1 accepted</Badge>
              </div>
              {[
                { block: "§ Problem Statement", type: "structural edit", status: "pending" },
                { block: "§ Success Metrics", type: "content addition", status: "pending" },
                { block: "§ Architecture", type: "task export change", status: "accepted" },
              ].map((p) => (
                <div key={p.block} className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5 last:mb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{p.block}</p>
                    <p className="text-xs text-muted-foreground">{p.type}</p>
                  </div>
                  <Badge variant={p.status === "accepted" ? "success" : "default"}>{p.status}</Badge>
                </div>
              ))}
            </CardPanel>
          </Card>
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="border-t border-border-dark" />

      {/* ── Feature: Idea audit ──────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-5 py-24">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/70">
              Built-in idea audit
            </p>
            <h2 className="mt-4 max-w-[18ch] text-balance text-[clamp(1.8rem,3vw,2.5rem)] font-bold leading-[1.05] tracking-tight">
              Pressure-test the idea before you write a line of spec.
            </h2>
            <p className="mt-4 max-w-[44ch] text-base leading-[1.7] text-primary-foreground/55">
              Five structured planning stages run before any spec authoring.
              Each produces a governed patch proposal — nothing auto-applies.
            </p>
          </div>

          <ol className="space-y-5">
            {auditStages.map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="mt-0.5 shrink-0 text-xs font-semibold tabular-nums text-accent/60">{s.n}</span>
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">{s.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-primary-foreground/50">{s.sub}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="border-t border-border-dark" />

      {/* ── Feature: Handoff ─────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1100px] px-5 py-24">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/70">
              Handoff
            </p>
            <h2 className="mt-4 max-w-[18ch] text-balance text-[clamp(1.8rem,3vw,2.5rem)] font-bold leading-[1.05] tracking-tight">
              One packet. PRD, SPEC, TASKS, and agent brief.
            </h2>
            <p className="mt-4 max-w-[46ch] text-base leading-[1.7] text-primary-foreground/55">
              Export a single governed bundle that downstream builders consume without
              reconstructing context from chat history.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-primary-foreground/50">
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
                {["PRD.md", "SPEC.md", "TASKS.md", "agent_spec.json", "execution_brief.json"].map((f) => (
                  <div key={f} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
                    <span className="font-mono text-sm text-foreground">{f}</span>
                    <Badge variant="success">ready</Badge>
                  </div>
                ))}
              </div>
            </CardPanel>
          </Card>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <div className="border-t border-border-dark" />
      <section className="mx-auto w-full max-w-[1100px] px-5 py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="max-w-[20ch] text-balance text-[clamp(1.8rem,3vw,2.5rem)] font-bold leading-tight tracking-tight">
              Apply for hosted pilot access.
            </h2>
            <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-primary-foreground/55">
              Demo workspace is open now. Hosted team access is reviewed from the intake queue.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Button asChild variant="outline" size="lg">
              <Link href="/workspace?source=landing_cta">Try demo workspace</Link>
            </Button>
            <Button asChild variant="default" size="lg">
              <Link href="/pilot-access?source=landing_cta">
                Request pilot access
                <ArrowRight size={15} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-border-dark">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/35">
            SpecForge Studio
          </span>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {[
              { href: "/pricing", label: "Pricing" },
              { href: "/download", label: "Download" },
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
