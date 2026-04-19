"use client"

import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"

import { getAtAllTimesLinks } from "../../lib/site-content"

export function AtAllTimesMenu() {
  const panelId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const firstLinkRef = useRef(null)
  const shouldReturnFocusRef = useRef(false)
  const links = getAtAllTimesLinks()

  useEffect(() => {
    if (!isOpen) {
      if (shouldReturnFocusRef.current) {
        triggerRef.current?.focus()
        shouldReturnFocusRef.current = false
      }
      return undefined
    }

    firstLinkRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key !== "Escape") {
        return
      }

      shouldReturnFocusRef.current = true
      setIsOpen(false)
    }

    function handlePointerDown(event) {
      if (containerRef.current?.contains(event.target)) {
        return
      }

      shouldReturnFocusRef.current = true
      setIsOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="fixed left-4 top-4 z-50 md:left-6 md:top-6">
      <button
        ref={triggerRef}
        type="button"
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((open) => !open)}
        className="museum-shell border museum-rule px-4 py-3 font-ui text-[11px] uppercase tracking-[0.18em] shadow-[0_10px_30px_rgba(1,0,1,0.08)] transition-transform hover:-translate-y-px"
      >
        At All Times
      </button>

      {isOpen ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="At All Times links"
          className="museum-shell mt-2 min-w-[200px] border museum-rule p-3 shadow-[0_18px_40px_rgba(1,0,1,0.12)]"
        >
          <div className="flex flex-col gap-3">
            {links.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                ref={index === 0 ? firstLinkRef : undefined}
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
