import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { LEGAL, formatLegalDate } from "@/lib/legal";

export interface LegalSection {
  id: string;
  title: string;
}

/**
 * Layout for the long-form policy pages: back link, title, effective date, a
 * table of contents built from `sections`, and the shared footer. Section ids
 * must match the `id` on each <h2> in the page body.
 */
export default function LegalPage({
  title,
  intro,
  sections,
  children,
}: {
  title: string;
  intro?: React.ReactNode;
  sections: LegalSection[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh app-shell mx-auto w-full max-w-3xl flex flex-col">
      <header className="mb-8 border-b border-black/10 pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 min-h-[44px] text-xs uppercase tracking-widest text-muted hover:text-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
          {LEGAL.siteName}
        </Link>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-secondary">{title}</h1>
        <p className="mt-2 text-sm text-muted">
          Effective {formatLegalDate(LEGAL.effectiveDate)}
        </p>
        {intro && <div className="mt-4 text-[0.9375rem] leading-relaxed text-secondary">{intro}</div>}
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <nav aria-label="On this page" className="mb-8 rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">On this page</h2>
          <ol className="grid gap-1.5 sm:grid-cols-2 text-sm list-decimal list-inside marker:text-muted">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-secondary hover:text-primary hover:underline underline-offset-4">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="legal-prose">{children}</article>
      </main>

      <SiteFooter />
    </div>
  );
}
