import Link from "next/link"

import { ContentPageLayout } from "../../components/site/ContentPageLayout"
import { getSupportPage } from "../../lib/site-content"

const repositoryUrl = "https://github.com/DVB-ESILV/Pyramid"

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
        <h2 className="font-display text-3xl md:text-5xl">Direct repository contact</h2>
        <div className="museum-copy mt-4 space-y-4 text-lg leading-8">
          <p>
            The canonical project repository is{" "}
            <Link
              href={repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="border-b border-current pb-1"
            >
              github.com/DVB-ESILV/Pyramid
            </Link>
            .
          </p>
        </div>
      </section>
    </ContentPageLayout>
  )
}
