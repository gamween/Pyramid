"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Activity, AlertTriangle, ArrowRight, Database, Lock } from "lucide-react"

import { useVault } from "@/hooks/useVault"
import { useEscrow } from "@/hooks/useEscrow"
import { normalizeWatcherState } from "@/lib/order-state"
import { ADDRESSES } from "@/lib/constants"

import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

function getStatusClasses(status) {
  if (status === "ACTIVE") return "bg-emerald-500/20 text-emerald-300"
  if (status === "CANCELLED") return "bg-rose-500/20 text-rose-300"
  return "bg-slate-500/20 text-slate-300"
}

export function ActivePositions() {
  const { getVaultInfo } = useVault()
  const { cancelEscrow } = useEscrow()

  const [watcherState, setWatcherState] = useState({ orders: [], schedules: [] })
  const [vaults, setVaults] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [vaultsLoading, setVaultsLoading] = useState(true)
  const [ordersError, setOrdersError] = useState("")
  const [actionKey, setActionKey] = useState("")
  const fetchRequestIdRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchOrders = useCallback(async ({ signal } = {}) => {
    const requestId = ++fetchRequestIdRef.current

    try {
      const response = await fetch("/api/orders", { signal })
      if (!response.ok) {
        throw new Error(`Orders request failed with ${response.status}`)
      }

      const data = await response.json()
      if (!isMountedRef.current || signal?.aborted || requestId !== fetchRequestIdRef.current) {
        return
      }

      setWatcherState(normalizeWatcherState(data))
      setOrdersError("")
    } catch (error) {
      if (error?.name === "AbortError") return
      if (!isMountedRef.current || requestId !== fetchRequestIdRef.current) {
        return
      }

      setWatcherState({ orders: [], schedules: [] })
      setOrdersError("Watcher data unavailable")
    } finally {
      if (isMountedRef.current && !signal?.aborted && requestId === fetchRequestIdRef.current) {
        setOrdersLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    fetchOrders({ signal: controller.signal })

    const interval = setInterval(() => {
      fetchOrders()
    }, 10000)

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [fetchOrders])

  useEffect(() => {
    let cancelled = false

    async function fetchVault() {
      try {
        const info = await getVaultInfo(ADDRESSES.VAULT_ID)
        if (!cancelled) {
          setVaults([
            {
              id: ADDRESSES.VAULT_ID.slice(0, 8),
              asset: "XRP",
              supplied: Number((info.totalAssets / 1_000_000).toFixed(0)).toLocaleString(),
              mptBalance: info.totalShares != null ? `${Number(info.totalShares).toLocaleString()} shares` : "—",
              apy: info.sharePrice != null ? `${((info.sharePrice - 1) * 100).toFixed(2)}%` : "—",
            },
          ])
        }
      } catch {
        // leave vaults empty
      } finally {
        if (!cancelled) setVaultsLoading(false)
      }
    }

    fetchVault()
    return () => {
      cancelled = true
    }
  }, [getVaultInfo])

  const trackedItems = [...watcherState.orders, ...watcherState.schedules]

  const removeTrackedOrder = useCallback(async (owner, sequence, message) => {
    const response = await fetch(`/api/orders/${owner}/${sequence}`, { method: "DELETE" })
    if (!response.ok) {
      throw new Error(`Stop tracking failed with ${response.status}`)
    }
    const data = await response.json()
    if (data?.status !== "ok") {
      throw new Error(message)
    }
  }, [])

  async function handleStopTracking(owner, sequence) {
    const nextActionKey = `stop:${owner}:${sequence}`
    setActionKey(nextActionKey)

    try {
      await removeTrackedOrder(owner, sequence, "Tracked order was not removed")
      await fetchOrders()
    } catch (error) {
      setOrdersError(error instanceof Error ? error.message : "Unable to stop tracking order")
    } finally {
      setActionKey("")
    }
  }

  async function handleCancelEscrow(owner, sequence) {
    const nextActionKey = `cancel:${owner}:${sequence}`
    setActionKey(nextActionKey)

    try {
      await cancelEscrow(owner, sequence)
      await removeTrackedOrder(owner, sequence, "Tracked order was not removed after on-chain cancel")
      await fetchOrders()
    } catch (error) {
      setOrdersError(error instanceof Error ? error.message : "Unable to cancel escrow on-chain")
    } finally {
      setActionKey("")
    }
  }

  return (
    <div className="border border-white/20 bg-black/40 backdrop-blur-xl mt-6">
      <div className="p-4 border-b border-white/20 bg-white/5 flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Active Positions & History
        </h2>
        <span className="text-[10px] font-mono text-white/50 bg-white/10 px-2 py-1">LIVE SYNC</span>
      </div>

      <div className="p-4">
        <Tabs defaultValue="escrows" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6 rounded-none bg-transparent border border-white/20 p-0 h-auto">
            <TabsTrigger value="escrows" className="rounded-none border-r border-transparent data-[state=active]:border-white/20 data-[state=active]:bg-white data-[state=active]:text-black py-2 text-xs font-mono uppercase tracking-widest">
              Tracked Orders & Schedules ({trackedItems.length})
            </TabsTrigger>
            <TabsTrigger value="vaults" className="rounded-none border-r border-transparent data-[state=active]:border-white/20 data-[state=active]:bg-white data-[state=active]:text-black py-2 text-xs font-mono uppercase tracking-widest">
              Vaults (XLS-65) ({vaultsLoading ? "…" : vaults.length})
            </TabsTrigger>
            <TabsTrigger value="loans" className="rounded-none border-transparent data-[state=active]:border-white/20 data-[state=active]:bg-white data-[state=active]:text-black py-2 text-xs font-mono uppercase tracking-widest">
              Loans (XLS-66)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="escrows" className="animate-in fade-in duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono text-left border-collapse">
                <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="p-3 border-b border-white/20 font-normal">ID / Type</th>
                    <th className="p-3 border-b border-white/20 font-normal">Tracking</th>
                    <th className="p-3 border-b border-white/20 font-normal">Amount</th>
                    <th className="p-3 border-b border-white/20 font-normal">Trigger (Condition)</th>
                    <th className="p-3 border-b border-white/20 font-normal">Status</th>
                    <th className="p-3 border-b border-white/20 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trackedItems.map((item) => {
                    const hasOwnerSequence = item.owner && item.sequence != null
                    const canStopTracking = hasOwnerSequence && item.canStopTracking
                    const canCancelEscrow = hasOwnerSequence && item.canCancelEscrow
                    const stopKey = `stop:${item.owner}:${item.sequence}`
                    const cancelKey = `cancel:${item.owner}:${item.sequence}`

                    return (
                      <tr key={item.id} className="border-b border-white/10 hover:bg-white/5 transition-colors text-white align-top">
                        <td className="p-3">
                          <div className="font-bold">{item.sequence ?? item.id}</div>
                          <div className="text-[10px] text-slate-500">{item.type}</div>
                        </td>
                        <td className="p-3 text-slate-300">
                          {item.kind === "schedule" ? "DCA schedule" : "Tracked order"}
                        </td>
                        <td className="p-3">{item.amountLabel ?? "—"}</td>
                        <td className="p-3 text-amber-400 text-xs">
                          <div className="flex items-center gap-1 mt-1">
                            <Lock className="h-3 w-3" />
                            <span>{item.trigger}</span>
                          </div>
                          {item.progress ? (
                            <div className="mt-1 text-[10px] text-slate-500">{item.progress}</div>
                          ) : null}
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] px-2 py-1 ${getStatusClasses(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {canStopTracking || canCancelEscrow ? (
                            <div className="flex flex-col items-end gap-2">
                              {canStopTracking ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="rounded-none border-white/20 bg-transparent text-white hover:bg-white hover:text-black"
                                  disabled={actionKey !== "" || ordersLoading}
                                  onClick={() => handleStopTracking(item.owner, item.sequence)}
                                >
                                  {actionKey === stopKey ? "Stopping..." : "Stop Tracking"}
                                </Button>
                              ) : null}
                              {canCancelEscrow ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="rounded-none border-amber-400/40 bg-transparent text-amber-300 hover:bg-amber-300 hover:text-black"
                                  disabled={actionKey !== "" || ordersLoading}
                                  onClick={() => handleCancelEscrow(item.owner, item.sequence)}
                                >
                                  {actionKey === cancelKey ? "Cancelling..." : "Cancel Escrow On-Chain"}
                                </Button>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 uppercase">No actions</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {ordersLoading ? (
                <div className="text-center py-8 text-slate-500 font-mono text-xs uppercase">Loading tracked positions...</div>
              ) : null}

              {!ordersLoading && trackedItems.length === 0 ? (
                <div className="text-center py-8 text-slate-500 font-mono text-xs uppercase">No tracked orders or schedules found.</div>
              ) : null}

              {ordersError ? (
                <div className="text-center py-4 text-rose-300 font-mono text-xs uppercase">{ordersError}</div>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="vaults" className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vaults.map((vault, idx) => (
                <Card key={idx} className="border border-white/20 bg-black rounded-none">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-green-400" />
                        <span className="text-white font-mono font-bold">{vault.asset} Vault</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{vault.id}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 font-mono text-sm mb-4">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Supplied</p>
                        <p className="text-white">{vault.supplied}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">APY</p>
                        <p className="text-green-400 font-bold">{vault.apy}</p>
                      </div>
                    </div>
                    <div className="bg-white/5 p-2 flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400">MPT Balance</span>
                      <span className="text-white flex items-center gap-2">
                        {vault.mptBalance}
                        <ArrowRight className="h-3 w-3 text-slate-500" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="loans" className="animate-in fade-in duration-500">
            <div className="border border-white/10 bg-white/5 p-6 text-center">
              <AlertTriangle className="h-5 w-5 text-amber-400 mx-auto mb-3" />
              <p className="text-sm font-mono text-slate-300 mb-2">
                XLS-66 does not expose an <code className="text-amber-400">account_loans</code> RPC method.
              </p>
              <p className="text-xs font-mono text-slate-500 max-w-md mx-auto">
                Loan positions are tracked server-side by the watcher bot.
                Contact the protocol admin or check the watcher logs for your loan status.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
