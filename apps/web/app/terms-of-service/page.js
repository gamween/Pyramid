import { ContentPageLayout } from "../../components/site/ContentPageLayout"
import { getSupportPage } from "../../lib/site-content"

export default function TermsOfServicePage() {
  const page = getSupportPage("terms-of-service")

  return (
    <ContentPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      sections={page.sections}
    />
  )
}
