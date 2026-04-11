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

export const WATCHER_ACCOUNT = "" // filled after watcher setup

export const ADDRESSES = {
  VAULT_ID: "",
  LOAN_BROKER_ID: "",
  RLUSD_ISSUER: "",
}
