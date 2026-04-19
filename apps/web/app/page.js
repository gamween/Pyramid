import Link from "next/link"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f4d548] text-black">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-8 px-6 py-24">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-black/70">
          Landing rebuild in progress
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold uppercase tracking-tight md:text-6xl">
          The new Pyramid landing page is being rebuilt right now.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-black/75 md:text-lg">
          The current product experience has been moved into the dedicated app route while the new
          landing is under construction.
        </p>
        <div>
          <Link
            href="/app"
            className="inline-flex border border-black bg-black px-5 py-3 font-mono text-xs uppercase tracking-[0.24em] text-[#f4d548] transition-colors hover:bg-transparent hover:text-black"
          >
            Open /app
          </Link>
        </div>
      </div>
    </main>
  )
}
