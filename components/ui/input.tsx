import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[#98a2b3] focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)]",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-none rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[#98a2b3] focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)]",
        className
      )}
      {...props}
    />
  );
}
