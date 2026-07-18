"use client";

import { cn } from "@/lib/utils";

export const adminSelectClass = "min-h-11 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-sm text-[#101828] outline-none transition focus:border-[#155eef] focus:ring-4 focus:ring-[#155eef]/10";

export function AdminActionBar({
  title,
  description,
  actions,
  children,
  className
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-md border border-[#e4e7ec] bg-white p-4 shadow-sm sm:p-5", className)}>
      {(title || description || actions) ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-bold text-[#101828] sm:text-lg">{title}</h2> : null}
            {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-[#667085]">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children ? <div className={title || description || actions ? "mt-4" : ""}>{children}</div> : null}
    </section>
  );
}

export function AdminPanel({
  title,
  description,
  icon,
  actions,
  children,
  className
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-md border border-[#e4e7ec] bg-white shadow-sm", className)}>
      {(title || description || actions) ? (
        <div className="flex flex-col gap-3 border-b border-[#eaecf0] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div className="flex min-w-0 gap-3">
            {icon ? <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md bg-[#eef4ff] text-[#155eef]">{icon}</span> : null}
            <div className="min-w-0">
              {title ? <h2 className="font-bold text-[#101828]">{title}</h2> : null}
              {description ? <p className="mt-1 text-sm leading-5 text-[#667085]">{description}</p> : null}
            </div>
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function AdminMetricCard({
  label,
  value,
  detail,
  active = false,
  onClick
}: {
  label: string;
  value: React.ReactNode;
  detail?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="block text-2xl font-bold">{value}</span>
      <span className={cn("mt-1 block text-xs font-bold uppercase", active ? "text-white/70" : "text-[#667085]")}>{label}</span>
      {detail ? <span className={cn("mt-1 block text-xs", active ? "text-white/60" : "text-[#98a2b3]")}>{detail}</span> : null}
    </>
  );
  const className = cn(
    "min-h-[92px] rounded-md border p-4 text-left shadow-sm transition",
    active ? "border-[#155eef] bg-[#155eef] text-white" : "border-[#e4e7ec] bg-white text-[#101828]",
    onClick ? "hover:border-[#84adff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#155eef]/15" : ""
  );
  return onClick ? <button type="button" onClick={onClick} className={className}>{content}</button> : <div className={className}>{content}</div>;
}

export function AdminEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-md border border-dashed border-[#d0d5dd] bg-[#f9fafb] p-8 text-center">
      <div className="max-w-md">
        <p className="font-bold text-[#101828]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#667085]">{description}</p>
      </div>
    </div>
  );
}
