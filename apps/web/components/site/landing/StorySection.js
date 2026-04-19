import Image from "next/image"

import LightRays from "../../effects/LightRays"

export function StorySection({ section, visualPlacement = "left", highlights = [] }) {
  const visualFirst = visualPlacement === "left"
  const figureOrderClass = visualFirst ? "" : "lg:order-2"

  return (
    <section className="flex flex-col gap-8 border-t museum-rule pb-12 pt-16 md:gap-10 md:pb-16 lg:min-h-[92svh] lg:flex-row lg:items-start lg:gap-16 lg:pt-20">
      <figure className={`relative self-start lg:flex-[1.08] ${figureOrderClass}`}>
        <div className="pointer-events-none absolute inset-0 z-0 opacity-100">
          <LightRays
            raysOrigin={visualFirst ? "left" : "right"}
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
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 hidden h-[72%] w-px -translate-x-1/2 bg-black/12 lg:block" />
        <div className="relative z-10 mx-auto w-full pt-5 text-center">
          <div className="pointer-events-none absolute left-1/2 top-14 h-px w-20 -translate-x-1/2 bg-black/12 md:w-28" />
          <Image
            src={section.artwork.src}
            alt={section.artwork.alt}
            width={1400}
            height={1680}
            className="mx-auto h-auto max-h-[68vh] w-full object-contain mix-blend-multiply opacity-95"
          />
        </div>
      </figure>

      <div className={`${visualFirst ? "" : "lg:order-1"} max-w-3xl flex-1 lg:max-w-none`}>
        <p className="font-ui text-[11px] uppercase tracking-[0.24em]">{section.eyebrow}</p>
        <h2 className="font-display mt-4 text-[2.5rem] leading-[0.98] md:text-5xl">{section.title}</h2>

        <div className="museum-copy mt-6 space-y-4 text-base leading-7 md:text-lg">
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-10 space-y-5 border-t border-black/15 pt-6">
          {highlights.map((note, index) => (
            <div key={note.label} className="flex max-w-2xl gap-4">
              <span className="font-display text-3xl leading-none">{String(index + 1).padStart(2, "0")}</span>
              <div className="pt-1">
                <p className="font-ui text-[10px] uppercase tracking-[0.18em]">{note.label}</p>
                <p className="museum-copy mt-2 text-sm leading-6">{note.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
