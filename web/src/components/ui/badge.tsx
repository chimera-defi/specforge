import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-border bg-muted text-muted-warm",
        outline:
          "border-white/10 bg-white/6 text-primary-foreground/55",
        success:
          "border-transparent bg-success-subtle text-success",
        warning:
          "border-transparent bg-warning-subtle text-warning",
        destructive:
          "border-transparent bg-destructive-subtle text-destructive",
        accent:
          "border-transparent bg-accent text-accent-foreground shadow-[var(--shadow-accent)]",
        teal:
          "border-teal-border bg-teal-subtle text-accent",
        amber:
          "border-transparent bg-transparent text-amber",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
