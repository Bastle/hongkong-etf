import { ref, computed } from 'vue'
import type { AHPremiumPair } from '~/types/market'

const $fetch = globalThis.$fetch

const pairs = ref<AHPremiumPair[]>([])
const enabled = ref(false)
const premiumMap = ref<Map<string, number>>(new Map())
let refreshTimer: ReturnType<typeof setInterval> | null = null

export function useAHPremium() {
  async function fetchData() {
    try {
      const data = await $fetch('/api/market/ah-premium') as { pairs: AHPremiumPair[] }
      pairs.value = data.pairs
      const map = new Map<string, number>()
      for (const pair of data.pairs) {
        map.set(pair.hkCode, pair.premium)
      }
      premiumMap.value = map
    } catch (e) {
      console.error('Failed to fetch AH premium:', e)
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh()
    refreshTimer = setInterval(fetchData, 30 * 1000)
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

  return {
    pairs,
    enabled,
    premiumMap,
    toggle,
    refresh: fetchData,
  }
}
