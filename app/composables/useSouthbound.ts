import { ref, computed } from 'vue'
import type { SouthboundAggregate, SouthboundFlow } from '~/types/market'

const $fetch = globalThis.$fetch

const aggregate = ref<SouthboundAggregate | null>(null)
const stockFlows = ref<Map<string, SouthboundFlow>>(new Map())
const enabled = ref(false)
let refreshTimer: ReturnType<typeof setInterval> | null = null

export function useSouthbound() {
  async function fetchData() {
    try {
      const data = await $fetch('/api/market/southbound') as {
        aggregate: SouthboundAggregate
        stocks: SouthboundFlow[]
      }
      aggregate.value = data.aggregate
      const map = new Map<string, SouthboundFlow>()
      for (const stock of data.stocks) {
        map.set(stock.code, stock)
      }
      stockFlows.value = map
    } catch (e) {
      console.error('Failed to fetch southbound data:', e)
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh()
    refreshTimer = setInterval(fetchData, 30 * 1000) // 30 秒刷新
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  async function toggle() {
    enabled.value = !enabled.value
    if (enabled.value) {
      await fetchData()
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  }

  const formattedAggregate = computed(() => {
    if (!aggregate.value) return null
    const agg = aggregate.value
    return {
      buy: (agg.buy / 1e8).toFixed(2),
      sell: (agg.sell / 1e8).toFixed(2),
      net: (agg.net / 1e8).toFixed(2),
      isNetIn: agg.net > 0,
      date: agg.date,
    }
  })

  return {
    aggregate,
    stockFlows,
    enabled,
    formattedAggregate,
    toggle,
    refresh: fetchData,
  }
}
