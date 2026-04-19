import Link from "next/link"

import { footerLinks } from "../../lib/site-content"

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t museum-rule">
      <div className="flex w-full flex-col gap-8 px-4 py-8 md:flex-row md:items-end md:justify-between md:px-8 lg:px-10">
        <p className="museum-copy max-w-2xl text-sm leading-6">
          Pyramid presents XRPL-native lending, trading, and privacy systems as a readable site
          first, with the live product experience continuing in the app route.
        </p>
        <nav className="flex flex-wrap gap-x-6 gap-y-3">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border-b border-current pb-1 font-ui text-[11px] uppercase tracking-[0.12em] transition-opacity hover:opacity-70"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
