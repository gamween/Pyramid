# Pyramid Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize Pyramid's non-ZKP product surface by fixing watcher/frontend wiring, removing misleading or dead paths, restoring a real lint/build baseline, and updating docs to match the code that actually ships.

**Architecture:** The implementation introduces a single app-owned watcher proxy boundary, pure normalization helpers for watcher state, lifecycle-safe wallet listener registration, and a reduced truthful UI surface that only exposes coherent flows. Unsupported trading directions and dead loan/ticket endpoints are removed or rejected instead of being left half-wired.

**Tech Stack:** Next.js App Router, React 19, Express watcher, xrpl.js smartescrow fork, ESLint, Node built-in test runner, pnpm, Turborepo.

---

## File Map

**Create:**
- `apps/web/app/api/watcher-url.js`
- `apps/web/app/api/orders/route.js`
- `apps/web/app/api/orders/[owner]/[sequence]/route.js`
- `apps/web/app/api/dca/route.js`
- `apps/web/lib/order-state.js`
- `apps/web/lib/order-state.test.js`
- `apps/web/lib/wallet-listeners.js`
- `apps/web/lib/wallet-listeners.test.js`
- `apps/watcher/src/trading-validators.js`
- `apps/watcher/src/trading-validators.test.js`

**Modify:**
- `.gitignore`
- `CLAUDE.md`
- `CONTRIBUTING.md`
- `README.md`
- `docs/specs/2026-04-11-pyramid-design.md`
- `package.json`
- `apps/web/package.json`
- `apps/web/components/ActivePositions.js`
- `apps/web/components/AdvancedTradingForm.js`
- `apps/web/components/Header.js`
- `apps/web/hooks/useLoanMarket.js`
- `apps/web/hooks/useWalletConnector.js`
- `apps/web/hooks/useWalletManager.js`
- `apps/web/components/LoansPage.js`
- `apps/web/components/loans/ActiveLoans.js`
- `apps/web/app/api/loans/available/route.js`
- `apps/web/app/api/loans/borrow/route.js`
- `apps/web/app/api/loans/manage/route.js`
- `apps/web/app/api/loans/repay/route.js`
- `apps/web/app/api/loans/status/route.js`
- `apps/watcher/src/index.js`
- `apps/watcher/src/cosign-handler.js`
- `pnpm-lock.yaml`

**Delete:**
- `apps/web/app/api/loans/watcher-url.js`
- `apps/web/app/api/loans/close/route.js`
- `apps/web/app/api/loans/cosign/route.js`
- `apps/web/app/api/loans/prepare/route.js`
- `apps/web/hooks/useTickets.js`

**Assumption for execution:** create the implementation branch from the current `chore/audit-cleanup` state in a project-local worktree at `.worktrees/pyramid-stabilization`.

### Task 1: Isolate The Implementation Workspace

**Files:**
- Modify: `.gitignore`
- Modify: `CLAUDE.md`
- Modify: `CONTRIBUTING.md`

- [ ] **Step 1: Add the local worktree convention to existing repo docs and ignore it**

Update `.gitignore` to include:

```gitignore
# Local worktrees
.worktrees/
```

Update `CLAUDE.md` branch guidance to replace the stale `develop` rule with current instructions:

