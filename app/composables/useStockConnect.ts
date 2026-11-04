import { ref } from 'vue'

const enabled = ref(false)
const eligibleCodes = ref<Set<string>>(new Set())
const fetched = ref(false)

export function useStockConnect() {
  async function fetchEligibleCodes() {
    if (fetched.value) return
    try {
      const data = await $fetch('/api/market/stock-connect') as { codes: string[] }
      eligibleCodes.value = new Set(data.codes)
      fetched.value = true
    } catch (e) {
      console.error('Failed to fetch Stock Connect list:', e)
    }
  }

  function toggle() {
    enabled.value = !enabled.value
    if (enabled.value && !fetched.value) {
      fetchEligibleCodes()
    }
  }

  return {
    enabled,
    eligibleCodes,
    toggle,
    fetchEligibleCodes,
  }
}
