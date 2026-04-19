import Image from "next/image"
import Link from "next/link"

import LightRays from "../../effects/LightRays"
import { TermLinksRow } from "../TermLinksRow"

export function LandingHero({ section }) {
  return (
    <section className="grid items-end gap-12 border-b museum-rule pb-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 lg:pb-16">
      <div className="max-w-4xl">
        <p className="font-ui text-[11px] uppercase tracking-[0.24em]">{section.eyebrow}</p>
        <h1 className="font-display mt-5 max-w-[8ch] text-5xl leading-[0.88] md:text-7xl">
          {section.title}
        </h1>
        <p className="museum-copy mt-6 max-w-2xl text-base leading-7 md:text-lg">
          {section.lead}
        </p>
        <p className="museum-copy mt-4 max-w-2xl text-sm leading-7 md:text-base">{section.supporting}</p>

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
        <div className="pointer-events-none absolute inset-0 z-0 opacity-75 mix-blend-screen">
          <LightRays
            raysOrigin="right"
            raysColor="#fff9c4"
            raysSpeed={0.4}
            lightSpread={0.72}
            rayLength={1.18}
            fadeDistance={1.12}
            saturation={0.38}
            followMouse={false}
            mouseInfluence={0}
            noiseAmount={0.05}
            distortion={0.03}
          />
        </div>
        <div className="pointer-events-none absolute left-0 top-10 z-10 hidden h-[72%] w-px bg-black/12 lg:block" />
        <div className="relative z-10 mx-auto w-full pt-6">
          <div className="pointer-events-none absolute left-1/2 top-16 h-px w-20 -translate-x-1/2 bg-black/12 md:w-28" />
          <Image
            src={section.artwork.src}
            alt={section.artwork.alt}
            width={940}
            height={1120}
            className="mx-auto h-auto max-h-[74vh] w-full object-contain mix-blend-multiply opacity-95"
            priority
          />
        </div>
      </figure>
    </section>
  )
}
