import { SiteFooter } from "../SiteFooter"
import { SiteHeader } from "../SiteHeader"
import { landingSections } from "../../../lib/site-content"
import { ClosingSection } from "./ClosingSection"
import { LandingHero } from "./LandingHero"
import { LendingSection } from "./LendingSection"
import { StorySection } from "./StorySection"

export function LandingScene() {
  const [heroSection, howItWorksSection, tradingToolsSection, lendingSection, closingSection] =
    landingSections

  return (
    <div className="museum-shell min-h-screen">
      <SiteHeader />

      <main className="flex w-full flex-col gap-24 px-4 py-10 pb-20 md:px-8 md:py-14 lg:px-10 xl:px-12">
        <LandingHero section={heroSection} />
        <StorySection
          section={howItWorksSection}
          visualPlacement="left"
          highlights={[
            {
              label: "DEX",
              text: "Order-book trading stays native to the ledger and reads like a gallery caption, not a trading terminal.",
            },
            {
              label: "AMM",
              text: "Automated market making appears as the liquidity layer beneath the composition.",
            },
            {
              label: "Vaults",
              text: "Lending begins with the vault, the place where supply stays legible.",
            },
            {
              label: "Loans",
              text: "Borrowing closes the loop with plain-language flow and no dashboard noise.",
            },
          ]}
        />
        <StorySection
          section={tradingToolsSection}
          visualPlacement="right"
          highlights={[
            {
              label: "Stop-loss",
              text: "Protect positions with a clear exit line instead of a control panel full of toggles.",
            },
            {
              label: "Take-profit",
              text: "Stage exits cleanly when the market reaches the framed target.",
            },
            {
              label: "Trailing",
              text: "Let the order follow the market while the page keeps the language restrained.",
            },
            {
              label: "OCO",
              text: "Pair conditions without losing the sense of sequence.",
            },
          ]}
        />
        <LendingSection section={lendingSection} />
        <ClosingSection section={closingSection} />
      </main>

      <SiteFooter />
    </div>
  )
}
