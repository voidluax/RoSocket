import type { ReactNode } from "react";

export default function SectionShell({
  id,
  index,
  title,
  intro,
  children,
}: {
  id: string;
  index: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="relative scroll-mt-20 border-t border-white/[0.07]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-[220px_1fr] md:gap-14 md:py-24">
        <div className="md:sticky md:top-24 md:self-start">
          <p className="font-mono text-[11px] tracking-[0.3em] text-emerald-400/80">
            {index}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100 md:text-[1.7rem]">
            {title}
          </h2>
          {intro ? (
            <div className="mt-4 text-[13.5px] leading-relaxed text-zinc-400">
              {intro}
            </div>
          ) : null}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
