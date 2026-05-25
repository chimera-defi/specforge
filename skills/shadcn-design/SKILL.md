---
name: shadcn-design
description: Use when reviewing or building UI components in SpecForge. Applies shadcn/ui design system principles — semantic token system, component composition patterns, Tailwind v4 CSS-first theming, and copy-paste architecture. Use when adding new components, auditing existing ones for token compliance, or setting up theming for a new surface.
---

# shadcn Design System Skill

Based on shadcn/ui 2026 principles: [ui.shadcn.com](https://ui.shadcn.com) + Tailwind CSS v4 integration.

Use this skill when the user wants to:
- add a new component to SpecForge following shadcn conventions
- audit existing components for token compliance
- review theming setup (CSS variables, `@theme` block, OKLCH)
- ensure component API stays small and focused
- compose higher-level blocks from primitives

---

## Core Architecture (Open Code Model)

shadcn/ui operates on "open code" — the component source lives in YOUR repo, not in a package. This means:
- You own the implementation and can modify it freely
- Updates are opt-in via copy-paste, not breaking npm updates
- AI agents (Claude, Codex) can read and improve the components directly

Three-layer file structure:
```
web/src/
├── components/ui/           # Raw shadcn primitives (minimal modification)
├── components/primitives/   # Lightly adapted components (auth-aware, branded)
└── components/blocks/       # Product-level compositions (forms, panels, cards)
```

Do not mix layers. A block can import a primitive; a primitive does not import a block.

---

## Token System (Semantic Variables)

### Layer 1: Primitive variables (raw values)

Defined in `web/src/app/globals.css` inside `@theme {}`:
```css
@theme {
  --color-background: #f1e8db;
  --color-foreground: #1c1a17;
  --color-accent: #0f766e;
  /* ... */
}
```

These generate Tailwind utilities automatically (`bg-background`, `text-foreground`, `text-accent`).

### Layer 2: Semantic aliases (role-based names)

Defined in `:root {}`:
```css
:root {
  --sf-ink: #1c1a17;       /* primary text */
  --sf-surface: #f1e8db;   /* page background */
  --sf-teal: #0f766e;      /* brand accent / CTA */
  /* ... */
}
```

**Hard rule:** Never hardcode hex values in component code. Always use a token.

### Tailwind v4 CSS-first theming

In Tailwind v4, the `@theme {}` block IS the config — no `tailwind.config.js` needed. Colors, fonts, and radii defined there become utilities automatically:

```css
@theme {
  --font-sans: var(--font-geist-sans), sans-serif;
  --color-background: #f1e8db;
  --radius-md: 1rem;
}
```

Generates: `font-sans`, `bg-background`, `rounded-md`.

OKLCH trend (2026): shadcn is migrating to OKLCH color space for better perceptual uniformity. When adding new colors, prefer:
```css
--color-accent: oklch(0.45 0.12 175);
```

---

## Component Patterns

### Small, focused APIs

Keep component props to what's actually needed. Three similar lines is better than a premature abstraction.

```tsx
// Good: focused
<Button variant="primary" size="md">Request access</Button>

// Bad: over-generalized
<Button styles={{...}} overrides={{...}} renderLeft={...} renderRight={...}>...</Button>
```

When a component serves multiple different intents, split it — don't add variants indefinitely.

### Composition over configuration

```tsx
// Good: compose from primitives
<Card>
  <CardHeader>
    <Badge variant="success">Live</Badge>
    <h3>Workspace</h3>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// Bad: one mega component with 15 props
<WorkspaceCard status="live" showBadge title="Workspace" ... />
```

### The `cn()` pattern

Always use `cn()` from `web/src/lib/utils.ts` for conditional classes:
```tsx
import { cn } from "@/lib/utils";

className={cn(
  "base-classes here",
  isActive && "text-accent",
  isDisabled && "opacity-50 pointer-events-none",
  className  // always accept and spread external className
)}
```

### Radix UI primitives for accessibility

Prefer Radix UI primitives for: Dialog, Popover, Dropdown, Tooltip, Select, Checkbox, Radio. These handle:
- Keyboard navigation
- ARIA roles and attributes
- Focus trapping
- Screen reader announcements

Do not reimplement these from scratch. shadcn wraps Radix; use the shadcn wrapper.

---

## Dark/Light Mode

SpecForge uses a single warm-light theme (no dark mode currently). CSS variables in `:root` handle theming. If adding dark mode:

```css
:root {
  --color-background: #f1e8db;
  --color-foreground: #1c1a17;
}

.dark {
  --color-background: #18212b;
  --color-foreground: #f7f3ea;
}
```

Toggle via `class="dark"` on `<html>`. Do NOT use `prefers-color-scheme` media query — user-controlled toggle is preferred.

---

## Component Audit Checklist

When reviewing an existing component:

- [ ] No hardcoded hex values — all colors use tokens
- [ ] `cn()` used for conditional classes
- [ ] External `className` prop accepted and spread
- [ ] Minimum touch target 44×44px on all interactive elements
- [ ] Keyboard accessible (focusable, Enter/Space activates)
- [ ] ARIA label or `aria-labelledby` on icon-only buttons
- [ ] Loading, empty, and error states handled
- [ ] Responsive (not just "stacked on mobile")
- [ ] Reduced-motion respected for animations
- [ ] `text-wrap: balance` on headings
- [ ] Body text ≥16px (1rem)
- [ ] Line length ≤68ch for body paragraphs

---

## Block Composition (2026 Pattern)

In 2026, the focus has shifted from individual components to "blocks" — higher-level compositions that can be generated by AI from a single prompt:

```tsx
// A block: complete form wizard (form + validation + submit + success state)
<PilotAccessBlock
  onSuccess={handleSuccess}
  source="landing_hero"
/>
```

Blocks live in `components/blocks/` and compose primitives + ui components. They own their own state.

---

## When to use v0.dev

Vercel's v0.dev generates shadcn components from natural language. Use it for:
- Rapid initial scaffolding of new blocks
- Generating multiple layout variants to compare
- Complex data tables or form wizards

Always review the output for: token compliance, prop API size, accessibility, AI slop patterns.

---

## SpecForge-specific notes

- **Fonts:** Geist Sans + Geist Mono — loaded via `next/font/google` in `layout.tsx`. Never fall back to system-ui.
- **Icons:** `lucide-react` only — tree-shakeable, consistent 1.5px stroke weight
- **Border radius:** Use `--radius-sm/md/lg/xl/full` tokens. Inner elements always use smaller radius than container.
- **Animation:** Only animate `transform` and `opacity`. Never `width`, `height`, `top`, `left`.
- **Shadows:** Use `--shadow-card`, `--shadow-accent`, `--shadow-ink`. Never invent new shadows.

## Verification

```bash
# Check for hardcoded hex values in components
rg '#[0-9a-fA-F]{3,6}' web/src/components/ --type tsx

# Check touch targets (audit manually or with Playwright)
bun run test:e2e -- --grep "touch targets"

# Build to confirm no type errors
bun run build:web
```
