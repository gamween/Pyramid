import Link from "next/link"

export function SiteHeader({ reserveAtAllTimesSpace = false }) {
  return (
    <header className="museum-shell sticky top-0 z-40 border-b museum-rule">
      <div
        className={`flex w-full items-center justify-between py-5 ${
          reserveAtAllTimesSpace
            ? "pr-4 pl-32 md:pr-8 md:pl-40 lg:pr-10 lg:pl-44"
            : "px-4 md:px-8 lg:px-10"
        }`}
      >
        <Link
          href="/"
          className="font-ui text-[11px] uppercase tracking-[0.24em] transition-opacity hover:opacity-70"
        >
          Pyramid
        </Link>
        <Link
          href="/app"
          className="border-b border-current pb-1 font-ui text-[11px] uppercase tracking-[0.18em] transition-opacity hover:opacity-70"
        >
          Launch App
        </Link>
      </div>
    </header>
  )
}
