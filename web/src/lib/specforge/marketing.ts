export type HeroVariant = "handoff" | "multiplayer" | "ship" | "idea-audit";

export const heroVariantOrder: HeroVariant[] = ["handoff", "multiplayer", "ship", "idea-audit"];

export const heroVariants: Record<
  HeroVariant,
  {
    eyebrow: string;
    headline: string;
    subhead: string;
    tagline?: string;
  }
> = {
  handoff: {
    eyebrow: "Idea audit → governed spec → build handoff",
    headline: "From rough idea to build-ready spec. Five stages, zero silent rewrites.",
    subhead:
      "SpecForge pressure-tests your idea across five G-Stack planning stages, then guides a governed spec where every AI edit is a reviewable patch proposal.",
    tagline: "Multiplayer specs for one-shot builds",
  },
  multiplayer: {
    eyebrow: "One canvas for humans and agents",
    headline: "Collaborative spec writing that stays reviewable and build-ready.",
    subhead:
      "Humans edit live, agents propose patches, and the final handoff stays attributable enough to trust.",
    tagline: "Shared specs, shared context, cleaner buildouts",
  },
  ship: {
    eyebrow: "Specs that keep moving",
    headline: "Turn messy planning into a launch packet a coding agent can actually use.",
    subhead:
      "Guide the spec, review agent work, and hand off one coherent bundle instead of a pile of pasted context.",
    tagline: "Specs that move straight into build mode",
  },
  "idea-audit": {
    eyebrow: "Built-in G-Stack idea audit",
    headline: "Pressure-test the idea before writing a single line of spec.",
    subhead:
      "Five structured planning stages — problem framing, CEO review, engineering review, design review, security review — each producing a governed patch proposal before any spec authoring begins.",
    tagline: "Idea audit → spec → handoff",
  },
};
