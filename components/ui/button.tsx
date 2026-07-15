import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  const styles = {
    primary:
      "border border-[var(--color-primary)] bg-[var(--color-primary)] text-white hover:border-[var(--color-primary-hover)] hover:bg-[var(--color-primary-hover)]",
    secondary:
      "border border-[var(--color-navy)] bg-[var(--color-navy)] text-white hover:border-[#0b2b5d] hover:bg-[#0b2b5d]",
    ghost: "border border-transparent bg-transparent text-[var(--color-text)] hover:bg-[var(--color-page)]",
    outline:
      "border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-page)]"
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:pointer-events-none disabled:opacity-50",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
