import Link from "next/link"

export function ClosingSection({ section }) {
  return (
    <section className="grid gap-8 pt-2 md:grid-cols-[1fr_auto] md:items-end">
      <div className="max-w-4xl">
        <p className="font-ui text-[11px] uppercase tracking-[0.24em]">{section.eyebrow}</p>
        <h2 className="font-display mt-4 text-4xl leading-[0.95] md:text-6xl">{section.title}</h2>
        <div className="museum-copy mt-6 space-y-4 text-lg leading-8">
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="flex md:justify-end">
        <Link
          href="/app"
          className="inline-flex items-center border-b border-current pb-1 font-ui text-[11px] uppercase tracking-[0.22em] transition-opacity hover:opacity-70"
        >
          Launch App
        </Link>
      </div>
    </section>
  )
}
