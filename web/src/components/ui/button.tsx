import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-accent-foreground shadow-accent hover:-translate-y-px hover:bg-teal-hover hover:shadow-[var(--shadow-accent-hover)]",
        primary:
          "bg-primary text-primary-foreground hover:bg-ink-dark",
        secondary:
          "border border-border-mid bg-card text-foreground hover:bg-surface-light",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-muted",
        outline:
          "border border-white/25 text-primary-foreground/80 hover:border-white/50 hover:text-primary-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link:
          "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11",
        sm: "h-9 text-xs",
        lg: "h-14 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const buttonPadding: Record<NonNullable<VariantProps<typeof buttonVariants>["size"]>, React.CSSProperties> = {
  default: { paddingLeft: "1.25rem", paddingRight: "1.25rem" },
  sm: { paddingLeft: "1rem", paddingRight: "1rem" },
  lg: { paddingLeft: "2rem", paddingRight: "2rem" },
  icon: {},
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        style={{ ...buttonPadding[size ?? "default"], ...style }}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
