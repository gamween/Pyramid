import Image from "next/image"

export function LendingSection({ section }) {
  const pillars = [
    {
      label: "Vaults",
      text: "XLS-65 gives the page its supply-side grammar, rendered as the first protocol pillar.",
    },
    {
      label: "Loans",
      text: "XLS-66 closes the borrow flow with explicit terms and no panel-heavy framing.",
    },
    {
      label: "Collateral",
      text: "Each position reads as a ledger relationship, not as a dashboard widget.",
    },
    {
      label: "Yield",
      text: "Return is described as a loop through the protocol, not as a separate product surface.",
    },
  ]

  return (
    <section className="border-t museum-rule pb-16 pt-16 lg:min-h-[82svh] lg:grid lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-start lg:gap-16 lg:pt-20">
      <div className="max-w-3xl lg:order-2">
        <p className="font-ui text-[11px] uppercase tracking-[0.24em]">{section.eyebrow}</p>
        <h2 className="font-display mt-4 text-[2.5rem] leading-[0.98] md:text-5xl">{section.title}</h2>
        <div className="museum-copy mt-6 space-y-4 text-base leading-7 md:text-lg">
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-10 space-y-5 border-t border-black/15 pt-6">
          {pillars.map((pillar, index) => (
            <div key={pillar.label} className="flex max-w-2xl gap-4">
              <span className="font-display text-3xl leading-none">{String(index + 1).padStart(2, "0")}</span>
              <div className="pt-1">
                <p className="font-ui text-[10px] uppercase tracking-[0.18em]">{pillar.label}</p>
                <p className="museum-copy mt-2 text-sm leading-6">{pillar.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <figure className="relative mt-12 text-center lg:order-1 lg:mt-0 lg:self-start">
        <div className="pointer-events-none absolute left-1/2 top-0 hidden h-[72%] w-px -translate-x-1/2 bg-black/12 lg:block" />
        <div className="relative mx-auto w-full pt-5 text-center">
          <div className="pointer-events-none absolute left-1/2 top-14 h-px w-20 -translate-x-1/2 bg-black/12 md:w-28" />
          <Image
            src={section.artwork.src}
            alt={section.artwork.alt}
            width={1200}
            height={1600}
            className="mx-auto h-auto max-h-[66vh] w-full object-contain mix-blend-multiply opacity-95"
          />
        </div>
      </figure>
    </section>
  )
}
