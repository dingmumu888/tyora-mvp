import type { ReactNode } from "react";
import Link from "next/link";
import CommunityUserMenu from "@/components/community-user-menu";

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  children: ReactNode;
};

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/service-scope", label: "Service Scope" }
];

export default function LegalPageShell({
  eyebrow,
  title,
  description,
  updatedAt,
  children
}: LegalPageShellProps) {
  return (
    <main className="min-h-screen bg-[var(--color-page)] pb-28 text-[var(--color-text)] md:pb-12">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-bold text-[var(--color-navy)]">
            TYORA
          </Link>
          <nav aria-label="Legal pages" className="hidden items-center gap-5 text-sm font-semibold text-[var(--color-text-secondary)] sm:flex">
            <Link href="/" className="hover:text-[var(--color-primary)]">Home</Link>
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-[var(--color-primary)]">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:block">
            <CommunityUserMenu loginClassName="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-text)] shadow-[var(--shadow-sm)] transition hover:border-[var(--color-primary)]" />
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <p className="text-sm font-bold uppercase text-[var(--color-primary)]">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-[var(--color-navy)] sm:text-4xl">{title}</h1>
        <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)]">{description}</p>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Last updated: {updatedAt}</p>

        <div className="mt-10 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {children}
        </div>

        <footer className="mt-8 text-sm leading-6 text-[var(--color-text-secondary)]">
          Questions about these terms can be sent to{" "}
          <a className="font-semibold text-[var(--color-primary)]" href="mailto:support@tyora.io">
            support@tyora.io
          </a>.
        </footer>
      </article>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="py-6">
      <h2 className="text-xl font-bold text-[var(--color-navy)]">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--color-text-secondary)]">{children}</div>
    </section>
  );
}
