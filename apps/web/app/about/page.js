import Image from "next/image"

import { ContentPageLayout } from "../../components/site/ContentPageLayout"
import { getSupportPage } from "../../lib/site-content"

export default function AboutPage() {
  const page = getSupportPage("about")
  const originNote = page.sections.find((section) => section.heading === "Origin note")
  const sections = page.sections.filter((section) => section.heading !== "Origin note")

  return (
    <ContentPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      sections={sections}
    >
      <section className="border-t museum-rule pt-8">
        <h2 className="font-display text-3xl md:text-5xl">Origin note</h2>
        <div className="museum-copy mt-4 max-w-3xl space-y-4 text-lg leading-8">
          <p>
            This repository descends from{" "}
            <a
              href="https://github.com/DVB-ESILV/Pyramid"
              target="_blank"
              rel="noreferrer"
              className="border-b border-current pb-1 transition-opacity hover:opacity-70"
            >
              https://github.com/DVB-ESILV/Pyramid
            </a>
            , a project built with Florian Gallot and Mehdi Mateo Tazi for Hack the Block 2026.
          </p>
          {originNote?.body[1] ? <p>{originNote.body[1]}</p> : null}
        </div>
      </section>

      <section className="border-t museum-rule pt-8">
        <div className="grid gap-8 md:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] md:items-end">
          <div className="space-y-4">
            <p className="font-ui text-[11px] uppercase tracking-[0.22em] text-[color:var(--museum-muted)]">
              Portrait
            </p>
            <h2 className="font-display text-3xl md:text-5xl">Sofiane Zidane Ben Taleb</h2>
            <p className="museum-copy max-w-prose text-lg leading-8">
              Solo builder of Pyramid, from protocol framing to implementation.
            </p>
          </div>

          <div className="md:justify-self-end">
            <div className="overflow-hidden border border-[color:var(--museum-rule)] bg-[color:var(--museum-paper)] shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <Image
                src="/about/sofiane-zidane-ben-taleb.jpg"
                alt="Sofiane Zidane Ben Taleb portrait"
                width={960}
                height={1200}
                className="h-auto w-full object-cover grayscale-[0.08] contrast-[1.03]"
                priority
              />
            </div>
          </div>
        </div>
      </section>
    </ContentPageLayout>
  )
}
