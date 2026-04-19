import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { ContentPageLayout } from "../../components/site/ContentPageLayout"
import { getSupportPage } from "../../lib/site-content"

const licenseText = readFileSync(resolve(process.cwd(), "..", "..", "LICENSE"), "utf8")

export default function LicensePage() {
  const page = getSupportPage("license")

  return (
    <ContentPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      sections={page.sections}
    >
      <section className="border-t museum-rule pt-8">
        <h2 className="font-display text-3xl md:text-5xl">MIT License text</h2>
        <pre className="museum-copy mt-4 overflow-x-auto whitespace-pre-wrap text-sm leading-7">
          {licenseText}
        </pre>
      </section>
    </ContentPageLayout>
  )
}
