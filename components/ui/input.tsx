import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-lg border border-[#e1e5ea] bg-white px-3 text-sm outline-none transition placeholder:text-[#8c94a1] focus:border-[#101216] focus:ring-4 focus:ring-[#101216]/5",
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
        "min-h-28 w-full resize-none rounded-lg border border-[#e1e5ea] bg-white px-3 py-3 text-sm outline-none transition placeholder:text-[#8c94a1] focus:border-[#101216] focus:ring-4 focus:ring-[#101216]/5",
        className
      )}
      {...props}
    />
  );
}
