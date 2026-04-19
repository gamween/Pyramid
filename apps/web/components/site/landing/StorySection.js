const sectionNotes = {
  "how-it-works": [
    {
      label: "DEX",
      text: "Order-book exchange forms the first chapter of the story.",
    },
    {
      label: "AMM",
      text: "The liquidity layer sits behind the narrative without becoming UI clutter.",
    },
    {
      label: "Vaults",
      text: "Supply and custody are introduced as architectural objects, not product chrome.",
    },
    {
      label: "Loans",
      text: "Borrowing appears as the final movement of the sequence.",
    },
  ],
  "trading-tools": [
    {
      label: "Stop-loss",
      text: "Protect the position when the market turns.",
    },
    {
      label: "Take-profit",
      text: "Let the exit arrive at a planned threshold.",
    },
    {
      label: "Trailing",
      text: "Track price action without micromanaging every move.",
    },
    {
      label: "OCO",
      text: "Keep the paired order logic visible and restrained.",
    },
  ],
}

export function StorySection({ section, visualPlacement = "left", highlights = [] }) {
  const visualFirst = visualPlacement === "left"
  const notes = sectionNotes[section.id] ?? highlights

  return (
    <section className="grid gap-10 border-b museum-rule pb-12 md:grid-cols-[0.94fr_1.06fr] md:gap-14 md:pb-16">
      <figure
        className={`self-start ${visualFirst ? "md:sticky md:top-24" : "md:order-2 md:sticky md:top-24"}`}
      >
        <div className="overflow-hidden border museum-rule bg-[rgba(255,255,255,0.18)] p-5">
          <img
            src={section.artwork.src}
            alt={section.artwork.alt}
            className="h-auto w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        <figcaption className="mt-3 font-ui text-[10px] uppercase tracking-[0.18em] museum-copy">
          {section.eyebrow}
        </figcaption>
      </figure>

      <div className={`${visualFirst ? "" : "md:order-1"} max-w-3xl`}>
        <p className="font-ui text-[11px] uppercase tracking-[0.24em]">{section.eyebrow}</p>
        <h2 className="font-display mt-4 text-4xl leading-[0.95] md:text-6xl">{section.title}</h2>

        <div className="museum-copy mt-6 space-y-4 text-lg leading-8">
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-10 grid gap-5 border-t museum-rule pt-6 sm:grid-cols-2">
          {notes.map((note, index) => (
            <div key={note.label} className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-display text-3xl leading-none">{String(index + 1).padStart(2, "0")}</span>
                <span className="font-ui text-[10px] uppercase tracking-[0.18em]">{note.label}</span>
              </div>
              <p className="museum-copy text-sm leading-6">{note.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
