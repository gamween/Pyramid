import test from "node:test"
import assert from "node:assert/strict"

import { assertValidatedTransactionSuccess } from "./useEscrow.validation.js"

test("assertValidatedTransactionSuccess accepts validated tesSUCCESS results", () => {
  const result = {
    validated: true,
    meta: {
      TransactionResult: "tesSUCCESS",
    },
  }

  assert.equal(assertValidatedTransactionSuccess(result, "EscrowCancel"), result)
})

test("assertValidatedTransactionSuccess rejects unvalidated transactions", () => {
  assert.throws(() => {
    assertValidatedTransactionSuccess(
      {
        validated: false,
        meta: {
          TransactionResult: "tesSUCCESS",
        },
      },
      "EscrowCancel"
    )
  }, /EscrowCancel was not validated/)
})

test("assertValidatedTransactionSuccess rejects validated non-success transactions", () => {
  assert.throws(() => {
    assertValidatedTransactionSuccess(
      {
        validated: true,
        meta: {
          TransactionResult: "tecNO_TARGET",
        },
      },
      "EscrowCancel"
    )
  }, /EscrowCancel failed on-chain with tecNO_TARGET/)
})
