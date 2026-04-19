import Image from "next/image"

export function StorySection({ section, visualPlacement = "left", highlights = [] }) {
  const visualFirst = visualPlacement === "left"
  const figureOrderClass = visualFirst ? "lg:sticky lg:top-24" : "lg:order-2 lg:sticky lg:top-24"

  return (
    <section className="flex flex-col gap-8 pb-12 md:gap-10 md:pb-16 lg:flex-row lg:items-start lg:gap-16">
      <figure className={`relative self-start lg:flex-[1.08] ${figureOrderClass}`}>
        <div className="pointer-events-none absolute left-1/2 top-0 hidden h-[72%] w-px -translate-x-1/2 bg-black/12 lg:block" />
        <div className="relative mx-auto w-full pt-5 text-center">
          <div className="pointer-events-none absolute left-1/2 top-14 h-px w-20 -translate-x-1/2 bg-black/12 md:w-28" />
          <Image
            src={section.artwork.src}
            alt={section.artwork.alt}
            width={1400}
            height={1680}
            className="mx-auto h-auto w-full object-contain mix-blend-multiply opacity-95"
          />
        </div>
        <figcaption className="mt-4 text-center font-ui text-[10px] uppercase tracking-[0.18em] museum-copy">
          {section.artwork.caption}
        </figcaption>
      </figure>

      <div className={`${visualFirst ? "" : "lg:order-1"} max-w-3xl flex-1 lg:max-w-none`}>
        <p className="font-ui text-[11px] uppercase tracking-[0.24em]">{section.eyebrow}</p>
        <h2 className="font-display mt-4 text-4xl leading-[0.95] md:text-6xl">{section.title}</h2>

        <div className="museum-copy mt-6 space-y-4 text-lg leading-8">
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
