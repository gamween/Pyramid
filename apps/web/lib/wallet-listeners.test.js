import test from "node:test"
import assert from "node:assert/strict"

import { registerDomEventListeners, registerManagerListeners } from "./wallet-listeners.js"

test("registerManagerListeners wires manager listeners and unregisters the same handlers on cleanup", () => {
  const calls = []
  const manager = {
    on(eventName, handler) {
      calls.push(["on", eventName, handler])
    },
    off(eventName, handler) {
      calls.push(["off", eventName, handler])
    },
  }
  const listeners = {
    connect() {},
    disconnect() {},
    error() {},
  }

  const cleanup = registerManagerListeners(manager, listeners)

  assert.deepEqual(
    calls.slice(0, 3).map(([action, eventName]) => [action, eventName]),
    [
      ["on", "connect"],
      ["on", "disconnect"],
      ["on", "error"],
    ]
  )

  cleanup()

  assert.deepEqual(
    calls.slice(3).map(([action, eventName]) => [action, eventName]),
    [
      ["off", "connect"],
      ["off", "disconnect"],
      ["off", "error"],
    ]
  )
  assert.equal(calls[0][2], calls[3][2])
  assert.equal(calls[1][2], calls[4][2])
  assert.equal(calls[2][2], calls[5][2])
})

test("registerDomEventListeners wires DOM listeners and unregisters the same handlers on cleanup", () => {
  const calls = []
  const element = {
    addEventListener(eventName, handler) {
      calls.push(["add", eventName, handler])
    },
    removeEventListener(eventName, handler) {
      calls.push(["remove", eventName, handler])
    },
  }
  const listeners = {
    connecting() {},
    connected() {},
    error() {},
  }

  const cleanup = registerDomEventListeners(element, listeners)

  assert.deepEqual(
    calls.slice(0, 3).map(([action, eventName]) => [action, eventName]),
    [
      ["add", "connecting"],
      ["add", "connected"],
      ["add", "error"],
    ]
  )

  cleanup()

  assert.deepEqual(
    calls.slice(3).map(([action, eventName]) => [action, eventName]),
    [
      ["remove", "connecting"],
      ["remove", "connected"],
      ["remove", "error"],
    ]
  )
  assert.equal(calls[0][2], calls[3][2])
  assert.equal(calls[1][2], calls[4][2])
  assert.equal(calls[2][2], calls[5][2])
})
