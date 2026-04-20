import Link from "next/link"
import { Mail, MapPin } from "lucide-react"

import {
  footerContact,
  footerCopyright,
  footerOverview,
  footerQuickLinks,
  footerUtilityLinks,
} from "../../lib/site-content"

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t museum-rule">
      <div className="grid gap-12 px-4 py-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.95fr)] md:gap-10 md:px-8 lg:px-10 xl:px-12">
        <div className="space-y-6">
          <p className="font-ui text-[11px] uppercase tracking-[0.24em]">Pyramid</p>
          <p className="museum-copy max-w-xl text-lg leading-8 md:text-[1.4rem] md:leading-9">
            {footerOverview}
          </p>
        </div>

        <div>
          <h2 className="font-display text-3xl md:text-4xl">Quick links</h2>
          <nav className="mt-6 flex flex-col items-start gap-4">
            {footerQuickLinks.map((link) => (
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

        <div>
          <h2 className="font-display text-3xl md:text-4xl">Contact</h2>
          <div className="mt-6 space-y-5">
            <a
              href={`mailto:${footerContact.email}`}
              className="museum-copy flex items-start gap-3 text-base leading-7 transition-opacity hover:opacity-70"
            >
              <Mail aria-hidden className="mt-1 size-4 shrink-0" strokeWidth={1.75} />
              <span className="break-all">{footerContact.email}</span>
            </a>

            <div className="museum-copy flex items-start gap-3 text-base leading-7">
              <MapPin aria-hidden className="mt-1 size-4 shrink-0" strokeWidth={1.75} />
              <div>
                {footerContact.addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 border-t museum-rule px-4 py-6 md:flex-row md:items-end md:justify-between md:px-8 lg:px-10 xl:px-12">
        <p className="museum-copy text-sm leading-6">{footerCopyright}</p>

        <nav className="flex flex-wrap gap-x-6 gap-y-3">
          {footerUtilityLinks.map((link) => (
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
