import { notFound } from "next/navigation"

import { ContentPageLayout } from "../../../components/site/ContentPageLayout"
import { getLearnPage, learnPages } from "../../../lib/site-content"

export function generateStaticParams() {
  return learnPages.map((page) => ({ slug: page.slug }))
}

export default function LearnPage({ params }) {
  const page = getLearnPage(params.slug)

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
