import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GitMerge, Package, Users } from "lucide-react";
import { heroVariantOrder, heroVariants, type HeroVariant } from "@/lib/specforge/marketing";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardPanel } from "@/components/ui/card";

const GITHUB_URL = "https://github.com/chimera-defi/specforge";

type Props = {
  searchParams?: Promise<{ variant?: string }>;
};

const stages = [
  { n: "01", label: "Problem" },
  { n: "02", label: "Strategy" },
  { n: "03", label: "Engineering" },
  { n: "04", label: "Design" },
  { n: "05", label: "Security" },
];

export default async function LandingPage({ searchParams }: Props) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const heroVariant =
    typeof resolvedSearchParams.variant === "string" &&
    heroVariantOrder.includes(resolvedSearchParams.variant as HeroVariant)
      ? (resolvedSearchParams.variant as HeroVariant)
      : "handoff";
  const copy = heroVariants[heroVariant];

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      <SiteNav
        variant="dark"
        ctaHref="/pilot-access?source=landing_nav"
        ctaLabel="Request access"
        ctaVariant="default"
      />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="mx-auto flex w-full max-w-[780px] flex-col items-center px-5 pb-14 pt-16 text-center md:pt-24">
        <Badge variant="outline" className="mb-6">
          {copy.eyebrow}
        </Badge>

        <h1 className="text-balance text-[clamp(2.6rem,7vw,4.8rem)] font-black leading-[0.98] tracking-tight">
          {copy.headline}
        </h1>

        <p className="mt-5 max-w-[52ch] text-base leading-[1.65] text-primary-foreground/60">
          {copy.subhead}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="default" size="lg">
            <Link href="/pilot-access?source=landing_hero">
              Request pilot access
              <ArrowRight size={15} />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/workspace?source=landing_hero">Try demo workspace</Link>
          </Button>
        </div>
      </section>

      {/* ── Product screenshot ───────────────────────────────────── */}
      <div className="relative mx-auto w-full max-w-[1060px] px-4 pb-0">
        <figure className="overflow-hidden rounded-t-[var(--radius-xl)] border border-b-0 border-white/10 bg-primary shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
          <div className="flex min-h-[2.5rem] items-center gap-2 border-b border-white/8 bg-white/4 px-4">
            <span className="h-2 w-2 rounded-full bg-white/18" />
            <span className="h-2 w-2 rounded-full bg-white/18" />
            <span className="h-2 w-2 rounded-full bg-white/18" />
            <span className="ml-3 font-mono text-[0.68rem] text-primary-foreground/35">
              specforge · workspace
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-[0.68rem] font-semibold text-accent/70">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Live
            </span>
          </div>
          <Image
            src="/marketing/specforge-workspace-preview.png"
            alt="SpecForge workspace — shared specification with review queue and export panels"
            width={1360}
            height={850}
            priority
            sizes="(min-width: 1100px) 1060px, calc(100vw - 2rem)"
            className="aspect-[16/10] w-full object-cover object-top"
          />
        </figure>
      </div>

      {/* ── Content sections (parchment) ─────────────────────────── */}
      <div className="bg-background text-foreground">

        {/* Stage strip */}
        <section className="mx-auto w-full max-w-[1100px] px-5 py-12">
          <div className="flex flex-col gap-5 border-b border-border-mid pb-12 sm:flex-row sm:items-center sm:justify-between">
            <p className="shrink-0 text-xs font-black uppercase tracking-[0.18em] text-amber">
              5-stage idea audit — built in
            </p>
            <ol className="flex min-w-0 flex-wrap items-center gap-y-2 text-sm font-semibold text-muted-foreground">
              {stages.map((s, i) => (
                <li key={s.n} className="flex items-center">
                  <span className="text-foreground">{s.n}</span>
                  <span className="ml-1.5 truncate">{s.label}</span>
                  {i < stages.length - 1 && (
                    <span className="mx-2.5 select-none text-border-mid">·</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Feature 1 — patch governance */}
        <section className="mx-auto w-full max-w-[1100px] px-5 pb-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber">
                Patch governance
              </p>
              <h2 className="mt-4 text-balance text-[clamp(1.9rem,3.8vw,2.8rem)] font-black leading-[1.05] tracking-tight">
                Every AI edit is a proposal. Humans decide what merges.
              </h2>
              <p className="mt-4 max-w-[46ch] text-base leading-[1.7] text-muted-foreground">
                Agent contributions land as block-level patches with rationale, confidence, and
                decision history. Nothing rewrites your document silently.
              </p>
              <Link
                href="/workspace?source=feature1"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
              >
                See the workspace <ArrowRight size={13} />
              </Link>
            </div>
            <Card className="p-1">
              <CardPanel>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                    Review queue · 3 proposals
                  </span>
                  <Badge variant="success">1 accepted</Badge>
                </div>
                {[
                  { block: "§ Problem Statement", type: "structural_edit", status: "pending" },
                  { block: "§ Success Metrics", type: "content_addition", status: "pending" },
                  { block: "§ Architecture", type: "task_export_change", status: "accepted" },
                ].map((p) => (
                  <div
                    key={p.block}
                    className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5 last:mb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{p.block}</p>
                      <p className="text-xs text-muted-foreground">{p.type}</p>
                    </div>
                    <Badge variant={p.status === "accepted" ? "success" : "default"}>
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </CardPanel>
            </Card>
          </div>
        </section>

        {/* Feature 2 — idea audit (dark) */}
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto w-full max-w-[1100px] px-5 py-20">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
              <div className="order-2 lg:order-1">
                <ol className="space-y-4">
                  {[
                    { n: "01", title: "Problem framing", sub: "Six forcing questions. Product thesis, kill criteria, competitors." },
                    { n: "02", title: "CEO review", sub: "10-star vision, scope decisions, financial model, non-goals." },
                    { n: "03", title: "Engineering review", sub: "Architecture, failure modes, implementation brief." },
                    { n: "04", title: "Design review", sub: "Design system constraints, interaction model, UX pack." },
                    { n: "05", title: "Security review", sub: "OWASP threat model, trust boundaries, risk register." },
                  ].map((s) => (
                    <li key={s.n} className="flex gap-4">
                      <span className="mt-0.5 shrink-0 text-xs font-black text-accent/70">{s.n}</span>
                      <div>
                        <p className="text-sm font-semibold text-primary-foreground">{s.title}</p>
                        <p className="text-sm leading-relaxed text-primary-foreground/50">{s.sub}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="order-1 lg:order-2">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-accent/70">
                  Idea audit
                </p>
                <h2 className="mt-4 text-balance text-[clamp(1.9rem,3.8vw,2.8rem)] font-black leading-[1.05] tracking-tight">
                  Pressure-test the idea before you write a line of spec.
                </h2>
                <p className="mt-4 max-w-[44ch] text-base leading-[1.7] text-primary-foreground/55">
                  G-Stack-inspired planning stages run before any spec authoring. Each stage
                  produces a governed patch proposal — nothing auto-applies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 3 — handoff */}
        <section className="mx-auto w-full max-w-[1100px] px-5 py-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber">
                Handoff
              </p>
              <h2 className="mt-4 text-balance text-[clamp(1.9rem,3.8vw,2.8rem)] font-black leading-[1.05] tracking-tight">
                One packet. PRD, SPEC, TASKS, and agent brief.
              </h2>
              <p className="mt-4 max-w-[46ch] text-base leading-[1.7] text-muted-foreground">
                Export a single governed bundle that downstream builders consume without
                reconstructing context from chat history.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Users size={13} className="text-accent" /> Multiplayer canvas
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <GitMerge size={13} className="text-accent" /> Patch approvals
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Package size={13} className="text-accent" /> Export bundle
                </span>
              </div>
            </div>
            <Card className="p-1">
              <CardPanel>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                  handoff.json
                </p>
                <div className="space-y-2">
                  {["PRD.md", "SPEC.md", "TASKS.md", "agent_spec.json", "execution_brief.json"].map(
                    (f) => (
                      <div
                        key={f}
                        className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2"
                      >
                        <span className="font-mono text-sm text-foreground">{f}</span>
                        <Badge variant="success">ready</Badge>
                      </div>
                    ),
                  )}
                </div>
              </CardPanel>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border-mid bg-secondary">
          <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center px-5 py-20 text-center">
            <h2 className="text-balance text-[clamp(1.9rem,3.8vw,2.8rem)] font-black leading-tight tracking-tight">
              Apply for hosted pilot access.
            </h2>
            <p className="mt-3 max-w-[44ch] text-base leading-relaxed text-muted-foreground">
              Demo workspace is open now. Hosted team access is reviewed from the intake queue.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="default" size="lg">
                <Link href="/pilot-access?source=landing_cta">
                  Request pilot access
                  <ArrowRight size={15} />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/workspace?source=landing_cta">Try demo workspace</Link>
              </Button>
            </div>
          </div>
        </section>

      </div>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">
            SpecForge Studio
          </span>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {[
              { href: "/pricing", label: "Pricing" },
              { href: "/download", label: "Download" },
              { href: GITHUB_URL, label: "GitHub", external: true },
              { href: "/pilot-access", label: "Pilot access" },
              { href: "/workspace", label: "Demo workspace" },
            ].map((l) =>
              l.external ? (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
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
          <span className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SpecForge
          </span>
        </div>
      </footer>
    </div>
  );
}
