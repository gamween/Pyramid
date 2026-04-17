# Pyramid Stabilization Design

**Date:** 2026-04-17
**Branch Context:** `chore/audit-cleanup`
**Status:** Draft for user review

## Goal

Stabilize Pyramid's current non-ZKP product surface so the repo is honest, internally coherent, and verifiable.

This design fixes broken frontend-to-watcher wiring, removes or quarantines misleading UI paths, restores a real lint/verification baseline, and documents the current architectural truth of the project.

It does **not** redesign Pyramid into a frontend-only product in this pass.

## Scope

### Included

- Fix `ActivePositions` so watcher-managed orders and DCA schedules render correctly.
- Add a truthful order cancellation flow where the current backend actually supports it.
- Fix wallet listener lifecycle cleanup.
- Resolve the Next.js / ESLint version mismatch so `lint` is meaningful again.
- Audit all non-ZKP active buttons and map them to their real execution path.
- Remove, disable, or clearly quarantine UI paths that are not trustworthy today.
- Update and prune Markdown documentation so the repo reflects the actual app state.
- Document why a backend exists today and what "bypass" means in this repo.

### Excluded

- ZKP / Boundless / Smart Escrow redesign or verification.
- A full frontend-only architecture migration.
- Loan cosigning redesign.
- Watcher removal.
- New product features.

## Problem Summary

The repo currently mixes four different kinds of behavior:

1. **Direct wallet-signed on-chain flows**
   Example: direct `Payment`, `VaultDeposit`, `VaultWithdraw`.
2. **Watcher-assisted automation**
   Example: advanced order triggers and scheduled DCA/TWAP execution.
3. **Server-signed protocol flows**
   Example: current XLS-66 loan paths that depend on watcher-managed signing keys.
4. **Inconsistent frontend wiring**
   Example: direct `localhost:3001` calls, dead proxy routes, and UI that assumes the wrong response shape.

The result is an app that partially works, partially misrepresents what works, and is not easy to verify safely.

## Architecture Truth

### Why there is a backend today

The backend exists for concrete operational reasons, not because the product concept requires a backend in the abstract.

Current backend responsibilities:

- **Watcher automation**
  The watcher monitors on-chain price conditions and later submits follow-up XRPL transactions when those conditions are met.
- **Server-managed loan signing**
  The loan flow currently depends on server-held keys because the browser wallet path is not implemented as a fully browser-signable XLS-66 flow in this repo.
- **Order cache / runtime state**
  The watcher keeps tracked orders and DCA schedules in memory so it can react to future events.

### What "bypass" means here

"Bypass" means the frontend talks directly to the watcher process on `http://localhost:3001` instead of going through a single stable integration boundary in the app.

Current bypass behavior is harmful because it:

- couples components to local dev URLs
- makes deployment assumptions implicit
- creates inconsistent request/response handling
- hides which flows are app-mediated versus watcher-mediated

## Product Stance For This Stabilization Pass

The app should only expose flows that are internally coherent under the current architecture.

If a flow is materially misleading, this pass will not keep it alive just because a button exists. It will either:

- be fixed and verified end to end, or
- be disabled/hidden/removed from the active UX and documented for later redesign.

This applies especially to the current `BUY` advanced trading paths.

## Design

### 1. Watcher Integration Boundary

Create one clear frontend integration boundary for watcher-backed flows.

Principles:

- No component should call `http://localhost:3001` directly.
- Frontend components should call app-owned routes or helpers.
- Request and response normalization should happen once, not in every component.

Design direction:

- Keep the watcher as the source of truth for watcher-managed order state in this pass.
- Route watcher-backed frontend traffic through a consistent app-side interface.
- Normalize watcher responses into display models before rendering.

Expected outcome:

- `ActivePositions` stops assuming the watcher returns a flat array.
- Components no longer embed local watcher URLs directly.
- The repo has one obvious place to inspect watcher/frontend coupling.

### 2. Orders And Active Positions

`ActivePositions` becomes a truthful status surface instead of a partially broken dashboard table.

Required behavior:

- Read `{ orders, dcaSchedules }` correctly.
- Render watcher order fields using the real schema:
  - `orderType`
  - `escrowSequence`
  - `amount`
  - `status`
  - `triggerPrice`
  - `trailingPct`
  - `tpPrice`
  - `slPrice`
- Render DCA/TWAP schedules separately or as clearly labeled schedule rows.
- Expose cancel actions only where the system actually supports them.

Cancellation requirements:

- If watcher cancellation only removes local tracking, the UI must say so explicitly.
- If on-chain escrow cancellation is also available, it must be exposed as a distinct action.
- The user must not be misled into thinking watcher cache deletion equals on-chain fund recovery.

### 3. Trading Flows

The active trading surface must only contain flows whose asset model matches their execution path.

#### SELL-side advanced orders

These remain active if the audit confirms:

- the user escrows the asset that is later traded
- the watcher executes the expected on-chain transaction sequence
- proceeds are returned correctly
- the UI reflects the real behavior

