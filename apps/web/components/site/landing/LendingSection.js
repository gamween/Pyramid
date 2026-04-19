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
    <section className="border-t museum-rule pb-12 pt-16 md:pb-16 lg:min-h-[82svh] lg:pt-20">
      <div className="max-w-4xl">
        <p className="font-ui text-[11px] uppercase tracking-[0.24em]">{section.eyebrow}</p>
        <h2 className="font-display mt-4 text-4xl leading-[0.95] md:text-6xl">{section.title}</h2>
        <div className="museum-copy mt-6 space-y-4 text-lg leading-8">
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="mt-10 space-y-8 border-t border-black/15 pt-6">
        {pillars.map((pillar, index) => (
          <div
            key={pillar.label}
            className="flex max-w-3xl gap-4"
          >
            <p className="font-ui text-[10px] uppercase tracking-[0.18em]">{String(index + 1).padStart(2, "0")}</p>
            <div>
              <h3 className="font-display text-3xl leading-none">{pillar.label}</h3>
              <p className="museum-copy mt-3 text-sm leading-6">{pillar.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
