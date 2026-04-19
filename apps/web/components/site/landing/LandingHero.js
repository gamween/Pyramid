import Link from "next/link"

import { TermLinksRow } from "../TermLinksRow"

export function LandingHero({ section }) {
  return (
    <section className="grid items-end gap-10 border-b museum-rule pb-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14 lg:pb-16">
      <div className="max-w-3xl">
        <p className="font-ui text-[11px] uppercase tracking-[0.24em]">{section.eyebrow}</p>
        <h1 className="font-display mt-5 max-w-[8ch] text-6xl leading-[0.86] md:text-8xl">
          {section.title}
        </h1>
        <p className="museum-copy mt-6 max-w-2xl text-lg leading-8 md:text-xl">
          {section.lead}
        </p>
        <p className="museum-copy mt-4 max-w-2xl text-base leading-7">{section.supporting}</p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/app"
            className="inline-flex items-center border-b border-current pb-1 font-ui text-[11px] uppercase tracking-[0.22em] transition-opacity hover:opacity-70"
          >
            Launch App
          </Link>
          <span className="font-ui text-[10px] uppercase tracking-[0.22em] museum-copy">
            Explore the ledger notes
          </span>
        </div>

        <div className="mt-8 border-t museum-rule pt-6">
          <TermLinksRow />
        </div>
      </div>

      <figure className="justify-self-end">
        <div className="relative overflow-hidden border museum-rule bg-[rgba(255,255,255,0.24)] p-5">
          <img
            src={section.artwork.src}
            alt={section.artwork.alt}
            className="h-auto w-full object-cover"
            loading="eager"
            decoding="async"
          />
        </div>
        <figcaption className="mt-3 font-ui text-[10px] uppercase tracking-[0.18em] museum-copy">
          Victoire de Samothrace
        </figcaption>
      </figure>
    </section>
  )
}
