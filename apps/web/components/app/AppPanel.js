import { cn } from "../../lib/utils"

export function AppPanel({ eyebrow, title, description, actions, tone = "paper", className, children }) {
  return (
    <section
      className={cn(
        "rounded-none",
        tone === "dark" ? "exchange-panel-dark" : "exchange-panel",
        className
      )}
    >
      {(eyebrow || title || description || actions) && (
        <div className="border-b museum-rule px-4 py-4 md:px-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              {eyebrow ? (
                <p className="font-ui text-[11px] uppercase tracking-[0.22em] text-[color:var(--museum-muted)]">
                  {eyebrow}
                </p>
              ) : null}
              {title ? <h2 className="font-display text-3xl leading-none md:text-4xl">{title}</h2> : null}
              {description ? (
                <p className={cn("max-w-3xl text-sm leading-7 md:text-[0.98rem]", tone === "dark" ? "text-[#cfcaa0]" : "exchange-muted")}>
                  {description}
                </p>
              ) : null}
            </div>

            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        </div>
      )}

      <div className="px-4 py-4 md:px-5 md:py-5">{children}</div>
    </section>
  )
}
