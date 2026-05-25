# Landing Page Redesign Plan
> Branch: feat/landing-redesign-2 | Date: 2026-05-25

## Root Cause Diagnosis

### Problem 1 — Color thrash (the "black/white/black/white" issue)
The current page has 5 background switches in ~700px of scroll:
1. `bg-primary` (dark) — hero
2. `bg-background` (warm parchment #f1e8db) — stage strip + feature 1 + feature 3
3. `bg-primary` (dark) — feature 2 "idea audit"
4. `bg-secondary` (#fbf6ed) — CTA
5. `bg-background` — footer

These switches are arbitrary (no visual logic), making the page feel unstable.

### Problem 2 — Dual token system
`globals.css` has both `@theme { --color-* }` (Tailwind v4) AND `:root { --sf-* }` defining the same values twice. This is fine technically but creates maintenance confusion — keep it as-is to avoid breaking the workspace app, just don't add more to it.

### Problem 3 — Multiplayer story buried
The product is a **multiplayer canvas** (multiple humans + multiple AI agents). The current hero default is `handoff` variant. "Multiplayer" is only shown if you hit `?variant=multiplayer`. The most important differentiator is hidden.

### Problem 4 — Text overruns
Hero `h1` uses `clamp(2.6rem, 7vw, 4.8rem)` with no `max-width` guard on the container (780px is set but the text still wraps awkwardly at 500–700px viewport). `text-balance` helps but the font size climbs too high.

### Problem 5 — Spacing too tight
Section padding is `py-12` / `py-20` — too small. Elements inside sections also have tight gaps (`gap-12`, should be `gap-16`).

### Problem 6 — Copy redundancy
"Patch governance" / "reviewable before apply" / "governed patches" appears in hero, feature 1, feature 2, and CTA. Pick one place for each idea.

---

## Design Decisions

### Color: Unified Dark
**Decision:** Single dark palette throughout the entire landing page.

- Background: `bg-primary` (`#18212b`) everywhere
- Surface elevation: use `bg-white/[0.04]` and `bg-white/[0.07]` for cards/panels (matches chimericlabs pattern)
- Text: `text-primary-foreground` (`#f7f3ea`) 
- Muted text: `text-primary-foreground/55`
- Accent: `text-accent` (`#0f766e`) for eyebrows, links, step numbers
- Border: `border-white/10`

This eliminates switching. The workspace pages (light warm theme) are unaffected — they don't use `bg-background` from the landing wrapper.

### Typography: Tighten the scale
- Hero h1: `clamp(2.4rem, 5.5vw, 4.2rem)` — slightly smaller ceiling, prevents overrun
- All h2 sections: `text-[clamp(1.8rem,3.2vw,2.6rem)]`
- Body max-width: `52ch` (already set, keep)
- Add `text-wrap: balance` to ALL headings via Tailwind `text-balance`

### Layout: More breathing room
- Hero: `pt-20 pb-16 md:pt-28` 
- All feature sections: `py-28`
- Grid gaps: `gap-16 lg:gap-24`
- Section dividers: subtle `border-t border-white/[0.08]`

### Copy: Multiplayer-first hero
**Default variant becomes `multiplayer`** — or better, a new merged headline that leads with the team angle:

> *Eyebrow:* "Multiplayer spec studio"
> *H1:* "Teams spec together. Agents propose. Humans decide."
> *Subhead:* "A shared canvas where multiple humans and AI agents build the spec — every agent edit is a reviewable patch, nothing merges silently."

### Section sequence (revised)
```
Nav (dark sticky)
1. Hero (dark)          — multiplayer headline, 2 CTAs
2. Social proof strip   — "Multiplayer", "Governed patches", "1-click handoff" — 3 pills
3. Feature: Multiplayer canvas  — show collaboration angle (NEW)
4. Feature: Patch governance    — review queue mockup (existing, keep)
5. Feature: Idea audit          — 5-stage list (existing, keep)
6. Feature: Handoff bundle      — file list mockup (existing, keep)
7. CTA                  — single, clean
Footer (dark)
```

No light sections. One consistent dark surface throughout.

---

## Implementation Checklist

- [ ] Update `page.tsx` — new hero copy (multiplayer variant default), remove product screenshot placeholder (it 404s anyway), unified dark wrappers
- [ ] Update `globals.css` — add a `--color-surface-elevated` token for dark card surfaces (avoids inline opacity hacks)
- [ ] Update `site-nav.tsx` — lock to `variant="dark"` always on landing (or update the component to not require explicit variant)
- [ ] Add multiplayer social proof section (new, lightweight — 3 stats or feature pills)
- [ ] Fix all section `py-*` spacing → `py-28`
- [ ] Fix grid gaps → `gap-16 lg:gap-24`
- [ ] Remove bg-background / bg-secondary switches — all become `bg-primary`
- [ ] Fix text overrun: hero h1 clamp ceiling down to 4.2rem
- [ ] Trim redundant copy
- [ ] Run `bun run lint && bun run build:web`
- [ ] Take screenshots with Playwright

---

## Anti-patterns to avoid (per DESIGN.md)
- No 3-column feature card grids
- No decorative blobs or wavy dividers  
- No emoji as design elements
- No centered-everything layout
- No hardcoded hex values (use tokens)
