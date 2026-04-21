import { ADVANCED_ORDER_STATUSES } from "./statuses.js"

export { ADVANCED_ORDER_STATUSES }

export function createAdvancedOrderDraft({ market, type, side }) {
  return {
    id: null,
    market,
    type,
    side,
    status: "draft",
    createdAt: null,
    trigger: null,
    schedule: null,
  }
}
