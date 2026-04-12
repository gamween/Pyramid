export const ORDER_TYPES = {
  STOP_LOSS: "STOP_LOSS",
  TAKE_PROFIT: "TAKE_PROFIT",
  TRAILING_STOP: "TRAILING_STOP",
  OCO: "OCO",
  DCA: "DCA",
  TWAP: "TWAP",
}

export const ORDER_STATUS = {
  ACTIVE: "ACTIVE",
  TRIGGERED: "TRIGGERED",
  EXECUTED: "EXECUTED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
}

export const SIDES = { BUY: "BUY", SELL: "SELL" }

export const LENDING = {
  MANAGEMENT_FEE_RATE: 1000,
  DEFAULT_INTEREST_RATE: 500,
  DEFAULT_PAYMENT_INTERVAL: 2592000,
  DEFAULT_GRACE_PERIOD: 604800,
}

export const LOAN_PAY_FLAGS = {
  tfLoanOverpayment: 0x00010000,
  tfLoanFullPayment: 0x00020000,
  tfLoanLatePayment: 0x00040000,
}

export const LOAN_MANAGE_FLAGS = {
  tfLoanDefault: 0x00010000,
  tfLoanImpair: 0x00020000,
  tfLoanUnimpair: 0x00040000,
}

export const WATCHER_ACCOUNT = "rJMcmkMxWYXae6wKy3iQVx6v9gN7p2BRFZ"

export const ADDRESSES = {
  VAULT_ID: "FFCCAB1AEE444B166C141AD2674BC43A4E6E184D27D921FCBA179B6DDE17B2BE",
  LOAN_BROKER_ID: "356E1FF36205377B8C6074489708A9B602CCB349A910305F25CC57AE7A930432",
  RLUSD_ISSUER: "rEG2pq6HguMSyU7rZC44fWuw75o4J5VQZs",
}

export const SHOWCASE_VAULTS = [
  {
    id: "8A84591D49EF8D1A25ABF2CE1E28DE5AA8899484392EFEDE84FA3304E109C62E",
    name: "Fresh Vault",
    tagline: "Ready to Lend",
    status: "ready",
    primitives: ["VaultCreate", "VaultDeposit", "LoanBrokerSet", "LoanBrokerCoverDeposit"],
  },
  {
    id: "6087666E82509EFA5922ED57E87E647A78063378686195620F6445B0D36C66E2",
    name: "Active Lending",
    tagline: "Loans Outstanding",
    status: "active",
    primitives: ["VaultCreate", "VaultDeposit", "LoanBrokerSet", "LoanBrokerCoverDeposit", "LoanSet", "LoanPay"],
  },
  {
    id: "AD7E1DB393F73284E52F90C8B960FB8FC051399521E7FC9BAE30FFCBA53C8A44",
    name: "Yield Earned",
    tagline: "Full Lifecycle Complete",
    status: "yield",
    primitives: ["VaultCreate", "VaultDeposit", "LoanBrokerSet", "LoanBrokerCoverDeposit", "LoanSet", "LoanPay", "LoanDelete"],
  },
]
