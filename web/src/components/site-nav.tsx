import Link from "next/link";
import { Button } from "@/components/ui/button";

const GITHUB_URL = "https://github.com/chimera-defi/specforge";

type SiteNavVariant = "dark" | "light";

interface NavLink {
  href: string;
  label: string;
  external?: boolean;
  hideBelow?: "sm" | "md" | "lg";
}

const NAV_LINKS: NavLink[] = [
  { href: "/pricing", label: "Pricing", hideBelow: "sm" },
  { href: "/download", label: "Download", hideBelow: "md" },
  { href: GITHUB_URL, label: "GitHub", external: true, hideBelow: "lg" },
];

interface SiteNavProps {
  variant?: SiteNavVariant;
  ctaHref?: string;
  ctaLabel?: string;
  ctaVariant?: "default" | "secondary";
}

const hideClass: Record<NonNullable<NavLink["hideBelow"]>, string> = {
  sm: "hidden sm:inline-flex",
  md: "hidden md:inline-flex",
  lg: "hidden lg:inline-flex",
};

export function SiteNav({
  variant = "light",
  ctaHref = "/pilot-access?source=nav",
  ctaLabel = "Request access",
  ctaVariant = "default",
}: SiteNavProps) {
  const isDark = variant === "dark";

  return (
    <header
      className={
        isDark
          ? "sticky top-0 z-50 w-full border-b border-white/10 bg-primary/95 backdrop-blur-xl"
          : "sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-xl"
      }
    >
      <div style={{ maxWidth: "1100px", marginLeft: "auto", marginRight: "auto", paddingLeft: "clamp(1.5rem, 4vw, 4rem)", paddingRight: "clamp(1.5rem, 4vw, 4rem)" }} className="flex min-h-[3.75rem] w-full items-center justify-between">
        <Link
          href="/"
          className={
            isDark
              ? "text-xs font-black uppercase tracking-wide sm:tracking-widest text-primary-foreground/90 transition-opacity hover:opacity-60"
              : "text-xs font-black uppercase tracking-wide sm:tracking-widest text-foreground transition-opacity hover:opacity-60"
          }
        >
          SpecForge
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const cls = [
              hideClass[link.hideBelow ?? "sm"],
              "min-h-[2.75rem] items-center text-sm transition-colors",
              isDark
                ? "text-primary-foreground/55 hover:text-primary-foreground/90"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ");

            const linkPad = { paddingLeft: "0.75rem", paddingRight: "0.75rem" };
            return link.external ? (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className={cls} style={linkPad}>
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className={cls} style={linkPad}>
                {link.label}
              </Link>
            );
          })}

          <Button asChild variant={ctaVariant} size="sm" style={{ marginLeft: "0.75rem" }} className="whitespace-nowrap">
            <Link href={ctaHref}>
              <span className="sm:hidden">Access</span>
              <span className="hidden sm:inline">{ctaLabel}</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
