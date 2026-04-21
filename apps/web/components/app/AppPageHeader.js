export function AppPageHeader({ eyebrow, title, description, meta = [] }) {
  return (
    <section className="mb-8 border-b museum-rule pb-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="font-ui text-[11px] uppercase tracking-[0.22em]">{eyebrow}</p>
          <h1 className="font-display max-w-[12ch] text-5xl leading-[0.92] md:text-7xl">{title}</h1>
          <p className="museum-copy max-w-3xl text-lg leading-8">{description}</p>
        </div>

        {meta.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {meta.map((item) => (
              <div
                key={item}
                className="exchange-chip px-3 py-2 font-ui text-[11px] uppercase tracking-[0.14em]"
              >
                {item}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
