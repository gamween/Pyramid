import { ContentPageLayout } from "../../components/site/ContentPageLayout"
import { getSupportPage, supportContactLinks } from "../../lib/site-content"

export default function ContactPage() {
  const page = getSupportPage("contact")

  return (
    <ContentPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      sections={page.sections}
    >
      <section className="border-t museum-rule pt-8">
        <h2 className="font-display text-3xl md:text-5xl">Direct contact</h2>
        <p className="museum-copy mt-4 max-w-3xl text-lg leading-8">
          These are the direct channels I actually use. Pick the one that fits the context and
          include enough detail for me to answer without guessing.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {supportContactLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              {...(link.href.startsWith("mailto:")
                ? {}
                : { target: "_blank", rel: "noreferrer" })}
              className="border-b border-current pb-2 font-ui text-[11px] uppercase tracking-[0.14em] transition-opacity hover:opacity-70"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </ContentPageLayout>
  )
}
