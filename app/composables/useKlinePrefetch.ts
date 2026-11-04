import { ref } from 'vue'

const $fetch = globalThis.$fetch

interface KlineItem {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// 模块级缓存，所有组件共享
const klineCache = new Map<string, KlineItem[]>()
const prefetching = new Set<string>()

/**
 * K 线数据预取 composable
 * - 页面加载后批量预取 Top N 股票的 K 线数据
 * - hover 时优先读客户端缓存，减少网络请求
 */
export function useKlinePrefetch() {
  /**
   * 批量预取 K 线数据（并发限制 5，避免触发限流）
   */
  async function prefetch(codes: string[]) {
    const uncached = codes.filter(c => !klineCache.has(c) && !prefetching.has(c))
    if (uncached.length === 0) return

    // 分批并发
    const batchSize = 5
    for (let i = 0; i < uncached.length; i += batchSize) {
      const batch = uncached.slice(i, i + batchSize)
      await Promise.allSettled(
        batch.map(code => fetchAndCache(code)),
      )
    }
  }

  async function fetchAndCache(code: string) {
    if (prefetching.has(code)) return
    prefetching.add(code)
    try {
      const res = await $fetch(`/api/market/kline?code=${code}`) as { data: KlineItem[] }
      if (res.data && res.data.length > 0) {
        klineCache.set(code, res.data)
      }
    } catch (e) {
      // 静默失败，预取是可选的
    } finally {
      prefetching.delete(code)
    }
  }

  /**
   * 获取单个股票的 K 线数据（优先缓存）
   */
  function getCached(code: string): KlineItem[] | null {
    return klineCache.get(code) || null
  }

  /**
   * 单独预取一个股票（hover 时使用）
   */
  function prefetchSingle(code: string) {
    if (!klineCache.has(code) && !prefetching.has(code)) {
      fetchAndCache(code)
    }
  }

  return {
    prefetch,
    getCached,
    prefetchSingle,
  }
}
