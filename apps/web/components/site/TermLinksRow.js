import Link from "next/link"

import { learnPages } from "../../lib/site-content"

export function TermLinksRow() {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      {learnPages.map((page) => (
        <Link
          key={page.slug}
          href={page.href}
          className="border-b border-current pb-1 font-ui text-[11px] uppercase tracking-[0.14em] transition-opacity hover:opacity-70"
        >
          {page.label}
        </Link>
      ))}
    </div>
  )
}
