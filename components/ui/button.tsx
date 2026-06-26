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
      "bg-[#101216] text-white hover:bg-[#252a31] border border-[#101216]",
    secondary:
      "bg-[#0f766e] text-white hover:bg-[#115e59] border border-[#0f766e]",
    ghost: "bg-transparent text-[#101216] hover:bg-[#f5f6f8] border border-transparent",
    outline:
      "bg-white text-[#101216] hover:bg-[#f5f6f8] border border-[#e1e5ea]"
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
