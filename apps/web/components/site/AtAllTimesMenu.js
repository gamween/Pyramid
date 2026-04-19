"use client"

import Link from "next/link"
import { useState } from "react"

import { getAtAllTimesLinks } from "../../lib/site-content"

export function AtAllTimesMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const links = getAtAllTimesLinks()

  return (
    <div className="fixed left-4 top-4 z-50 md:left-6 md:top-6">
      <button
        type="button"
        aria-controls="at-all-times-panel"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="museum-shell border museum-rule px-4 py-3 font-ui text-[11px] uppercase tracking-[0.18em] shadow-[0_10px_30px_rgba(1,0,1,0.08)] transition-transform hover:-translate-y-px"
      >
        At All Times
      </button>

      {isOpen ? (
        <div
          id="at-all-times-panel"
          className="museum-shell mt-2 min-w-[200px] border museum-rule p-3 shadow-[0_18px_40px_rgba(1,0,1,0.12)]"
        >
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="border-b border-current pb-2 font-ui text-[11px] uppercase tracking-[0.12em] transition-opacity hover:opacity-70"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
