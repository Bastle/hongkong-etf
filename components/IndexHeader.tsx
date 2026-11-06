import { useState, useEffect } from 'react'
import type { IndexData } from '@/types/market'

interface IndicesResponse {
  indices: IndexData[]
  timestamp: number
}

interface IndexHeaderProps {
  southbound?: {
    buy: string
    sell: string
    net: string
    isNetIn: boolean
    date: string
  } | null
}

function formatValue(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function IndexHeader({ southbound }: IndexHeaderProps) {
  const [indices, setIndices] = useState<IndexData[]>([])
  const [timestamp, setTimestamp] = useState(0)

  useEffect(() => {
    async function fetchIndices() {
      try {
        const res = await fetch('/api/market/indices')
        const json: IndicesResponse = await res.json()
        setIndices(json.indices ?? [])
        setTimestamp(json.timestamp ?? 0)
      } catch (e) {
        console.error('Failed to fetch indices:', e)
      }
    }

    fetchIndices()
    const timer = setInterval(fetchIndices, 30000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center gap-6 px-3 py-2 bg-white/5 rounded-md flex-wrap flex-shrink-0">
      {indices.map(item => (
        <div key={item.code} className="flex items-baseline gap-2">
          <span className="text-[13px] text-gray-400">{item.name}</span>
          <span className="text-sm text-gray-200 font-medium">{formatValue(item.value)}</span>
          <span className={`text-[13px] font-medium ${item.changePercent >= 0 ? 'text-[#f63538]' : 'text-[#30cc5a]'}`}>
            {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
          </span>
        </div>
      ))}

      {southbound && southbound.date && (
        <div className="flex items-center gap-2 pl-3 border-l border-white/10 text-xs">
          <span className="text-gray-600">南向</span>
          <span className="text-gray-400">买入 {southbound.buy}亿</span>
          <span className="text-gray-400">卖出 {southbound.sell}亿</span>
          <span className={`font-medium ${southbound.isNetIn ? 'text-blue-400' : 'text-[#f63538]'}`}>
            净{southbound.isNetIn ? '流入' : '流出'} {southbound.isNetIn ? '+' : ''}{southbound.net}亿
          </span>
        </div>
      )}

      {timestamp > 0 && (
        <div className="ml-auto text-xs text-gray-600">
          更新于 {formatTime(timestamp)}
        </div>
      )}
    </div>
  )
}
