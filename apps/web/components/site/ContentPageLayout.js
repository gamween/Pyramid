import { AtAllTimesMenu } from "./AtAllTimesMenu"
import { SiteFooter } from "./SiteFooter"

export function ContentPageLayout({
  eyebrow,
  title,
  intro,
  sections,
  officialLinks = [],
  children,
}) {
  return (
    <div className="museum-shell min-h-screen">
      <AtAllTimesMenu />

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-28 md:px-10 md:pt-32">
        <p className="font-ui text-[11px] uppercase tracking-[0.22em]">{eyebrow}</p>
        <h1 className="font-display mt-4 max-w-[11ch] text-5xl leading-[0.92] md:text-7xl">
          {title}
        </h1>
        <p className="museum-copy mt-6 max-w-3xl text-lg leading-8 md:text-xl">{intro}</p>

        <div className="mt-12 space-y-14">
          {sections.map((section) => (
            <section key={section.heading} className="border-t museum-rule pt-8">
              <h2 className="font-display text-3xl md:text-5xl">{section.heading}</h2>
              <div className="museum-copy mt-4 space-y-4 text-lg leading-8">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          {officialLinks.length > 0 ? (
            <div className="flex flex-wrap gap-3 border-t museum-rule pt-8">
              {officialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="border-b border-current pb-2 font-ui text-[11px] uppercase tracking-[0.12em] transition-opacity hover:opacity-70"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}

          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
