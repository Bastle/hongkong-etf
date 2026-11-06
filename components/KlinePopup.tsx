import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { HKStockQuote } from '@/types/market'
import { computeTooltipPosition } from '@/lib/tooltip-position'
import type { KlineItem } from '@/hooks/useKlinePrefetch'

interface KlinePopupProps {
  stock: HKStockQuote | null
  visible: boolean
  x: number
  y: number
  cachedData?: KlineItem[] | null
  onClose: () => void
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `${(cap / 1e12).toFixed(2)}万亿 HKD`
  if (cap >= 1e8) return `${(cap / 1e8).toFixed(1)}亿 HKD`
  return `${cap.toFixed(0)} HKD`
}

function formatAmount(amount: number): string {
  if (amount >= 1e12) return `${(amount / 1e12).toFixed(2)}万亿`
  if (amount >= 1e8) return `${(amount / 1e8).toFixed(1)}亿`
  if (amount >= 1e4) return `${(amount / 1e4).toFixed(0)}万`
  return amount.toFixed(0)
}

export default function KlinePopup({ stock, visible, x, y, cachedData, onClose }: KlinePopupProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const candleSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)
  const [loading, setLoading] = useState(false)

  // 浮动面板定位
  const floatStyle = useMemo(() => {
    const panelW = 320
    const panelH = 340
    if (typeof window === 'undefined') {
      return { left: `${x + 12}px`, top: `${y + 12}px` }
    }
    const pos = computeTooltipPosition(x, y, panelW, panelH, {
      width: window.innerWidth,
      height: window.innerHeight,
    })
    return { left: `${pos.x}px`, top: `${pos.y}px` }
  }, [x, y])

  // 初始化图表
  const initChart = useCallback(async () => {
    if (!chartContainerRef.current || chartRef.current) return

    const lc = await import('lightweight-charts')
    const container = chartContainerRef.current
    const chartWidth = container.clientWidth || 318

    const chart = lc.createChart(container, {
      width: chartWidth,
      height: 280,
      layout: {
        background: { color: '#1e1e2e' },
        textColor: '#999',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
      crosshair: { mode: 0 },
      timeScale: { borderColor: 'rgba(255,255,255,0.1)' },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
    })

    chartRef.current = chart

    candleSeriesRef.current = chart.addSeries(lc.CandlestickSeries, {
      upColor: '#f63538',
      downColor: '#30cc5a',
      borderUpColor: '#f63538',
      borderDownColor: '#30cc5a',
      wickUpColor: '#f63538',
      wickDownColor: '#30cc5a',
    })

    // 成交量副图
    volumeSeriesRef.current = chart.addSeries(lc.HistogramSeries, {
      priceScaleId: '',
      priceFormat: { type: 'volume' },
      color: '#666',
    })
    chart.priceScale('').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    // 浏览器 paint 后校正宽度
    requestAnimationFrame(() => {
      if (chartRef.current && chartContainerRef.current) {
        const w = chartContainerRef.current.clientWidth
        if (w > 0) chartRef.current.applyOptions({ width: w })
      }
    })
  }, [])

  // 获取数据
  const fetchData = useCallback(async () => {
    const code = stock?.code
    if (!code) return
    setLoading(true)
    try {
      let data = cachedData
      if (!data || data.length === 0) {
        const res = await fetch(`/api/market/kline?code=${code}`)
        const json = await res.json()
        data = json.data
      }
      if (candleSeriesRef.current && data && data.length > 0) {
        candleSeriesRef.current.setData(data.map((item: KlineItem) => ({
          time: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        })))
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(data.map((item: KlineItem) => ({
            time: item.date,
            value: item.volume,
            color: item.close >= item.open
              ? 'rgba(246, 53, 56, 0.5)'
              : 'rgba(48, 204, 90, 0.5)',
          })))
        }
        chartRef.current?.timeScale().fitContent()
      }
    } catch (e) {
      console.error('Failed to fetch kline:', e)
    } finally {
      setLoading(false)
    }
  }, [stock?.code, cachedData])

  // visible 或 stock 变化时初始化 + 获取数据
  useEffect(() => {
    if (!visible || !stock?.code) return

    let cancelled = false
    async function setup() {
      try {
        await initChart()
        if (!cancelled) await fetchData()
      } catch (e) {
        console.error('Failed to init kline chart:', e)
      }
    }
    setup()

    return () => { cancelled = true }
  }, [visible, stock?.code, initChart, fetchData])

  // 卸载时销毁图表
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        candleSeriesRef.current = null
        volumeSeriesRef.current = null
      }
    }
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      style={{
        ...floatStyle,
        display: visible && stock ? 'block' : 'none',
        position: 'fixed',
        zIndex: 1500,
        width: '320px',
        background: '#1e1e2e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '6px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-white/[0.08]">
        <span className="text-[#ccc] text-xs font-medium">
          {stock?.name} {stock?.code}.HK
        </span>
        {loading && (
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse"></span>
        )}
      </div>

      {/* Info */}
      {stock && (
        <div className="px-2.5 pt-2 pb-1.5 border-b border-white/[0.08]">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg font-semibold text-white">{stock.price.toFixed(2)}</span>
            <span className={`text-[13px] font-medium ${stock.changePercent >= 0 ? 'text-[#FF5252]' : 'text-[#69F0AE]'}`}>
              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </span>
          </div>
          <div className="flex gap-3 text-[11px] text-gray-400 leading-relaxed">
            <span>市值 {formatMarketCap(stock.marketCap)}</span>
            <span>每手 {stock.lotSize}股</span>
          </div>
          {stock.amount > 0 && (
            <div className="flex gap-3 text-[11px] text-gray-400 leading-relaxed">
              <span>成交额 {formatAmount(stock.amount)}</span>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div ref={chartContainerRef} style={{ width: '100%', height: '280px' }} />
    </div>,
    document.body
  )
}
