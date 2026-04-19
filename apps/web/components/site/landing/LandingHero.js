import Image from "next/image"
import Link from "next/link"

import { TermLinksRow } from "../TermLinksRow"

export function LandingHero({ section }) {
  return (
    <section className="grid items-end gap-12 border-b museum-rule pb-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 lg:pb-16">
      <div className="max-w-4xl">
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

      <figure className="relative w-full justify-self-end text-center">
        <div className="pointer-events-none absolute left-0 top-10 hidden h-[72%] w-px bg-black/12 lg:block" />
        <div className="relative mx-auto w-full pt-6">
          <div className="pointer-events-none absolute left-1/2 top-16 h-px w-20 -translate-x-1/2 bg-black/12 md:w-28" />
          <Image
            src={section.artwork.src}
            alt={section.artwork.alt}
            width={940}
            height={1120}
            className="mx-auto h-auto w-full object-contain mix-blend-multiply opacity-95"
            priority
          />
        </div>
        <figcaption className="mt-4 text-center font-ui text-[10px] uppercase tracking-[0.18em] museum-copy">
          {section.artwork.caption}
        </figcaption>
      </figure>
    </section>
  )
}
