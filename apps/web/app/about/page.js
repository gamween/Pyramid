import Image from "next/image"

import { ContentPageLayout } from "../../components/site/ContentPageLayout"
import { getSupportPage } from "../../lib/site-content"

export default function AboutPage() {
  const page = getSupportPage("about")

  return (
    <ContentPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      sections={page.sections}
    >
      <section className="border-t museum-rule pt-8">
        <div className="grid gap-8 md:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] md:items-end">
          <div className="space-y-4">
            <p className="font-ui text-[11px] uppercase tracking-[0.22em] text-[color:var(--museum-muted)]">
              Portrait
            </p>
            <h2 className="font-display text-3xl md:text-5xl">Sofiane Zidane Ben Taleb</h2>
            <p className="museum-copy max-w-prose text-lg leading-8">
              The portrait sits here as an editorial plate, giving the page a quieter, more
              archival read alongside the registry copy that follows.
            </p>
          </div>

          <figure className="space-y-3 md:justify-self-end">
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
            <figcaption className="font-ui text-[11px] uppercase tracking-[0.18em] text-[color:var(--museum-muted)]">
              Sofiane Zidane Ben Taleb
            </figcaption>
          </figure>
        </div>
      </section>
    </ContentPageLayout>
  )
}
