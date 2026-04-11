// Order types — WASM path (price-triggered, devnet)
export const WASM_ORDER_TYPES = {
  STOP_LOSS: "STOP_LOSS",
  TAKE_PROFIT: "TAKE_PROFIT",
  TRAILING_STOP: "TRAILING_STOP",
  OCO: "OCO",
};

// Order types — Hooks path (time-based, Xahau)
export const HOOK_ORDER_TYPES = {
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
  MANAGEMENT_FEE_RATE: 1000, // 1% in 1/10th basis points
  DEFAULT_PAYMENT_INTERVAL: 2592000, // 30 days in seconds
  DEFAULT_GRACE_PERIOD: 604800, // 7 days in seconds
};

// Hook memo types for DCA/TWAP on Xahau
export const HOOK_MEMO_TYPES = {
  DCA_SETUP: "peach/dca",
  TWAP_SETUP: "peach/twap",
  EXECUTE: "peach/execute",
  CANCEL: "peach/cancel",
};

// Contract/account addresses (filled after deployment)
export const ADDRESSES = {
  VAULT_ID: "",
  LOAN_BROKER_ID: "",
  HOOK_ACCOUNT: "",
};
