import Link from "next/link";
import { ArrowRight, Zap, Shield } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardPanel } from "@/components/ui/card";

const GITHUB_URL = "https://github.com/chimera-defi/specforge";

// Inline styles bypass the Turbopack @layer cascade issue where @layer utilities
// padding/margin are overridden by the @layer base universal reset.
const container: React.CSSProperties = {
  maxWidth: "1100px",
  marginLeft: "auto",
  marginRight: "auto",
  paddingLeft: "clamp(1.5rem, 5vw, 4rem)",
  paddingRight: "clamp(1.5rem, 5vw, 4rem)",
};

const sectionPad: React.CSSProperties = {
  paddingTop: "clamp(4rem, 8vw, 8rem)",
  paddingBottom: "clamp(4rem, 8vw, 8rem)",
};

const cardItem: React.CSSProperties = {
  paddingLeft: "0.75rem",
  paddingRight: "0.75rem",
  paddingTop: "0.625rem",
  paddingBottom: "0.625rem",
};

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

const liveCollaborators = [
  { name: "Alex", role: "Founder", action: "Editing Problem Statement", dotClass: "bg-role-human" },
  { name: "Claude", role: "Agent", action: "Proposing Architecture patch", dotClass: "bg-role-agent" },
  { name: "Sam", role: "Engineer", action: "Reviewing Success Metrics", dotClass: "bg-role-design" },
];

const heroReviewQueue = [
  { block: "Problem Statement", type: "structural edit", status: "pending" },
  { block: "Architecture", type: "task export change", status: "accepted" },
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

      <main>
        {/* ─── Hero ──────────────────────────────────────────── */}
        <section className="w-full" style={{ ...container, paddingTop: "5rem", paddingBottom: "4rem" }}>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", alignItems: "flex-start" }}>
              <Badge variant="outline" className="border-border-dark text-primary-foreground/60">
                Idea validation · Spec creation
              </Badge>

              <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
                From idea to<br className="hidden sm:block" /> build-ready spec.
              </h1>

              <p className="text-base leading-relaxed text-primary-foreground/60" style={{ maxWidth: "42ch" }}>
                Validate your idea, spec it collaboratively with AI, and hand off a build-ready bundle — without losing the reasoning.
              </p>

              <div className="flex flex-wrap gap-4" style={{ paddingTop: "0.5rem" }}>
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
            <Card>
              <CardPanel>
                <div className="flex min-w-0 items-center justify-between gap-2" style={{ marginBottom: "0.75rem" }}>
                  <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Live collaborators
                  </span>
                  <Badge variant="success" className="shrink-0">3 online</Badge>
                </div>
                <div style={{ marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {liveCollaborators.map((p) => (
                    <div key={p.name} className="flex items-center gap-3 rounded-xl border border-border bg-card" style={cardItem}>
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
                <div className="hidden border-t border-border sm:block" style={{ paddingTop: "0.75rem" }}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground" style={{ marginBottom: "0.5rem" }}>
                    Review queue · 2 pending
                  </p>
                  {heroReviewQueue.map((p) => (
                    <div key={p.block} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card" style={{ ...cardItem, marginBottom: "0.5rem" }}>
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
        <section className="w-full" style={{ ...container, ...sectionPad }}>
          <div className="space-y-7" style={{ marginBottom: "3rem", maxWidth: "52ch" }}>
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
              <li key={s.n} className="flex flex-col gap-2 rounded-2xl border border-border-dark bg-surface-elevated" style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem", paddingTop: "1rem", paddingBottom: "1rem" }}>
                <span className="text-xs font-bold tabular-nums text-accent/60">{s.n}</span>
                <p className="text-sm font-semibold text-primary-foreground">{s.title}</p>
                <p className="text-xs leading-relaxed text-primary-foreground/55">{s.sub}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="border-t border-border-dark" />

        {/* ─── Step 2: Spec ─────────────────────────────────── */}
        <section className="w-full" style={{ ...container, ...sectionPad }}>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-24">
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent/70">
                Step 2 — Spec
              </p>
              <h2 className="text-2xl font-bold leading-snug text-balance">
                Every AI edit is a proposal.
              </h2>
              <p className="text-base leading-relaxed text-primary-foreground/60" style={{ maxWidth: "44ch" }}>
                Humans and AI agents work on the same canvas in real time. Agent edits land as block-level patches with rationale — nothing merges silently.
              </p>
              <Link
                href="/workspace?source=feature_governance"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
              >
                See the workspace <ArrowRight size={13} />
              </Link>
            </div>

            <Card>
              <CardPanel>
                <div className="flex min-w-0 items-center justify-between gap-2" style={{ marginBottom: "0.75rem" }}>
                  <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Review queue · 3 proposals
                  </span>
                  <Badge variant="success" className="shrink-0">1 accepted</Badge>
                </div>
                {reviewQueue.map((p) => (
                  <div key={p.block} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card" style={{ ...cardItem, marginBottom: "0.5rem" }}>
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
        <section className="w-full" style={{ ...container, ...sectionPad }}>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-24">
            <Card className="lg:order-2">
              <CardPanel>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground" style={{ marginBottom: "0.75rem" }}>
                  handoff.json
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {handoffFiles.map((f) => (
                    <div key={f} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card" style={{ paddingLeft: "0.75rem", paddingRight: "0.75rem", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}>
                      <span className="min-w-0 truncate font-mono text-sm text-foreground">{f}</span>
                      <Badge variant="success" className="shrink-0">ready</Badge>
                    </div>
                  ))}
                </div>
              </CardPanel>
            </Card>

            <div className="lg:order-1" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent/70">
                Step 3 — Hand off
              </p>
              <h2 className="text-2xl font-bold leading-snug text-balance">
                One bundle. Builders start immediately.
              </h2>
              <p className="text-base leading-relaxed text-primary-foreground/60" style={{ maxWidth: "44ch" }}>
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
        <section className="w-full" style={{ ...container, paddingTop: "clamp(3rem, 6vw, 7rem)", paddingBottom: "clamp(3rem, 6vw, 7rem)" }}>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h2 className="text-balance text-2xl font-bold leading-tight tracking-tight" style={{ maxWidth: "20ch" }}>
                Apply for pilot access.
              </h2>
              <p className="text-base leading-relaxed text-primary-foreground/60" style={{ maxWidth: "38ch" }}>
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
      </main>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-border-dark">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" style={{ ...container, paddingTop: "2rem", paddingBottom: "2rem" }}>
          <span className="text-xs font-black uppercase tracking-widest text-primary-foreground/35">
            SpecForge
          </span>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {[
              { href: "/pricing", label: "Pricing" },
              { href: GITHUB_URL, label: "GitHub", external: true },
              { href: "/pilot-access", label: "Pilot access" },
              { href: "/workspace", label: "Demo" },
            ].map((l) =>
              l.external ? (
                <a key={l.href} href={l.href} target="_blank" rel="noreferrer"
                  aria-label="GitHub (opens in new tab)"
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
