"use client";

import { useState, useEffect } from "react";
import { useVault } from "../hooks/useVault";
import { SHOWCASE_VAULTS } from "../lib/constants";

const STATUS_COLORS = {
  ready: "bg-green-500",
  active: "bg-amber-500",
  yield: "bg-blue-500",
};

const STATUS_LABELS = {
  ready: "READY",
  active: "ACTIVE",
  yield: "COMPLETE",
};

function formatXrp(drops) {
  return (drops / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function ShowcaseCard({ vault, info, loading, error }) {
  return (
    <div className="border border-white/20 bg-black/40 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/20 bg-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-white">
            {vault.name}
          </h3>
          <p className="text-[10px] font-mono text-white/40 mt-1">{vault.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/50">{STATUS_LABELS[vault.status]}</span>
          <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[vault.status]} animate-pulse`} />
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4 flex-1">
        {loading && (
          <div className="text-xs font-mono text-white/30 animate-pulse">Loading on-chain data...</div>
        )}
        {error && (
          <div className="text-xs font-mono text-red-400/70">Failed to fetch vault data</div>
        )}
        {info && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-mono text-white/40 uppercase">Total Assets</p>
                <p className="text-sm font-mono text-white">{formatXrp(info.totalAssets)} XRP</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-white/40 uppercase">Available</p>
                <p className="text-sm font-mono text-white">{formatXrp(info.assetsAvailable)} XRP</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-white/40 uppercase">Share Price</p>
                <p className={`text-sm font-mono ${info.sharePrice > 1 ? "text-green-400" : "text-white"}`}>
                  {info.sharePrice.toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-white/40 uppercase">Shares</p>
                <p className="text-sm font-mono text-white">{info.totalShares.toLocaleString()}</p>
              </div>
            </div>

            {info.lossUnrealized > 0 && (
              <div>
                <p className="text-[10px] font-mono text-white/40 uppercase">Unrealized Loss</p>
                <p className="text-sm font-mono text-red-400">{formatXrp(info.lossUnrealized)} XRP</p>
              </div>
            )}

            {/* Utilization bar for active vaults */}
            {info.totalAssets > 0 && (
              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-[10px] font-mono text-white/40 uppercase">Utilization</p>
                  <p className="text-[10px] font-mono text-white/60">
                    {((1 - info.assetsAvailable / info.totalAssets) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="h-1 bg-white/10 w-full">
                  <div
                    className="h-1 bg-white/60 transition-all duration-500"
                    style={{ width: `${(1 - info.assetsAvailable / info.totalAssets) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primitives footer */}
      <div className="p-3 border-t border-white/10 bg-white/[0.02]">
        <p className="text-[10px] font-mono text-white/30 uppercase mb-2">XLS-65/66 Primitives</p>
        <div className="flex flex-wrap gap-1">
          {vault.primitives.map((p) => (
            <span
              key={p}
              className="text-[9px] font-mono px-1.5 py-0.5 border border-white/15 text-white/50 bg-white/5"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LendingShowcase() {
  const { getVaultInfo } = useVault();
  const [vaultData, setVaultData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      const results = {};

      await Promise.allSettled(
        SHOWCASE_VAULTS.map(async (vault) => {
          if (!vault.id) return;
          try {
            const info = await getVaultInfo(vault.id);
            if (!cancelled) results[vault.id] = { info, error: null };
          } catch (err) {
            if (!cancelled) results[vault.id] = { info: null, error: err.message };
          }
        })
      );

      if (!cancelled) {
        setVaultData(results);
        setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [getVaultInfo]);

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-white/60">
          Lending Showcase
        </h2>
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[10px] font-mono text-white/30">LIVE ON-CHAIN DATA</span>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        {SHOWCASE_VAULTS.map((vault) => {
          const data = vaultData[vault.id];
          return (
            <ShowcaseCard
              key={vault.id || vault.name}
              vault={vault}
              info={data?.info || null}
              loading={loading && !data}
              error={data?.error || null}
            />
          );
        })}
      </div>
    </div>
  );
}
