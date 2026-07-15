import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  const tones = {
    neutral: "bg-[var(--color-page)] text-[var(--color-text-secondary)]",
    primary: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
    success: "bg-[#ecfdf3] text-[#027a48]",
    warning: "bg-[#fffaeb] text-[#b54708]",
    danger: "bg-[#fef3f2] text-[#b42318]"
  };

  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
