export type HeroVariant = "handoff" | "multiplayer" | "ship" | "idea-audit";

export const heroVariantOrder: HeroVariant[] = ["handoff", "multiplayer", "ship", "idea-audit"];

export const heroVariants: Record<
  HeroVariant,
  { eyebrow: string; headline: string; subhead: string }
> = {
  handoff: {
    eyebrow: "Spec collaboration for AI-assisted teams",
    headline: "AI edits. Human decisions. One launch packet.",
    subhead: "Governed spec authoring where every agent edit is a reviewable patch — not a silent rewrite.",
  },
  multiplayer: {
    eyebrow: "Multiplayer spec studio",
    headline: "One canvas. Humans and agents, governed.",
    subhead: "Live collaboration with block-level patch review. Every AI contribution is attributable and reversible.",
  },
  ship: {
    eyebrow: "From rough idea to build-ready",
    headline: "Turn a brief into a launch packet a builder can use.",
    subhead: "Guide the spec, govern the AI edits, and hand off one coherent bundle — not a pile of pasted context.",
  },
  "idea-audit": {
    eyebrow: "Built-in G-Stack idea audit",
    headline: "Pressure-test before you spec. Five stages, zero surprises.",
    subhead: "Structured planning stages run before any spec authoring. Problem, strategy, engineering, design, security — each a governed patch proposal.",
  },
};
