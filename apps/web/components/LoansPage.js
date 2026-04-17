"use client"

import { useLoanMarket } from "@/hooks/useLoanMarket"
import { LoanMarketplace } from "@/components/loans/LoanMarketplace"
import { ActiveLoans } from "@/components/loans/ActiveLoans"
import { useWallet } from "@/components/providers/WalletProvider"

export function LoansPage() {
  const { isConnected } = useWallet()
  const {
    availableVaults,
    activeLoans,
    loading,
    borrowFromVault,
    repayLoan,
    manageLoan,
  } = useLoanMarket()

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      <LoanMarketplace
        vaults={availableVaults}
        loading={loading}
        onBorrow={borrowFromVault}
      />
      {(isConnected || activeLoans.length > 0) && (
        <ActiveLoans
          loans={activeLoans}
          loading={loading}
          onRepay={repayLoan}
          onManage={manageLoan}
        />
      )}
    </div>
  )
}
