export function assertValidatedTransactionSuccess(result, transactionType) {
  if (result?.validated !== true) {
    throw new Error(`${transactionType} was not validated`)
  }

  const transactionResult = result?.meta?.TransactionResult ?? result?.engine_result
  if (transactionResult !== "tesSUCCESS") {
    throw new Error(`${transactionType} failed on-chain with ${transactionResult ?? "unknown result"}`)
  }

  return result
}