```md
## Branch Strategy

- Active cleanup work may start from `chore/*` branches when stabilizing the repo.
- Implementation work should happen in an isolated project-local worktree at `.worktrees/<branch-name>`.
- Create `fix/<name>` or `refactor/<name>` from the approved audit/spec branch before code changes.
- Commit messages: `chore:`, `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
```

Update `CONTRIBUTING.md` to match:

```md
## Branching

1. Create a worktree-backed branch from the current approved working branch.
2. Use `.worktrees/<branch-name>` for local isolation.
3. Keep documentation and verification changes in the same branch as the code they describe.
```

- [ ] **Step 2: Commit the workspace convention before implementation begins**

Run:

```bash
git add .gitignore CLAUDE.md CONTRIBUTING.md
git commit -m "docs: define local worktree convention"
```

Expected: one documentation/setup commit with no application logic changes.

- [ ] **Step 3: Create the isolated implementation worktree and install dependencies**

Run:

```bash
git worktree add .worktrees/pyramid-stabilization -b fix/pyramid-stabilization
cd .worktrees/pyramid-stabilization
pnpm install
```

Expected: a new clean worktree on `fix/pyramid-stabilization`.

- [ ] **Step 4: Record the baseline verification state before making code changes**

Run:

```bash
pnpm --filter web build
pnpm --filter web lint || true
pnpm -C apps/web exec eslint . --ext .js,.jsx
node --check apps/watcher/src/index.js
node --check apps/watcher/src/cosign-handler.js
node --check apps/watcher/src/devnet-loop.js
node --check apps/watcher/src/dca-scheduler.js
node --check apps/watcher/src/zk-prover.js
```

Expected:
- `build` passes
- `pnpm --filter web lint` fails because of the current Next/lint mismatch
- direct `eslint` reports the current warnings
- watcher syntax checks pass

### Task 2: Add A Single Watcher Proxy Boundary And Normalization Layer

**Files:**
- Create: `apps/web/app/api/watcher-url.js`
- Create: `apps/web/app/api/orders/route.js`
- Create: `apps/web/app/api/orders/[owner]/[sequence]/route.js`
- Create: `apps/web/app/api/dca/route.js`
- Create: `apps/web/lib/order-state.js`
- Test: `apps/web/lib/order-state.test.js`
- Modify: `apps/web/app/api/loans/available/route.js`
- Modify: `apps/web/app/api/loans/borrow/route.js`
- Modify: `apps/web/app/api/loans/manage/route.js`
- Modify: `apps/web/app/api/loans/repay/route.js`
- Modify: `apps/web/app/api/loans/status/route.js`
- Delete: `apps/web/app/api/loans/watcher-url.js`

- [ ] **Step 1: Write the failing normalization test for watcher state**

Create `apps/web/lib/order-state.test.js`:

```js
import test from "node:test"
import assert from "node:assert/strict"
import { normalizeWatcherState } from "./order-state.js"

test("normalizeWatcherState converts watcher maps into ordered UI collections", () => {
  const normalized = normalizeWatcherState({
    orders: {
      "rOwner:12": {
        owner: "rOwner",
        escrowSequence: 12,
        orderType: "STOP_LOSS",
        amount: "2500000",
        triggerPrice: 0.42,
        status: "ACTIVE",
      },
    },
    dcaSchedules: {
      scheduleA: {
        id: "scheduleA",
        owner: "rOwner",
        escrowSequence: 88,
        side: "SELL",
        perSliceAmount: "1000000",
        completed: 1,
        total: 4,
        status: "ACTIVE",
      },
    },
  })

  assert.equal(normalized.orders.length, 1)
  assert.equal(normalized.orders[0].id, "rOwner:12")
  assert.equal(normalized.orders[0].type, "STOP_LOSS")
  assert.match(normalized.orders[0].trigger, /0.42/)

  assert.equal(normalized.schedules.length, 1)
  assert.equal(normalized.schedules[0].id, "scheduleA")
  assert.match(normalized.schedules[0].progress, /1\/4/)
})
```

- [ ] **Step 2: Run the test to verify the helper is missing**

Run:

```bash
node --test apps/web/lib/order-state.test.js
```

Expected: FAIL because `apps/web/lib/order-state.js` does not exist yet.

- [ ] **Step 3: Implement the watcher URL helper, proxy routes, and normalization helper**

Create `apps/web/app/api/watcher-url.js`:

```js
export const WATCHER_URL = process.env.WATCHER_URL || "http://localhost:3001"
```

Create `apps/web/lib/order-state.js`:

```js
function formatTrigger(order) {
  if (order.triggerPrice != null) return `Trigger @ ${order.triggerPrice}`
  if (order.trailingPct != null) return `Trail ${order.trailingPct} bps`
  if (order.tpPrice != null || order.slPrice != null) {
    return `TP ${order.tpPrice ?? "—"} / SL ${order.slPrice ?? "—"}`
  }
  return "—"
}

export function normalizeWatcherState(payload = {}) {
  const orders = Object.values(payload.orders ?? {}).map((order) => ({
    kind: "order",
    id: `${order.owner}:${order.escrowSequence}`,
    owner: order.owner,
    sequence: order.escrowSequence,
    type: order.orderType,
    amountDrops: order.amount,
    amountLabel: order.amount ? `${(Number(order.amount) / 1_000_000).toLocaleString()} XRP` : "—",
    trigger: formatTrigger(order),
    status: order.status ?? "ACTIVE",
  }))

  const schedules = Object.values(payload.dcaSchedules ?? {}).map((schedule) => ({
    kind: "schedule",
    id: schedule.id,
    owner: schedule.owner,
    sequence: schedule.escrowSequence,
    type: schedule.side === "SELL" ? "DCA/TWAP" : "UNSUPPORTED",
    amountLabel: schedule.perSliceAmount
      ? `${(Number(schedule.perSliceAmount) / 1_000_000).toLocaleString()} XRP / slice`
      : "—",
    trigger: `Progress ${schedule.completed}/${schedule.total}`,
    progress: `${schedule.completed}/${schedule.total}`,
    status: schedule.status ?? "ACTIVE",
  }))

  return { orders, schedules }
}
```

Create `apps/web/app/api/orders/route.js`:

```js
import { WATCHER_URL } from "../watcher-url"

export async function GET() {
  try {
    const res = await fetch(`${WATCHER_URL}/api/orders`)
    const data = await res.json()
    return Response.json(data, { status: res.status })
  } catch {
    return Response.json({ orders: {}, dcaSchedules: {} }, { status: 200 })
  }
}

export async function POST(request) {
  const body = await request.json()
  const res = await fetch(`${WATCHER_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}
```

Create `apps/web/app/api/orders/[owner]/[sequence]/route.js`:

```js
import { WATCHER_URL } from "../../../watcher-url"

export async function DELETE(_request, { params }) {
  const res = await fetch(`${WATCHER_URL}/api/orders/${params.owner}/${params.sequence}`, {
    method: "DELETE",
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}
```

Create `apps/web/app/api/dca/route.js`:

```js
import { WATCHER_URL } from "../watcher-url"

export async function POST(request) {
  const body = await request.json()
  const res = await fetch(`${WATCHER_URL}/api/dca`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}
```

Update the loan proxy routes to import from `../../watcher-url` instead of the deleted `app/api/loans/watcher-url.js`.

- [ ] **Step 4: Run the new helper test and syntax-check the new proxy routes**

Run:

```bash
node --test apps/web/lib/order-state.test.js
node --check apps/web/app/api/orders/route.js
node --check apps/web/app/api/orders/[owner]/[sequence]/route.js
node --check apps/web/app/api/dca/route.js
```

Expected: PASS for the test and no syntax errors.

- [ ] **Step 5: Commit the watcher proxy boundary**

Run:

```bash
git add apps/web/app/api/watcher-url.js \
  apps/web/app/api/orders/route.js \
  apps/web/app/api/orders/[owner]/[sequence]/route.js \
  apps/web/app/api/dca/route.js \
  apps/web/lib/order-state.js \
  apps/web/lib/order-state.test.js \
  apps/web/app/api/loans/available/route.js \
  apps/web/app/api/loans/borrow/route.js \
  apps/web/app/api/loans/manage/route.js \
  apps/web/app/api/loans/repay/route.js \
  apps/web/app/api/loans/status/route.js \
  apps/web/app/api/loans/watcher-url.js
git commit -m "refactor: centralize watcher proxy routes"
```

### Task 3: Repair Active Positions And Add Truthful Cancel Actions

**Files:**
- Modify: `apps/web/components/ActivePositions.js`
- Modify: `apps/web/hooks/useEscrow.js`
- Test: `apps/web/lib/order-state.test.js`

- [ ] **Step 1: Extend the normalization test with status labels used by the UI**

Append to `apps/web/lib/order-state.test.js`:

```js
test("normalizeWatcherState keeps cancelable metadata for tracked orders", () => {
  const normalized = normalizeWatcherState({
    orders: {
      "rOwner:33": {
        owner: "rOwner",
        escrowSequence: 33,
        orderType: "TRAILING_STOP",
        amount: "5000000",
        trailingPct: 150,
        status: "ACTIVE",
      },
    },
  })

  assert.equal(normalized.orders[0].sequence, 33)
  assert.match(normalized.orders[0].trigger, /150/)
})
```

- [ ] **Step 2: Run the test to lock the expected UI model**

Run:

```bash
node --test apps/web/lib/order-state.test.js
```

Expected: PASS before the UI integration work starts.

- [ ] **Step 3: Rewrite `ActivePositions` to consume the normalized watcher response and expose explicit actions**

Update `apps/web/components/ActivePositions.js` so that it:

- fetches `/api/orders` instead of `http://localhost:3001/api/orders`
- treats the payload as `{ orders, dcaSchedules }`
- calls `normalizeWatcherState(data)`
- renders orders and schedules truthfully
- exposes:
  - `Stop Tracking` → `DELETE /api/orders/:owner/:sequence`
  - `Cancel Escrow On-Chain` → `cancelEscrow(owner, sequence)`

Target structure:

```js
const { cancelEscrow } = useEscrow()

async function handleStopTracking(owner, sequence) {
  await fetch(`/api/orders/${owner}/${sequence}`, { method: "DELETE" })
  await fetchOrders()
}

async function handleCancelEscrow(owner, sequence) {
  await cancelEscrow(owner, sequence)
  await fetchOrders()
}
```

Use explicit button labels so watcher-cache deletion is never confused with on-chain escrow cancellation.

- [ ] **Step 4: Run the build and a static bypass check**

Run:

```bash
pnpm --filter web build
rg -n "localhost:3001/api/orders|localhost:3001/api/dca" apps/web/components apps/web/hooks
```

Expected:
- build passes
- `rg` returns no direct component-level watcher bypasses after this task and Task 4

- [ ] **Step 5: Commit the repaired status surface**

Run:

```bash
git add apps/web/components/ActivePositions.js apps/web/hooks/useEscrow.js apps/web/lib/order-state.test.js
git commit -m "fix: repair active positions and cancel actions"
```

### Task 4: Restrict Trading To Supported SELL Flows And Remove Direct Bypasses

**Files:**
- Create: `apps/watcher/src/trading-validators.js`
- Test: `apps/watcher/src/trading-validators.test.js`
- Modify: `apps/watcher/src/index.js`
- Modify: `apps/web/components/AdvancedTradingForm.js`

- [ ] **Step 1: Write the failing watcher-side validator tests**

Create `apps/watcher/src/trading-validators.test.js`:

```js
import test from "node:test"
import assert from "node:assert/strict"
import { assertSupportedOrderPayload, assertSupportedSchedulePayload } from "./trading-validators.js"

test("assertSupportedOrderPayload rejects BUY orders", () => {
  assert.throws(
    () => assertSupportedOrderPayload({ side: "BUY", orderType: "STOP_LOSS" }),
    /disabled/
  )
})

test("assertSupportedSchedulePayload rejects BUY schedules", () => {
  assert.throws(
    () => assertSupportedSchedulePayload({ side: "BUY", slices: 4 }),
    /disabled/
  )
})
```

- [ ] **Step 2: Run the tests to verify the validator module is missing**

Run:

```bash
node --test apps/watcher/src/trading-validators.test.js
```

Expected: FAIL because `trading-validators.js` does not exist yet.

- [ ] **Step 3: Implement watcher-side validation and wire it into the public routes**

Create `apps/watcher/src/trading-validators.js`:

```js
export function assertSupportedOrderPayload(payload) {
  if (payload.side !== "SELL") {
    throw new Error("BUY / short advanced orders are disabled in the current release")
  }
  if (!payload.owner || !payload.escrowSequence || !payload.orderType) {
    throw new Error("Missing required order fields")
  }
}

export function assertSupportedSchedulePayload(payload) {
  if (payload.side !== "SELL") {
    throw new Error("BUY / short DCA/TWAP schedules are disabled in the current release")
  }
  if (!payload.owner || !payload.escrowSequence || !payload.slices) {
    throw new Error("Missing required schedule fields")
  }
}
```

Update `apps/watcher/src/index.js`:

```js
import { assertSupportedOrderPayload, assertSupportedSchedulePayload } from "./trading-validators.js"

app.post("/api/orders", (req, res) => {
  try {
    assertSupportedOrderPayload(req.body)
    const key = orderCache.addOrder(req.body)
    res.json({ status: "ok", key })
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message })
  }
})

app.post("/api/dca", (req, res) => {
  try {
    assertSupportedSchedulePayload(req.body)
    const id = orderCache.addDca(req.body)
    res.json({ status: "ok", id })
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message })
  }
})
```

- [ ] **Step 4: Update `AdvancedTradingForm` to remove unsupported directions and use only app-owned routes**

Apply these changes in `apps/web/components/AdvancedTradingForm.js`:

- replace `fetch("http://localhost:3001/api/orders", ...)` with `fetch("/api/orders", ...)`
- replace `fetch("http://localhost:3001/api/dca", ...)` with `fetch("/api/dca", ...)`
- remove the `BUY` `<option>` values from the active form controls
- add a small note:

```js
<p className="text-xs font-mono text-white/40">
  Current release supports SELL-side advanced orders only. BUY / short flows are disabled until the asset model is redesigned.
</p>
```

- keep the USD trustline setup only for the supported SELL-side proceeds path

- [ ] **Step 5: Run validation, watcher syntax checks, and a bypass scan**

Run:

```bash
node --test apps/watcher/src/trading-validators.test.js
node --check apps/watcher/src/index.js
pnpm --filter web build
rg -n "localhost:3001" apps/web
```

Expected:
- validator tests pass
- watcher route file parses
- web build passes
- `rg` returns no direct watcher URLs in `apps/web`

- [ ] **Step 6: Commit the truthful trading surface**

Run:

```bash
git add apps/watcher/src/trading-validators.js \
  apps/watcher/src/trading-validators.test.js \
  apps/watcher/src/index.js \
  apps/web/components/AdvancedTradingForm.js
git commit -m "fix: restrict trading UI to supported flows"
```

### Task 5: Remove Dead Loan And Ticket Paths

**Files:**
- Modify: `apps/web/hooks/useLoanMarket.js`
- Modify: `apps/web/components/LoansPage.js`
- Modify: `apps/web/components/loans/ActiveLoans.js`
- Modify: `apps/watcher/src/index.js`
- Modify: `apps/watcher/src/cosign-handler.js`
- Delete: `apps/web/app/api/loans/close/route.js`
- Delete: `apps/web/app/api/loans/cosign/route.js`
- Delete: `apps/web/app/api/loans/prepare/route.js`
- Delete: `apps/web/hooks/useTickets.js`

- [ ] **Step 1: Record the current dead-path hits before deleting them**

Run:

```bash
rg -n "closeLoan|/api/loans/(close|prepare|cosign)|useTickets" apps/web apps/watcher
```

Expected: current hits in the loan hook, route files, watcher endpoints, and the orphaned hook.

- [ ] **Step 2: Remove the dead frontend loan/ticket code**

Update `apps/web/hooks/useLoanMarket.js` to drop `closeLoan` entirely:

```js
return {
  availableVaults,
  activeLoans,
  loading,
  error,
  fetchAvailableVaults,
  fetchActiveLoans,
  borrowFromVault,
  repayLoan,
  manageLoan,
}
```

Update `apps/web/components/LoansPage.js` to stop passing `closeLoan`.

Update `apps/web/components/loans/ActiveLoans.js` to stop accepting `onClose`.

Delete:

```text
apps/web/app/api/loans/close/route.js
apps/web/app/api/loans/cosign/route.js
apps/web/app/api/loans/prepare/route.js
apps/web/hooks/useTickets.js
```

- [ ] **Step 3: Remove the dead watcher-side routes and handler methods**

Delete the unused `closeLoan`, `prepareLoanTx`, and `cosignAndSubmit` public route handling from `apps/watcher/src/index.js`.

Delete the corresponding unused methods from `apps/watcher/src/cosign-handler.js`.

The remaining public loan surface should be:

```js
GET  /api/loans/available
POST /api/loans/borrow
POST /api/loans/repay
POST /api/loans/manage
GET  /api/loans/status
```

- [ ] **Step 4: Re-run the dead-path scan**

Run:

```bash
rg -n "closeLoan|/api/loans/(close|prepare|cosign)|useTickets" apps/web apps/watcher
```

Expected: no hits in active source files.

- [ ] **Step 5: Verify the web build still passes**

Run:

```bash
pnpm --filter web build
```

Expected: PASS.

- [ ] **Step 6: Commit the dead-path removal**

Run:

```bash
git add apps/web/hooks/useLoanMarket.js \
  apps/web/components/LoansPage.js \
  apps/web/components/loans/ActiveLoans.js \
  apps/watcher/src/index.js \
  apps/watcher/src/cosign-handler.js \
  apps/web/app/api/loans/close/route.js \
  apps/web/app/api/loans/cosign/route.js \
  apps/web/app/api/loans/prepare/route.js \
  apps/web/hooks/useTickets.js
git commit -m "refactor: remove dead loan and ticket paths"
```

### Task 6: Fix Wallet Listener Cleanup And Remove Remaining Lint Warnings

**Files:**
- Create: `apps/web/lib/wallet-listeners.js`
- Test: `apps/web/lib/wallet-listeners.test.js`
- Modify: `apps/web/hooks/useWalletManager.js`
- Modify: `apps/web/hooks/useWalletConnector.js`
- Modify: `apps/web/components/Header.js`

- [ ] **Step 1: Write the failing listener cleanup tests**

Create `apps/web/lib/wallet-listeners.test.js`:

```js
import test from "node:test"
import assert from "node:assert/strict"
import { registerManagerListeners, registerConnectorListeners } from "./wallet-listeners.js"

test("registerManagerListeners unregisters all handlers", () => {
  const calls = []
  const manager = {
    on(event, fn) { calls.push(["on", event, fn]) },
    off(event, fn) { calls.push(["off", event, fn]) },
  }

  const cleanup = registerManagerListeners(manager, {
    addEvent() {},
    showStatus() {},
    updateConnectionState() {},
  })

  cleanup()

  assert.equal(calls.filter(([type]) => type === "on").length, 3)
  assert.equal(calls.filter(([type]) => type === "off").length, 3)
})

test("registerConnectorListeners unregisters DOM listeners", () => {
  const calls = []
  const element = {
    addEventListener(event, fn) { calls.push(["add", event, fn]) },
    removeEventListener(event, fn) { calls.push(["remove", event, fn]) },
  }

  const cleanup = registerConnectorListeners(element, {
    addEvent() {},
    showStatus() {},
  })

  cleanup()

  assert.equal(calls.filter(([type]) => type === "add").length, 3)
  assert.equal(calls.filter(([type]) => type === "remove").length, 3)
})
```

- [ ] **Step 2: Run the tests to confirm the helper module is missing**

Run:

```bash
node --test apps/web/lib/wallet-listeners.test.js
```

Expected: FAIL because `wallet-listeners.js` does not exist yet.

- [ ] **Step 3: Implement reusable listener registration helpers and wire the hooks to use them**

Create `apps/web/lib/wallet-listeners.js`:

```js
export function registerManagerListeners(manager, { addEvent, showStatus, updateConnectionState }) {
  const handleConnect = (account) => {
    addEvent("Connected", account)
    updateConnectionState(manager)
  }
  const handleDisconnect = () => {
    addEvent("Disconnected", null)
    updateConnectionState(manager)
  }
  const handleError = (error) => {
    addEvent("Error", error)
    showStatus(error.message, "error")
  }

  manager.on("connect", handleConnect)
  manager.on("disconnect", handleDisconnect)
  manager.on("error", handleError)

  return () => {
    manager.off("connect", handleConnect)
    manager.off("disconnect", handleDisconnect)
    manager.off("error", handleError)
  }
}

export function registerConnectorListeners(element, { addEvent, showStatus }) {
  const handleConnecting = (e) => showStatus(`Connecting to ${e.detail.walletId}...`, "info")
  const handleConnected = (e) => {
    showStatus("Connected successfully!", "success")
    addEvent("Connected via Web Component", e.detail)
  }
  const handleError = (e) => {
    showStatus(`Connection failed: ${e.detail.error.message}`, "error")
    addEvent("Connection Error", e.detail)
  }

  element.addEventListener("connecting", handleConnecting)
  element.addEventListener("connected", handleConnected)
  element.addEventListener("error", handleError)

  return () => {
    element.removeEventListener("connecting", handleConnecting)
    element.removeEventListener("connected", handleConnected)
    element.removeEventListener("error", handleError)
  }
}
```

Update both hooks so the `useEffect` itself returns the cleanup.

Convert the logo in `apps/web/components/Header.js` to `next/image`:

```js
import Image from "next/image"

<Image
  src="/logo.png"
  alt="Pyramid Logo"
  width={48}
  height={48}
  className={...}
/>
```

- [ ] **Step 4: Run the helper tests and lint directly**

Run:

```bash
node --test apps/web/lib/wallet-listeners.test.js
pnpm -C apps/web exec eslint . --ext .js,.jsx
```

Expected:
- tests pass
- no remaining warnings from `Header.js` or wallet hook dependency/cleanup issues

- [ ] **Step 5: Commit the wallet lifecycle fix**

Run:

```bash
git add apps/web/lib/wallet-listeners.js \
  apps/web/lib/wallet-listeners.test.js \
  apps/web/hooks/useWalletManager.js \
  apps/web/hooks/useWalletConnector.js \
  apps/web/components/Header.js
git commit -m "fix: clean up wallet listeners"
```

### Task 7: Align The Next.js And ESLint Toolchain

**Files:**
- Modify: `package.json`
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Update package declarations to match the installed Next.js generation**

Update root `package.json` by removing the stale Next override matrix entirely:

```json
{
  "name": "pyramid",
  "version": "0.1.0",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "format": "prettier --write \"**/*.{js,jsx,json,md}\"",
    "clean": "turbo clean && rm -rf node_modules"
  }
}
```

Update `apps/web/package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .js,.jsx"
  },
  "dependencies": {
    "next": "16.1.6"
  },
  "devDependencies": {
    "eslint-config-next": "16.1.6"
  }
}
```

- [ ] **Step 2: Reinstall the workspace lockfile**

Run:

```bash
pnpm install
```

Expected: `pnpm-lock.yaml` updates to match the declared package versions.

- [ ] **Step 3: Run the now-supported lint and build commands**

Run:

```bash
pnpm --filter web lint
pnpm --filter web build
node --check apps/watcher/src/index.js
node --check apps/watcher/src/cosign-handler.js
node --check apps/watcher/src/devnet-loop.js
node --check apps/watcher/src/dca-scheduler.js
node --check apps/watcher/src/zk-prover.js
```

Expected:
- `pnpm --filter web lint` passes
- `pnpm --filter web build` passes
- watcher syntax checks still pass

- [ ] **Step 4: Commit the toolchain normalization**

Run:

```bash
git add package.json apps/web/package.json pnpm-lock.yaml
git commit -m "chore: align web lint and next toolchain"
```

### Task 8: Update Existing Docs And Remove Stale References

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `CONTRIBUTING.md`
- Modify: `docs/specs/2026-04-11-pyramid-design.md`

- [ ] **Step 1: Audit the docs for stale references before editing**

Run:

```bash
rg -n "useTickets|localhost:3001|BUY|short|prepare|cosign|closeLoan|next lint|develop" \
  README.md CLAUDE.md CONTRIBUTING.md docs/specs/2026-04-11-pyramid-design.md
