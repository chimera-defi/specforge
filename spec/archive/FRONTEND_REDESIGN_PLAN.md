# Frontend Redesign Plan

> Status: DRAFT — 2026-05-25
> Scope: `web/src/` only. No backend, no contracts changes.
> Gate: `bun run build:web && bun run lint` must be green after each phase.

---

## Problems

- Nav duplicated verbatim across `app/page.tsx`, `app/pricing/page.tsx`, `app/pilot-access/page.tsx`
- `bg-teal-subtle blur-3xl` decorative blobs on pricing page — banned by `DESIGN.md §Anti-patterns`
- Pricing table cells overflow at mobile widths — no `overflow-hidden` / `break-words`
- Arbitrary font sizes (`text-[0.72rem]`, `text-[0.82rem]`) mixed with scale classes (`text-xs`, `text-sm`)
- Every button and badge is hand-rolled inline — no shared abstraction
- Stage strip on landing can overflow at `< 360px`

---

## Phase 1 — CVA Component Primitives

**Rationale:** `class-variance-authority`, `clsx`, and `tailwind-merge` are already installed.
Build three primitives once; use everywhere. No Radix UI needed.

**New files:**

- `web/src/components/ui/button.tsx`
- `web/src/components/ui/badge.tsx`
- `web/src/components/ui/card.tsx`

**Button variants (CVA):**

```ts
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:   "bg-[--sf-teal] text-[--sf-surface-warm] hover:bg-[--sf-teal-hover]",
        outline:   "border border-[--sf-border] bg-transparent hover:bg-[--sf-surface-card]",
        ghost:     "hover:bg-[--sf-surface-card] text-[--sf-ink-muted]",
      },
      size: {
        sm:  "h-8 px-3 text-sm",
        md:  "h-10 px-4 text-sm",
        lg:  "h-11 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);
```

**Badge variants (CVA):**

```ts
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default:  "bg-[--sf-teal-subtle] border-[--sf-teal-border] text-[--sf-teal]",
        muted:    "bg-[--sf-surface-card] border-[--sf-border] text-[--sf-ink-muted]",
        info:     "bg-[--sf-blue-subtle] border-[--sf-blue-border] text-[--sf-blue]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);
```

**Card:** thin wrapper — `rounded-xl border border-[--sf-border] bg-[--sf-surface-card] p-6`.

Export all three from `web/src/components/ui/index.ts`. No hardcoded hex — all `--sf-*` tokens. Use `cn()` from `web/src/lib/utils.ts`.

---

## Phase 2 — Shared SiteNav

**Rationale:** Three near-identical Nav functions drift silently. One source of truth.

**New file:** `web/src/components/SiteNav.tsx`

**Props:**

```ts
interface SiteNavProps {
  /** Transparent on dark hero; opaque on light pages */
  variant?: "dark" | "light";
}
```

**Implementation notes:**
- `variant="dark"` → `text-[--sf-surface-warm]`, logo uses light wordmark
- `variant="light"` → `text-[--sf-ink]`, logo uses dark wordmark
- Sticky: `sticky top-0 z-50 backdrop-blur-sm bg-background/90`
- CTA uses `<Button size="sm">` from Phase 1
- Links use `<a>` (no client router needed for marketing shell)

**Files to delete nav functions from:**

| File | Action |
|------|--------|
| `web/src/app/page.tsx` | Remove inline `Nav` function; import `<SiteNav variant="dark" />` |
| `web/src/app/pricing/page.tsx` | Remove inline `Nav` function; import `<SiteNav variant="light" />` |
| `web/src/app/pilot-access/page.tsx` | Remove inline `Nav` function; import `<SiteNav variant="light" />` |

---

## Phase 3 — Landing Page Refactor

**Files:** `web/src/app/page.tsx`, `web/src/app/page.module.css`

**Typography — replace arbitrary sizes:**

| Remove | Replace with |
|--------|-------------|
| `text-[0.72rem]` | `text-xs` (0.75rem) |
| `text-[0.82rem]` | `text-sm` (0.875rem) |
| `text-[0.68rem]` | `text-xs` |

- Hero headline: `text-4xl sm:text-5xl lg:text-6xl font-bold`
- Section headers: `text-2xl sm:text-3xl font-semibold`
- Body copy: `text-base` or `text-sm text-[--sf-ink-muted]`

**Stage strip overflow fix:**

```tsx
// Before
<span className="text-[0.72rem] font-semibold">{stage.label}</span>

// After
<span className="text-xs font-semibold truncate max-w-[8rem] sm:max-w-none">
  {stage.label}
</span>
```

**Component migration:**
- All CTA buttons → `<Button variant="primary" size="lg">`
- Status/label badges → `<Badge variant="default">` or `<Badge variant="muted">`
- Feature cards → `<Card>` wrapper

---

## Phase 4 — Pricing Page Fixes

**File:** `web/src/app/pricing/page.tsx`

**Remove decorative blobs:**

```tsx
// Delete every element matching this pattern:
<div className="... bg-teal-subtle blur-3xl ..." />
// Also remove: rounded-full, absolute-positioned blur divs used as decoration
```

**Table overflow fix:**

```tsx
// Wrap table
<div className="overflow-x-auto w-full">
  <table className="w-full min-w-[36rem] ...">
    <td className="... break-words max-w-[12rem]">
```

**Component migration:**
- Plan CTA buttons → `<Button>`
- Plan name labels → `<Badge>`
- Plan cards → `<Card>` (featured plan gets `border-[--sf-teal-border]`)

**Typography cleanup:** same substitution table as Phase 3.

---

## Phase 5 — Build Verification

Run from repo root:

```bash
bun run contracts:validate && bun run lint && bun run build:web
```

**Acceptance criteria:**
- [ ] `bun run build:web` exits 0
- [ ] `bun run lint` exits 0
- [ ] No `text-[0.` arbitrary sizes remain in `web/src/app/`
- [ ] No `blur-3xl` decorative blobs in `web/src/app/pricing/`
- [ ] Single `SiteNav` import in all three marketing pages
- [ ] No inline Nav function definitions in marketing pages

---

## File Change Summary

| Phase | New Files | Modified Files |
|-------|-----------|---------------|
| 1 | `components/ui/button.tsx`, `badge.tsx`, `card.tsx`, `index.ts` | — |
| 2 | `components/SiteNav.tsx` | `app/page.tsx`, `pricing/page.tsx`, `pilot-access/page.tsx` |
| 3 | — | `app/page.tsx`, `app/page.module.css` |
| 4 | — | `app/pricing/page.tsx` |
