import Link from "next/link"
import { Mail, MapPin } from "lucide-react"

import {
  footerContact,
  footerCopyright,
  footerLegalLinks,
  footerOverview,
  footerQuickLinks,
} from "../../lib/site-content"

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t museum-rule">
      <div className="grid gap-12 px-4 py-14 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.72fr)_minmax(0,0.93fr)] md:gap-12 md:px-8 md:py-16 lg:px-10 lg:py-20 xl:px-12 xl:gap-16">
        <div className="space-y-5">
          <p className="font-ui text-[11px] uppercase tracking-[0.24em]">Pyramid</p>
          <p className="museum-copy max-w-[30rem] text-[1.03rem] leading-8 md:text-[1.16rem] md:leading-9">
            {footerOverview}
          </p>
        </div>

        <div className="md:pt-1">
          <h2 className="font-display text-[2.15rem] leading-none md:text-[2.45rem]">
            Quick links
          </h2>
          <nav className="mt-7 flex flex-col items-start gap-3">
            {footerQuickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-[1.02rem] leading-7 text-[color:var(--museum-muted)] transition-colors hover:text-[color:var(--museum-ink)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="md:pt-1">
          <h2 className="font-display text-[2.15rem] leading-none md:text-[2.45rem]">Contact</h2>
          <div className="mt-7 space-y-5">
            <a
              href={`mailto:${footerContact.email}`}
              className="museum-copy flex items-start gap-3 text-[0.98rem] leading-7 transition-colors hover:text-[color:var(--museum-ink)]"
            >
              <Mail aria-hidden className="mt-1 size-4 shrink-0" strokeWidth={1.75} />
              <span className="max-w-[21rem] break-all">{footerContact.email}</span>
            </a>

            <div className="museum-copy flex items-start gap-3 text-[0.98rem] leading-7">
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

      <div className="flex flex-col gap-5 border-t museum-rule px-4 py-6 md:flex-row md:items-center md:justify-between md:px-8 lg:px-10 xl:px-12">
        <p className="museum-copy text-sm leading-6">{footerCopyright}</p>

        <nav className="flex flex-wrap gap-x-7 gap-y-3">
          {footerLegalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm leading-6 text-[color:var(--museum-muted)] transition-colors hover:text-[color:var(--museum-ink)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
