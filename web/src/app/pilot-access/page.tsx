import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Inbox, ShieldCheck, Users } from "lucide-react";

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
            href="/"
            className="hidden min-h-[2.75rem] items-center rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Home
          </Link>
          <Link
            href="/pricing"
            className="hidden min-h-[2.75rem] items-center rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
          >
            Pricing
          </Link>
          <Link
            href="/workspace?source=pilot_access_nav"
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border border-border-mid bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-light active:scale-[0.98]"
          >
            Demo workspace
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
        title: "Request saved to the pilot queue",
        detail:
          "We received your request. If there is a fit for the current hosted pilot, we will follow up by email with setup details.",
      };
    case "invalid":
      return {
        tone: "border-warning-subtle bg-warning-subtle/55 text-warning",
        title: "Missing required details",
        detail: "Please include your name, work email, GitHub login, and what you want to ship with SpecForge.",
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
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main>
        <section className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-8 px-4 pb-16 pt-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:pt-14">
          <div className="space-y-6 animate-fade-up lg:sticky lg:top-24">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber">Hosted pilot</p>
            <h1 className="max-w-[15ch] text-balance text-[clamp(2.3rem,5vw,4.4rem)] font-black leading-[1.03]">
              Bring SpecForge to a real team workflow.
            </h1>
            <p className="max-w-[60ch] text-[1.04rem] leading-[1.72] text-muted-foreground">
              Apply for the hosted pilot if your team needs multiplayer spec writing, governed AI
              edits, and a cleaner handoff into implementation. The demo workspace remains open for
              local evaluation.
            </p>

            {selectedPlan ? (
              <div className="max-w-[60ch] rounded-[var(--radius-md)] border border-teal-border bg-teal-subtle px-4 py-3 text-sm leading-relaxed text-foreground">
                You selected the <strong>{selectedPlanLabel}</strong> pilot path. We will confirm fit,
                onboarding needs, and billing expectations by email before granting hosted access.
              </div>
            ) : null}

            <div className="grid gap-3 rounded-[var(--radius-lg)] border border-border-mid bg-card p-4 shadow-[var(--shadow-card)]">
              {[
                {
                  icon: <Users size={16} />,
                  title: "Who gets priority",
                  body: "Teams actively shipping a product with product, design, engineering, or agent contributors in the loop.",
                },
                {
                  icon: <ShieldCheck size={16} />,
                  title: "What we verify",
                  body: "Collaboration needs, patch governance expectations, workspace membership, and GitHub-based pilot setup.",
                },
                {
                  icon: <Inbox size={16} />,
                  title: "Where requests go",
                  body: "Submissions are persisted in the SpecForge pilot review queue. Local demos can review them from the workspace triage panel.",
                },
              ].map((item) => (
                <div key={item.title} className="grid gap-1 border-t border-border first:border-t-0 first:pt-0 pt-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span className="text-accent">{item.icon}</span>
                    {item.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <a
                href="#pilot-form"
                className="inline-flex min-h-[2.9rem] w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-accent)] transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-accent-hover)] active:scale-[0.98] sm:w-auto"
              >
                Start request
                <ArrowRight size={15} />
              </a>
              <Link
                href="/workspace?source=pilot_access"
                className="inline-flex min-h-[2.9rem] w-full items-center justify-center rounded-full border border-border-mid bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-light active:scale-[0.98] sm:w-auto"
              >
                Try demo workspace
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

            <section
              id="pilot-form"
              className="rounded-[var(--radius-xl)] border border-border-mid bg-card p-4 shadow-[var(--shadow-card)] sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black tracking-tight">Pilot request</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    This creates a persisted pending request. It does not grant instant hosted access.
                  </p>
                </div>
                <span className="hidden rounded-full border border-teal-border bg-teal-subtle px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent sm:inline-flex">
                  Review queue
                </span>
              </div>

              <form action={requestPilotAccessAction} className="mt-5 grid gap-4">
                <input type="hidden" name="return_to" value="/pilot-access" />
                <input type="hidden" name="source" value={sourceWithPlan} />

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm text-muted-foreground">
                    Full name *
                    <input
                      required
                      name="full_name"
                      maxLength={80}
                      placeholder="Avery Founder"
                      className="min-h-[2.85rem] rounded-xl border border-border-mid bg-input px-3 py-2 text-foreground outline-none transition focus:border-accent"
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
                      className="min-h-[2.85rem] rounded-xl border border-border-mid bg-input px-3 py-2 text-foreground outline-none transition focus:border-accent"
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm text-muted-foreground">
                    Company
                    <input
                      name="company"
                      maxLength={120}
                      placeholder="Acme Labs"
                      className="min-h-[2.85rem] rounded-xl border border-border-mid bg-input px-3 py-2 text-foreground outline-none transition focus:border-accent"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm text-muted-foreground">
                    Company URL
                    <input
                      type="url"
                      name="company_url"
                      maxLength={220}
                      placeholder="https://company.com"
                      className="min-h-[2.85rem] rounded-xl border border-border-mid bg-input px-3 py-2 text-foreground outline-none transition focus:border-accent"
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_0.75fr]">
                  <label className="grid gap-1.5 text-sm text-muted-foreground">
                    GitHub login *
                    <input
                      required
                      name="github_login"
                      maxLength={64}
                      placeholder="octocat"
                      className="min-h-[2.85rem] rounded-xl border border-border-mid bg-input px-3 py-2 text-foreground outline-none transition focus:border-accent"
                    />
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      Hosted pilot workspace membership uses GitHub-linked identity.
                    </span>
                  </label>
                  <label className="grid gap-1.5 text-sm text-muted-foreground">
                    Team size
                    <input
                      type="number"
                      name="team_size"
                      min={1}
                      max={500}
                      placeholder="6"
                      className="min-h-[2.85rem] rounded-xl border border-border-mid bg-input px-3 py-2 text-foreground outline-none transition focus:border-accent"
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm text-muted-foreground">
                    Pilot type
                    <select
                      name="pilot_type"
                      defaultValue={selectedPlan === "enterprise" ? "enterprise" : "team"}
                      className="min-h-[2.85rem] rounded-xl border border-border-mid bg-input px-3 py-2 text-foreground outline-none transition focus:border-accent"
                    >
                      <option value="team">Team SaaS pilot</option>
                      <option value="enterprise">Enterprise evaluation</option>
                      <option value="local">Local alpha first</option>
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-sm text-muted-foreground">
                    Target timeline
                    <input
                      name="deadline"
                      maxLength={120}
                      placeholder="July launch, this sprint, etc."
                      className="min-h-[2.85rem] rounded-xl border border-border-mid bg-input px-3 py-2 text-foreground outline-none transition focus:border-accent"
                    />
                  </label>
                </div>

                <label className="grid gap-1.5 text-sm text-muted-foreground">
                  Current planning tools
                  <input
                    name="current_tools"
                    maxLength={180}
                    placeholder="Notion, Linear, Google Docs, Cursor, Claude Code..."
                    className="min-h-[2.85rem] rounded-xl border border-border-mid bg-input px-3 py-2 text-foreground outline-none transition focus:border-accent"
                  />
                </label>

                <label className="grid gap-1.5 text-sm text-muted-foreground">
                  What are you shipping? *
                  <textarea
                    required
                    name="use_case"
                    rows={4}
                    maxLength={1000}
                    placeholder="We need a governed PRD and review workflow across product, design, engineering, and coding agents for a July launch."
                    className="rounded-xl border border-border-mid bg-input px-3 py-2 text-foreground outline-none transition focus:border-accent"
                  />
                </label>

                <label className="grid gap-1.5 text-sm text-muted-foreground">
                  Notes
                  <textarea
                    name="notes"
                    rows={3}
                    maxLength={1000}
                    placeholder="Current workflow pain, compliance needs, or collaborators who should be involved."
                    className="rounded-xl border border-border-mid bg-input px-3 py-2 text-foreground outline-none transition focus:border-accent"
                  />
                </label>

                <label className="sr-only" aria-hidden>
                  Leave this blank
                  <input tabIndex={-1} autoComplete="off" name="website" />
                </label>

                <p className="rounded-[var(--radius-md)] border border-border bg-surface-light px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                  We use these details only to review pilot fit and follow up about SpecForge access.
                  If a pilot webhook is configured, it receives the submitted contact details;
                  otherwise the request remains only in the workspace triage queue.
                </p>

                <button
                  type="submit"
                  className="inline-flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-accent)] transition hover:-translate-y-[1px] hover:shadow-[var(--shadow-accent-hover)] active:scale-[0.98]"
                >
                  Submit pilot request
                  <ArrowRight size={15} />
                </button>
              </form>
            </section>

            <section className="rounded-[var(--radius-xl)] border border-border-mid bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-foreground">
                <CheckCircle2 size={14} className="text-accent" />
                What happens next
              </h3>
              <ol className="mt-3 grid gap-3 text-sm leading-relaxed text-muted-foreground">
                <li className="flex gap-3">
                  <Clock3 size={16} className="mt-0.5 shrink-0 text-accent" />
                  <span>Your request is saved as pending in the SpecForge pilot access queue.</span>
                </li>
                <li className="flex gap-3">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent" />
                  <span>We review fit, timeline, membership setup, and whether hosted pilot capacity is available.</span>
                </li>
                <li className="flex gap-3">
                  <Inbox size={16} className="mt-0.5 shrink-0 text-accent" />
                  <span>If approved, we follow up by email with onboarding and workspace setup details.</span>
                </li>
              </ol>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
