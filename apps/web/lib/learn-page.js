import { getLearnPage } from "./site-content.js"

export async function resolveLearnPageFromParams(params) {
  const resolvedParams = await params

  return getLearnPage(resolvedParams?.slug)
}
