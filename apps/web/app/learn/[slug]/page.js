import { notFound } from "next/navigation"

import { ContentPageLayout } from "../../../components/site/ContentPageLayout"
import { learnPages } from "../../../lib/site-content"
import { resolveLearnPageFromParams } from "../../../lib/learn-page"

export function generateStaticParams() {
  return learnPages.map((page) => ({ slug: page.slug }))
}

export default async function LearnPage({ params }) {
  const page = await resolveLearnPageFromParams(params)

  if (!page) {
    notFound()
  }

  return (
    <ContentPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.summary}
      sections={[
        { heading: "What it is", body: [page.summary] },
        { heading: "Why it matters in Pyramid", body: [page.whyItMatters] },
      ]}
      officialLinks={page.officialLinks}
    />
  )
}
