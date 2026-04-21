"use client"

import { useEffect, useRef } from "react"
import { CandlestickSeries, ColorType, CrosshairMode, createChart } from "lightweight-charts"

export function TradingChart({ candles }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return undefined

    const chart = createChart(containerRef.current, {
      autoSize: true,
      height: 320,
      layout: {
        background: {
          type: ColorType.Solid,
          color: "transparent",
        },
        textColor: "#cfcaa0",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.06)" },
        horzLines: { color: "rgba(255, 255, 255, 0.06)" },
      },
      crosshair: {
        mode: CrosshairMode.MagnetOHLC,
        vertLine: { color: "rgba(230, 237, 1, 0.2)" },
        horzLine: { color: "rgba(230, 237, 1, 0.2)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    })
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#e6ed01",
      borderUpColor: "#e6ed01",
      wickUpColor: "#e6ed01",
      downColor: "#f0b2a8",
      borderDownColor: "#f0b2a8",
      wickDownColor: "#f0b2a8",
      priceLineVisible: true,
      lastValueVisible: true,
    })

    chartRef.current = chart
    seriesRef.current = series

    const resizeObserver = new ResizeObserver(() => {
      chart.timeScale().fitContent()
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      seriesRef.current = null
      chartRef.current?.remove()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return

    seriesRef.current.setData(candles)
    chartRef.current.timeScale().fitContent()
  }, [candles])

  return (
    <div className="relative overflow-hidden border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]">
      <div ref={containerRef} className="h-[320px] w-full" />
      {candles.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-[#9c9671]">
          No candle data available.
        </div>
      ) : null}
    </div>
  )
}
