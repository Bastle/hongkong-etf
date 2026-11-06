import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import type { HKStockQuote, SectorData, TreeNode, SouthboundFlow } from '@/types/market'
import { useElementSize } from '@/hooks/useElementSize'
import { computeLayout, flattenLayout, getSectorRects } from '@/lib/treemap-layout'
import { getTopStocks, isMobile, getMobileLimit } from '@/lib/canvas-render'
import { useKlinePrefetch } from '@/hooks/useKlinePrefetch'
import MainCanvas from './MainCanvas'
import HoverCanvas from './HoverCanvas'
import KlinePopup from '@/components/KlinePopup'
import ScreenshotBtn from '@/components/ScreenshotBtn'

interface TreeMapProps {
  sectors: SectorData[]
  marketFilter?: string
  southboundMap?: Map<string, SouthboundFlow>
  ahColorMap?: Map<string, string>
}

export default function TreeMap({ sectors, marketFilter, southboundMap, ahColorMap }: TreeMapProps) {
  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>()
  const mainCanvasRef = useRef<HTMLCanvasElement>(null)
  const { prefetch, getCached, prefetchSingle } = useKlinePrefetch()

  // K-line 弹窗状态
  const [selectedStock, setSelectedStock] = useState<HKStockQuote | null>(null)
  const [showKline, setShowKline] = useState(false)
  const [klineX, setKlineX] = useState(0)
  const [klineY, setKlineY] = useState(0)
  const hoverDebounceRef = useRef<ReturnType<typeof setTimeout>>()

  // 按市场过滤
  const filteredSectors = useMemo(() => {
    const filter = marketFilter || 'all'
    if (filter === 'all') return sectors
    return sectors
      .map(s => ({
        ...s,
        stocks: s.stocks.filter(stock => stock.board === filter),
      }))
      .filter(s => s.stocks.length > 0)
  }, [sectors, marketFilter])

  // 展平所有股票
  const allStocks = useMemo(() => {
    return filteredSectors.flatMap(s => s.stocks)
  }, [filteredSectors])

  // 渐进式渲染：先 Top 200
  const displayStocks = useMemo(() => {
    if (allStocks.length === 0) return []
    const limit = isMobile() ? getMobileLimit() : 200
    return getTopStocks(allStocks, limit)
  }, [allStocks])

  // 批量预取 K 线
  useEffect(() => {
    if (displayStocks.length > 0) {
      prefetch(displayStocks.map(s => s.code))
    }
  }, [displayStocks, prefetch])

  // 布局计算
  const layout = useMemo(() => {
    if (displayStocks.length === 0 || width === 0 || height === 0) return null
    const root = computeLayout(displayStocks, filteredSectors, { width, height })
    return {
      root,
      leaves: flattenLayout(root, undefined, ahColorMap),
      sectors: getSectorRects(root),
    }
  }, [displayStocks, filteredSectors, width, height, ahColorMap])

  // Hover 处理
  const handleHover = useCallback((leaf: TreeNode | null, x: number, y: number) => {
    if (leaf) {
      prefetchSingle(leaf.data.code)
      if (hoverDebounceRef.current) clearTimeout(hoverDebounceRef.current)
      hoverDebounceRef.current = setTimeout(() => {
        setSelectedStock(leaf.data)
        setKlineX(x)
        setKlineY(y)
        setShowKline(true)
      }, 100)
    } else {
      if (hoverDebounceRef.current) clearTimeout(hoverDebounceRef.current)
      setShowKline(false)
    }
  }, [prefetchSingle])

  const handleSelect = useCallback((leaf: TreeNode | null) => {
    if (leaf) {
      setSelectedStock(leaf.data)
      setShowKline(true)
    }
  }, [])

  // 清理 debounce
  useEffect(() => {
    return () => {
      if (hoverDebounceRef.current) clearTimeout(hoverDebounceRef.current)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: '#1a1a2e' }}>
      {layout ? (
        <>
          <MainCanvas
            ref={mainCanvasRef}
            leaves={layout.leaves}
            sectors={layout.sectors}
            width={width}
            height={height}
            southboundMap={southboundMap}
          />
          <HoverCanvas
            leaves={layout.leaves}
            width={width}
            height={height}
            onHover={handleHover}
            onSelect={handleSelect}
          />
        </>
      ) : (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-500 text-base">
          加载中...
        </div>
      )}

      {/* 刷新指示器 */}
      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
      </div>

      {/* 截图按钮 */}
      {layout && <ScreenshotBtn canvasRef={mainCanvasRef} />}

      {/* K 线弹窗 */}
      <KlinePopup
        stock={selectedStock}
        visible={showKline}
        x={klineX}
        y={klineY}
        cachedData={selectedStock ? getCached(selectedStock.code) : null}
        onClose={() => setShowKline(false)}
      />
    </div>
  )
}
