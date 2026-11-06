import { useState, useEffect, useCallback } from 'react'
import type { SectorData } from '@/types/market'
import { MarketProvider, useMarket } from '@/contexts/MarketContext'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import IndexHeader from '@/components/IndexHeader'
import MarketSwitcher from '@/components/MarketSwitcher'
import FilterBar from '@/components/FilterBar'
import TreeMap from '@/components/TreeMap'

function HomeContent() {
  const { state, dispatch, southboundMap, ahColorMap, formattedSouthbound } = useMarket()
  const [sectors, setSectors] = useState<SectorData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const params = state.stockConnectEnabled ? '?stockConnect=true' : ''
      const res = await fetch(`/api/market/sectors${params}`)
      const data = await res.json()
      setSectors(data)
      setError(null)
    } catch (e) {
      console.error('Failed to fetch sectors:', e)
      setError('数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [state.stockConnectEnabled])

  // 自动刷新 8s ± 2s
  const { start } = useAutoRefresh(fetchData)

  useEffect(() => {
    fetchData()
    start()
  }, [fetchData, start])

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden" style={{ background: '#1a1a2e' }}>
      {/* 顶部 Header */}
      <div className="flex-shrink-0 p-2">
        <IndexHeader southbound={formattedSouthbound} />
      </div>

      {/* 工具栏 */}
      <div className="flex-shrink-0 flex items-center gap-3 px-3 pb-2">
        <MarketSwitcher
          value={state.marketFilter}
          onChange={(v) => dispatch({ type: 'SET_FILTER', payload: v })}
        />
        <FilterBar
          stockConnect={state.stockConnectEnabled}
          southbound={state.southboundEnabled}
          ahPremium={state.ahEnabled}
          onToggleStockConnect={() => dispatch({ type: 'TOGGLE_STOCK_CONNECT' })}
          onToggleSouthbound={() => dispatch({ type: 'TOGGLE_SOUTHBOUND' })}
          onToggleAHPremium={() => dispatch({ type: 'TOGGLE_AH' })}
        />
      </div>

      {/* 热力图主体 */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">加载中...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-400 text-lg">{error}</p>
          </div>
        ) : (
          <TreeMap
            sectors={sectors}
            marketFilter={state.marketFilter}
            southboundMap={southboundMap}
            ahColorMap={ahColorMap}
          />
        )}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <MarketProvider>
      <HomeContent />
    </MarketProvider>
  )
}
