// Order types (Devnet)
export const ORDER_TYPES = {
  STOP_LOSS: "STOP_LOSS",
  TAKE_PROFIT: "TAKE_PROFIT",
  TRAILING_STOP: "TRAILING_STOP",
  OCO: "OCO",
  DCA: "DCA",
  TWAP: "TWAP",
};

export const ORDER_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  TRIGGERED: "TRIGGERED",
  EXECUTED: "EXECUTED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
};

export const SIDES = {
  BUY: "BUY",
  SELL: "SELL",
};

// Lending protocol constants (XLS-65/66)
export const LENDING = {
  MANAGEMENT_FEE_RATE: 1000,           // 1%
  DEFAULT_INTEREST_RATE: 500,          // 0.5% annualized
  DEFAULT_PAYMENT_INTERVAL: 2592000,   // 30 days in seconds
  DEFAULT_GRACE_PERIOD: 604800,        // 7 days in seconds
};

// Watcher and Protocol addresses (Filled after setup)
export const ADDRESSES = {
  VAULT_ID: "",
  LOAN_BROKER_ID: "",
  RLUSD_ISSUER: "", // DevNet RLUSD Gateway
};

export const WATCHER_ACCOUNT = ""; // Watcher bot's DevNet address