```

Expected: hits that reflect the stale assumptions removed by Tasks 4, 5, and 7.

- [ ] **Step 2: Update the existing docs so they match the stabilized repo**

Make these concrete edits:

- `README.md`
  - explain that watcher-backed trading flows are proxied through the app, not called directly from components
  - document SELL-side advanced orders only for the current release
  - remove references to unused hooks/routes
- `CLAUDE.md`
  - replace stale `develop`-only branch language
  - note `.worktrees/<branch-name>` as the project-local convention
- `CONTRIBUTING.md`
  - match the branch/worktree convention already committed in Task 1
  - document `pnpm --filter web lint` as the lint command
- `docs/specs/2026-04-11-pyramid-design.md`
  - mark unsupported BUY/short flows as deferred
  - remove `useTickets` from the active hook list
  - remove dead `/api/loans/prepare` and `/api/loans/cosign` references from the current surface

- [ ] **Step 3: Re-run the stale-reference audit**

Run:

```bash
rg -n "useTickets|localhost:3001|next lint" README.md CLAUDE.md CONTRIBUTING.md docs/specs/2026-04-11-pyramid-design.md
```

Expected: no remaining stale-reference hits.

- [ ] **Step 4: Commit the doc cleanup**

Run:

```bash
git add README.md CLAUDE.md CONTRIBUTING.md docs/specs/2026-04-11-pyramid-design.md
git commit -m "docs: update stabilization-era architecture notes"
```

### Task 9: Run The Full Verification Sweep And Prepare The Final Report

**Files:**
- Modify: none

- [ ] **Step 1: Run the full static verification suite**

Run:

```bash
pnpm --filter web lint
pnpm --filter web build
node --test apps/web/lib/order-state.test.js
node --test apps/web/lib/wallet-listeners.test.js
node --test apps/watcher/src/trading-validators.test.js
node --check apps/watcher/src/index.js
node --check apps/watcher/src/cosign-handler.js
node --check apps/watcher/src/devnet-loop.js
node --check apps/watcher/src/dca-scheduler.js
node --check apps/watcher/src/zk-prover.js
rg -n "localhost:3001" apps/web
rg -n "closeLoan|/api/loans/(close|prepare|cosign)|useTickets" apps/web apps/watcher
```

Expected:
- all tests pass
- all syntax checks pass
- no direct watcher bypasses remain in `apps/web`
- no dead loan/ticket paths remain in active source

- [ ] **Step 2: Run the funded manual smoke pass for the remaining active non-ZKP flows**

In two terminals, run:

```bash
pnpm --filter pyramid-watcher dev
pnpm --filter web dev
```

Manual checklist:

1. Connect wallet from the header.
Expected: wallet connects, status updates, account info populates.

2. Disconnect from the wallet profile menu.
Expected: state clears without duplicate events or stale listeners.

3. Submit a direct XRP payment from `TransactionForm`.
Expected: wallet signs, XRPL hash returns, success message renders.

4. Deposit into the vault from the lending tab.
Expected: wallet signs a `VaultDeposit`, success path completes.

5. Withdraw from the vault.
Expected: wallet signs a `VaultWithdraw`, success path completes.

6. Create a SELL stop-loss or trailing order.
Expected: escrow submits, watcher registration succeeds through `/api/orders`, and the new item appears in `ActivePositions`.

7. Use `Stop Tracking` on a watcher-managed order.
Expected: watcher cache entry disappears from `ActivePositions`.

8. Use `Cancel Escrow On-Chain` on the same order when eligible.
Expected: wallet signs an `EscrowCancel`; the on-chain cancel is distinct from local tracker deletion.

9. Borrow, repay, and manage a loan if those buttons remain active after Task 5.
Expected: every visible loan action completes its documented watcher path with no dead-end UI.

- [ ] **Step 3: Summarize the release-ready state and deferred follow-up items in the final response**

Final response must include:

- what was fixed
- what was removed or disabled
- verification commands that passed
- manual flows verified
- what still needs to be tackled afterwards, matching the approved spec backlog:
  - frontend-only architecture review
  - trading model redesign for BUY/short flows
  - loan architecture review
  - watcher boundary redesign
  - ZKP / Boundless reintegration
  - automated verification maturity

- [ ] **Step 4: Commit the stabilized branch after successful verification**

Run:

```bash
git status
git add -A
git commit -m "fix: stabilize Pyramid non-ZKP flows"
```

Expected: one final integration commit on top of the task-by-task history after all verification is complete.
