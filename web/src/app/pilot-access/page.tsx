import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck, Users } from "lucide-react";

import { requestPilotAccessAction } from "../actions";

type Props = {
  searchParams?: Promise<{
    status?: string;
    source?: string;
    plan?: string;
  }>;
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
            href="/"
            className="inline-flex min-h-[2.7rem] items-center rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="/pricing"
            className="inline-flex min-h-[2.7rem] items-center rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
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

function getStatusMessage(status: string | undefined) {
  switch (status) {
    case "submitted":
      return {
        tone: "border-success-subtle bg-success-subtle/55 text-success",
        title: "Request submitted",
        detail: "Thanks — we received your pilot request. We will review and follow up by email.",
      };
    case "invalid":
      return {
        tone: "border-warning-subtle bg-warning-subtle/55 text-warning",
        title: "Missing required details",
        detail: "Please include your name, work email, and what you want to ship with SpecForge.",
      };
    case "unavailable":
      return {
        tone: "border-warning-subtle bg-warning-subtle/55 text-warning",
        title: "Pilot intake temporarily unavailable",
        detail: "Please try again shortly or contact us through your existing founder channel.",
      };
    case "error":
      return {
        tone: "border-destructive/40 bg-destructive/15 text-destructive",
        title: "Submission failed",
        detail: "Something went wrong while saving your request. Please retry in a moment.",
      };
    case "rate_limited":
      return {
        tone: "border-warning-subtle bg-warning-subtle/55 text-warning",
        title: "Too many requests",
        detail: "Please wait before submitting another pilot request from this connection.",
      };
    default:
      return null;
  }
}

export default async function PilotAccessPage({ searchParams }: Props) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const statusMessage = getStatusMessage(
    typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : undefined,
  );
  const selectedPlan =
    resolvedSearchParams.plan === "pilot" || resolvedSearchParams.plan === "enterprise"
      ? resolvedSearchParams.plan
      : null;
  const source =
    typeof resolvedSearchParams.source === "string" && resolvedSearchParams.source.length > 0
      ? resolvedSearchParams.source
      : "pilot_access_page";
  const sourceWithPlan = selectedPlan ? `${source}:${selectedPlan}` : source;
  const selectedPlanLabel = selectedPlan === "enterprise" ? "Enterprise" : "Team SaaS";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute left-[-12rem] top-[-6rem] h-[26rem] w-[26rem] rounded-full bg-teal-subtle blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-9rem] right-[-9rem] h-[22rem] w-[22rem] rounded-full bg-blue-subtle blur-3xl" />

      <Nav />

      <section className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-8 px-4 pb-16 pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
        <div className="space-y-6 animate-fade-up">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-accent">Pilot access</p>
          <h1 className="max-w-[16ch] text-balance text-[clamp(2.25rem,6vw,4.4rem)] font-black leading-[1.05] tracking-tight">
            Apply for the hosted SpecForge pilot.
          </h1>
          <p className="max-w-[56ch] text-[1.02rem] leading-[1.72] text-muted-foreground">
            We are onboarding teams that need governed human + agent spec workflows with a clean
            handoff into build execution. Tell us what you are shipping and who needs to collaborate.
          </p>
          {selectedPlan ? (
            <div className="max-w-[56ch] rounded-[var(--radius-md)] border border-teal-border bg-teal-subtle/60 px-4 py-3 text-sm text-foreground">
              Pricing selected: <strong>{selectedPlanLabel}</strong>. Submit the form below, then
              verify live subscription status from the workspace billing panel.
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                icon: <Users size={15} />,
                label: "Team-ready",
                detail: "Role-based workspace membership",
              },
              {
                icon: <ShieldCheck size={15} />,
                label: "Governed",
                detail: "Human approval on every patch",
              },
              {
                icon: <Clock3 size={15} />,
                label: "Fast rollout",
                detail: "Pilot triage from the workspace",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[var(--radius-md)] border border-border-mid bg-card px-4 py-3 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="text-accent">{item.icon}</span>
                  {item.label}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="inline-flex min-h-[2.8rem] items-center rounded-full border border-border-mid bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-light active:scale-[0.98]"
            >
              View pricing
            </Link>
            <Link
              href="/download"
              className="inline-flex min-h-[2.8rem] items-center rounded-full border border-border-mid bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-light active:scale-[0.98]"
            >
              Run local alpha
            </Link>
            <Link
              href="/workspace?source=pilot_access#billing-readiness"
              className="inline-flex min-h-[2.8rem] items-center rounded-full border border-border-mid bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-light active:scale-[0.98]"
            >
              Open billing status
            </Link>
          </div>
        </div>

        <div className="space-y-4 animate-fade-up [animation-delay:100ms]">
          {statusMessage ? (
            <div className={`rounded-[var(--radius-md)] border px-4 py-3 text-sm ${statusMessage.tone}`}>
              <p className="font-semibold">{statusMessage.title}</p>
              <p className="mt-1 leading-relaxed">{statusMessage.detail}</p>
            </div>
          ) : null}

          <div className="rounded-[var(--radius-xl)] border border-border-mid bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-black tracking-tight">Request access</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Required fields are marked. We prioritize teams with an active product deadline.
            </p>

            <form action={requestPilotAccessAction} className="mt-4 grid gap-3">
              <input type="hidden" name="return_to" value="/pilot-access" />
              <input type="hidden" name="source" value={sourceWithPlan} />
              <label className="grid gap-1.5 text-sm text-muted-foreground">
                Full name *
                <input
                  required
                  name="full_name"
                  maxLength={80}
                  placeholder="Avery Founder"
                  className="rounded-xl border border-border-mid bg-background px-3 py-2 text-foreground outline-none transition focus:border-accent"
                />
              </label>
              <label className="grid gap-1.5 text-sm text-muted-foreground">
                Work email *
                <input
                  required
                  type="email"
                  name="email"
                  maxLength={140}
                  placeholder="avery@company.com"
                  className="rounded-xl border border-border-mid bg-background px-3 py-2 text-foreground outline-none transition focus:border-accent"
                />
              </label>
              <label className="grid gap-1.5 text-sm text-muted-foreground">
                GitHub login *
                <input
                  required
                  name="github_login"
                  maxLength={64}
                  placeholder="octocat"
                  className="rounded-xl border border-border-mid bg-background px-3 py-2 text-foreground outline-none transition focus:border-accent"
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm text-muted-foreground">
                  Company
                  <input
                    name="company"
                    maxLength={120}
                    placeholder="Acme Labs"
                    className="rounded-xl border border-border-mid bg-background px-3 py-2 text-foreground outline-none transition focus:border-accent"
                  />
                </label>
                <label className="grid gap-1.5 text-sm text-muted-foreground">
                  Role
                  <input
                    name="role"
                    maxLength={120}
                    placeholder="Product Lead"
                    className="rounded-xl border border-border-mid bg-background px-3 py-2 text-foreground outline-none transition focus:border-accent"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[0.42fr_1fr]">
                <label className="grid gap-1.5 text-sm text-muted-foreground">
                  Team size
                  <input
                    type="number"
                    name="team_size"
                    min={1}
                    max={500}
                    placeholder="6"
                    className="rounded-xl border border-border-mid bg-background px-3 py-2 text-foreground outline-none transition focus:border-accent"
                  />
                </label>
                <label className="grid gap-1.5 text-sm text-muted-foreground">
                  What are you shipping? *
                  <textarea
                    required
                    name="use_case"
                    rows={3}
                    maxLength={1000}
                    placeholder="We need a governed PRD + review workflow across product, design, and engineering for a July launch."
                    className="rounded-xl border border-border-mid bg-background px-3 py-2 text-foreground outline-none transition focus:border-accent"
                  />
                </label>
              </div>
              <label className="grid gap-1.5 text-sm text-muted-foreground">
                Notes
                <textarea
                  name="notes"
                  rows={2}
                  maxLength={1000}
                  placeholder="Current tools, timeline, and constraints."
                  className="rounded-xl border border-border-mid bg-background px-3 py-2 text-foreground outline-none transition focus:border-accent"
                />
              </label>

              <label className="sr-only" aria-hidden>
                Leave this blank
                <input tabIndex={-1} autoComplete="off" name="website" />
              </label>

              <button
                type="submit"
                className="inline-flex min-h-[2.95rem] items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-accent)] transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-accent-hover)] active:scale-[0.98]"
              >
                Submit pilot request
                <ArrowRight size={15} />
              </button>
            </form>
          </div>

          <div className="rounded-[var(--radius-xl)] border border-border-mid bg-card p-5 shadow-[var(--shadow-card)]">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-foreground">
              <CheckCircle2 size={14} className="text-accent" />
              What happens next
            </h3>
            <ol className="mt-3 grid gap-2 text-sm leading-relaxed text-muted-foreground">
              <li>1. We review fit and timeline against current pilot capacity.</li>
              <li>2. Qualified teams are approved in the internal workspace triage queue.</li>
              <li>3. You receive onboarding instructions and access setup details by email.</li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
