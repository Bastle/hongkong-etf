import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { HKStockQuote } from '@/types/market'
import { computeTooltipPosition } from '@/lib/tooltip-position'
import type { KlineItem } from '@/hooks/useKlinePrefetch'
import IntradaySparkline from './IntradaySparkline'
import { useMarket } from '@/contexts/MarketContext'

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
  const { state } = useMarket()
  const colorMode = state.klineColorMode
  const [loading, setLoading] = useState(false)
  const klineDataRef = useRef<KlineItem[] | null>(null)

  // 浮动面板定位
  const floatStyle = useMemo(() => {
    const panelW = 440
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
    const chartWidth = container.clientWidth || 438

    const chart = lc.createChart(container, {
      width: chartWidth,
      height: 280,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#666',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(0,0,0,0.06)' },
        horzLines: { color: 'rgba(0,0,0,0.06)' },
      },
      crosshair: { mode: 0 },
      timeScale: {
        borderColor: 'rgba(0,0,0,0.1)',
        barSpacing: 5,
        tickMarkFormatter: (time: any) => {
          const d = typeof time === 'number'
            ? new Date(time * 1000)
            : new Date(time as string)
          if (isNaN(d.getTime())) return ''
          return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        },
      },
      rightPriceScale: { visible: false },
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
      scaleMargins: { top: 0.85, bottom: 0 },
    })

    // 浏览器 paint 后校正宽度
    requestAnimationFrame(() => {
      if (chartRef.current && chartContainerRef.current) {
        const w = chartContainerRef.current.clientWidth
        if (w > 0) chartRef.current.applyOptions({ width: w })
      }
    })
  }, [])

  // 根据颜色模式着色并设置数据
  const applyData = useCallback((data: KlineItem[], mode: 'open' | 'prevClose') => {
    if (!candleSeriesRef.current || !data || data.length === 0) return

    const UP = '#f63538'
    const DOWN = '#30cc5a'

    candleSeriesRef.current.setData(data.map((item: KlineItem, i: number) => {
      const ref = mode === 'open' ? item.open : (i > 0 ? data[i - 1].close : item.open)
      const isUp = item.close >= ref
      return {
        time: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        color: isUp ? UP : DOWN,
        borderColor: isUp ? UP : DOWN,
        wickColor: isUp ? UP : DOWN,
      }
    }))

    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(data.map((item: KlineItem, i: number) => {
        const ref = mode === 'open' ? item.open : (i > 0 ? data[i - 1].close : item.open)
        const isUp = item.close >= ref
        return {
          time: item.date,
          value: item.volume,
          color: isUp ? 'rgba(246, 53, 56, 0.35)' : 'rgba(0, 230, 118, 0.35)',
        }
      }))
    }

    chartRef.current?.timeScale().fitContent()
  }, [])

  // 获取数据
  const fetchData = useCallback(async () => {
    const code = stock?.code
    if (!code) return
    setLoading(true)

    // 立即清除旧数据，避免切换股票时残留
    if (candleSeriesRef.current) candleSeriesRef.current.setData([])
    if (volumeSeriesRef.current) volumeSeriesRef.current.setData([])
    klineDataRef.current = null

    try {
      let data = cachedData
      if (!data || data.length === 0) {
        const res = await fetch(`/api/market/kline?code=${code}`)
        const json = await res.json()
        data = json.data
      }
      if (data && data.length > 0) {
        klineDataRef.current = data
        applyData(data, colorMode)
      }
    } catch (e) {
      console.error('Failed to fetch kline:', e)
    } finally {
      setLoading(false)
    }
  }, [stock?.code, cachedData, colorMode, applyData])

  // 颜色模式切换时重新着色（不重新请求）
  useEffect(() => {
    if (klineDataRef.current && klineDataRef.current.length > 0) {
      applyData(klineDataRef.current, colorMode)
    }
  }, [colorMode, applyData])

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
        width: '440px',
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '6px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-black/[0.08]">
        <span className="text-gray-700 text-xs font-medium">
          {stock?.name} {stock?.code}.HK
        </span>
        {loading && (
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse"></span>
        )}
      </div>

      {/* Info + 分时缩略图 */}
      {stock && (
        <div className="px-2.5 pt-2 pb-1.5 border-b border-black/[0.08] flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-lg font-semibold text-gray-900">{stock.price.toFixed(2)}</span>
              <span className={`text-[13px] font-medium ${stock.changePercent >= 0 ? 'text-[#f63538]' : 'text-[#00e676]'}`}>
                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </span>
            </div>
            <div className="flex gap-3 text-[11px] text-gray-500 leading-relaxed">
              <span>市值 {formatMarketCap(stock.marketCap)}</span>
              <span>每手 {stock.lotSize}股</span>
            </div>
            {stock.amount > 0 && (
              <div className="flex gap-3 text-[11px] text-gray-500 leading-relaxed">
                <span>成交额 {formatAmount(stock.amount)}</span>
              </div>
            )}
          </div>
          <div style={{ flexShrink: 0, marginTop: 2 }}>
            <IntradaySparkline code={stock.code} prevClose={stock.prevClose} />
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ position: 'relative', width: '100%', height: '280px' }}>
        <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        {/* K 线与成交量分隔线 */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          top: '85%',
          height: '1px',
          background: 'rgba(0, 0, 0, 0.12)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>,
    document.body
  )
}
