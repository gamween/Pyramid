import test from "node:test"
import assert from "node:assert/strict"

import { APP_TABS, DEFAULT_APP_TAB } from "./app-shell.js"

test("DEFAULT_APP_TAB remains dashboard", () => {
  assert.equal(DEFAULT_APP_TAB, "dashboard")
})

test("APP_TABS exposes the exact tab values", () => {
  assert.deepEqual(
    APP_TABS.map((tab) => tab.value),
    ["dashboard", "lending", "loans", "trading"]
  )
})

test("APP_TABS exposes the exact tab labels", () => {
  assert.deepEqual(
    APP_TABS.map((tab) => tab.label),
    ["dashboard", "earn yield", "loans", "trading"]
  )
})
