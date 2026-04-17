function formatAmount(drops) {
  const value = Number(drops)
  if (!Number.isFinite(value)) return "—"
  return `${(value / 1_000_000).toLocaleString()} XRP`
}

function formatTrigger(order) {
  if (order.triggerPrice != null) return `Trigger @ ${order.triggerPrice}`
  if (order.trailingPct != null) return `Trail ${order.trailingPct} bps`
  if (order.tpPrice != null || order.slPrice != null) return `TP ${order.tpPrice ?? "—"} / SL ${order.slPrice ?? "—"}`
  return "—"
}

function isActiveStatus(status) {
  return (status ?? "ACTIVE") === "ACTIVE"
}

export function normalizeWatcherState(payload = {}) {
  const orders = Object.values(payload.orders ?? {}).map((order) => ({
    kind: "order",
    id: `${order.owner}:${order.escrowSequence}`,
    owner: order.owner,
    sequence: order.escrowSequence,
    type: order.orderType,
    amountDrops: order.amount,
    amountLabel: formatAmount(order.amount),
    trigger: formatTrigger(order),
    status: order.status ?? "ACTIVE",
    canStopTracking: true,
    canCancelEscrow: isActiveStatus(order.status),
  }))

  const schedules = Object.values(payload.dcaSchedules ?? {}).map((schedule) => ({
    kind: "schedule",
    id: schedule.id,
    owner: schedule.owner,
    sequence: schedule.escrowSequence,
    type: schedule.side === "SELL" ? "DCA/TWAP" : "UNSUPPORTED",
    amountLabel: Number.isFinite(Number(schedule.perSliceAmount))
      ? `${(Number(schedule.perSliceAmount) / 1_000_000).toLocaleString()} XRP / slice`
      : "—",
    trigger: `Progress ${schedule.completed}/${schedule.total}`,
    progress: `${schedule.completed}/${schedule.total}`,
    status: schedule.status ?? "ACTIVE",
    canStopTracking: false,
    canCancelEscrow: false,
  }))

  return { orders, schedules }
}
