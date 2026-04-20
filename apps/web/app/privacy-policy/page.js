import { ContentPageLayout } from "../../components/site/ContentPageLayout"
import { getSupportPage } from "../../lib/site-content"

export default function PrivacyPolicyPage() {
  const page = getSupportPage("privacy-policy")

  return (
    <ContentPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      sections={page.sections}
    />
  )
}
