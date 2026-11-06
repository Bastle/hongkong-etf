import { useCallback, useRef } from 'react'

export interface KlineItem {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// 模块级缓存（跨组件共享）
const klineCache = new Map<string, KlineItem[]>()
const prefetching = new Set<string>()
const CONCURRENCY_LIMIT = 5

async function fetchKline(code: string): Promise<KlineItem[]> {
  const res = await fetch(`/api/market/kline?code=${code}`)
  const json = await res.json()
  return json.data ?? []
}

export function useKlinePrefetch() {
  const prefetch = useCallback(async (codes: string[]) => {
    const toFetch = codes.filter(c => !klineCache.has(c) && !prefetching.has(c))
    if (toFetch.length === 0) return

    // 分批并发
    for (let i = 0; i < toFetch.length; i += CONCURRENCY_LIMIT) {
      const batch = toFetch.slice(i, i + CONCURRENCY_LIMIT)
      batch.forEach(c => prefetching.add(c))
      await Promise.allSettled(
        batch.map(async (code) => {
          try {
            const data = await fetchKline(code)
            if (data.length > 0) klineCache.set(code, data)
          } catch {
            // 静默失败
          } finally {
            prefetching.delete(code)
          }
        })
      )
    }
  }, [])

  const prefetchSingle = useCallback((code: string) => {
    if (klineCache.has(code) || prefetching.has(code)) return
    prefetching.add(code)
    fetchKline(code)
      .then(data => {
        if (data.length > 0) klineCache.set(code, data)
      })
      .catch(() => {})
      .finally(() => prefetching.delete(code))
  }, [])

  const getCached = useCallback((code: string): KlineItem[] | null => {
    return klineCache.get(code) ?? null
  }, [])

  return { prefetch, prefetchSingle, getCached }
}