#### BUY / short paths

These are currently not trustworthy because the app escrows XRP while the watcher execution path is structured as a USD-funded trade.

This pass treats them as unsupported under the current design.

Planned handling:

- remove them from the active UX, or
- disable them with explicit "not supported in current architecture" messaging

The choice should favor the cleanest production-facing surface with the least chance of user confusion.

#### DCA / TWAP

DCA/TWAP stays only for the coherent asset side.

This pass verifies:

- schedule registration
- watcher schedule display
- execution path consistency

If the side-specific asset model is inconsistent, the unsupported side is removed from the live UI.

### 4. Loans

The loans surface must reflect what users can really do now.

Required decisions:

- If `closeLoan` is meant to be a real user action, wire it into the UI and verify it.
- If `closeLoan` is not meant to be user-facing, remove it from the active frontend path and document it as deferred/admin-only.
- Remove dead proxy routes that have no current caller and no supported flow.

This pass does **not** attempt to solve the bigger question of whether loan operations should exist in a frontend-only deployment.

It only makes the current repo honest.

### 5. Wallet Connect Lifecycle

Wallet Connect remains supported, including profile-based disconnect from the web component.

This pass fixes lifecycle correctness:

- register wallet manager listeners once
- tear them down correctly
- ensure connector DOM listeners are removed on unmount
- keep connect, reconnect, and disconnect behavior stable

Expected outcome:

- no leaked listeners on remount
- cleaner hook semantics
- no change to intended user-facing wallet behavior

### 6. Tooling Baseline

Verification tooling must be trustworthy before the repo can be called production-ready.

Current issue:

- `build` passes
- `lint` is broken because installed Next.js and declared lint tooling are out of sync

This pass restores:

- a working `pnpm --filter web lint`
- consistent package declarations
- a clean documented verification path

Warnings that remain after the tooling fix must be intentional and reviewed, not accidental fallout from version skew.

## Verification Strategy

This repo currently needs layered verification rather than a single "tests pass" claim.

### Layer 1: Tooling

- `pnpm --filter web build`
- `pnpm --filter web lint`
- watcher source syntax checks

### Layer 2: Wiring Audit

For every active non-ZKP button:

- identify the component handler
- identify the hook or direct action
- identify the API or watcher boundary crossed
- identify the XRPL transaction type or watcher action
- confirm the path is complete

Any button without a complete and coherent path must be removed or disabled.

### Layer 3: Runtime Smoke Verification

Manual funded verification on WASM Devnet for the non-ZKP flows that remain active after stabilization.

Target runtime checks:

- wallet connect
- wallet reconnect
- profile disconnect
- direct payment
- vault deposit
- vault withdraw
- supported order creation
- watcher registration visibility
- cancellation behavior
- loan actions that remain in the UI

### Layer 4: Documentation Verification

- update docs to reflect the stabilized surface
- remove useless stale planning docs
- keep one current spec and one current implementation plan for this workstream

## Branch And Worktree Rules

This work must stay cleanly separated from the existing mixed audit changes.

Rules:

- Keep this design document committed independently from implementation work.
- Do not mix the spec and the later fix implementation into an unstructured branch history.
- Use a dedicated implementation branch or worktree after plan approval.
- Preserve the purpose of each branch:
  - audit/spec branch: findings, design, and cleanup context
  - implementation branch: actual fixes and verification
- Delete stale superseded planning Markdown when it no longer provides value.

## Documentation Cleanup Rules For This Workstream

- Keep `.md` files current or delete them.
- Do not accumulate speculative design notes once a final spec supersedes them.
- Do not keep dead planning docs that refer to removed flows.
- Any retained Markdown must describe the current repo truthfully.

## Follow-Up Backlog: Tackle Afterwards

These items are intentionally deferred beyond this stabilization pass.

### Frontend-only architecture review

- decide which flows can truly survive with frontend-only deployment
- identify which current backend dependencies are temporary versus structural

### Trading model redesign

- redesign or remove `BUY` / short advanced orders properly
- make escrowed assets and execution assets match by construction

### Loan architecture review

- decide whether loans stay server-assisted temporarily or leave the live app surface entirely
- revisit browser-signable XLS-66 support

### Watcher boundary redesign

- either formalize the watcher as an intentional service boundary
- or create a staged plan to remove it where possible

### ZKP / Boundless reintegration

- revisit only after the non-ZKP product surface is coherent and verified

### Automated verification maturity

- add durable automated coverage once the supported feature surface is stable

## Success Criteria

This pass is successful when:

- every active non-ZKP button has a complete, truthful, verified path
- `ActivePositions` shows real watcher state instead of dead placeholders
- direct watcher bypasses are removed from component code
- dead frontend/backend paths are either wired or deleted
- wallet listeners clean up correctly
- lint and build both work again
- documentation explains the current architecture clearly
- the repo no longer implies that unsupported flows are production-ready
