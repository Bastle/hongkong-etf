<template>
  <div class="heatmap-page">
    <IndexHeader :southbound="southboundData" />
    <div class="toolbar">
      <MarketSwitcher v-model="marketFilter" />
      <FilterBar
        v-model:stock-connect="stockConnectEnabled"
        :southbound="southboundEnabled"
        @update:southbound="toggleSouthbound"
        :ah-premium="ahPremiumEnabled"
        @update:ah-premium="toggleAHPremium"
      />
    </div>
    <TreeMap v-if="sectors.length > 0" :sectors="sectors" :market-filter="marketFilter" :southbound-map="southboundMap" :ah-color-map="ahColorMap" class="treemap-wrapper" />
    <div v-else-if="loading" class="loading">
      <div class="loading-text">港股热力图</div>
      <div class="loading-sub">正在加载数据...</div>
    </div>
    <div v-else class="error">
      <div>数据加载失败</div>
      <button @click="fetchData">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { SectorData } from '~/types/market'
import { useAutoRefresh } from '~/composables/useAutoRefresh'
import { useSouthbound } from '~/composables/useSouthbound'
import { useAHPremium } from '~/composables/useAHPremium'
import { getPremiumColor } from '~/utils/color'

const $fetch = globalThis.$fetch

const sectors = ref<SectorData[]>([])
const loading = ref(true)
const marketFilter = ref('all')
const stockConnectEnabled = ref(false)

const { formattedAggregate: southboundData, stockFlows, enabled: southboundEnabled, toggle: toggleSouthbound } = useSouthbound()
const { premiumMap, enabled: ahPremiumEnabled, toggle: toggleAHPremium } = useAHPremium()

// 构建南向资金 Map 用于热力图叠加
const southboundMap = computed(() => {
  if (!southboundEnabled.value) return undefined
  return stockFlows.value
})

// 构建 AH 溢价颜色 Map
const ahColorMap = computed(() => {
  if (!ahPremiumEnabled.value) return undefined
  const map = new Map<string, string>()
  for (const [code, premium] of premiumMap.value) {
    map.set(code, getPremiumColor(premium))
  }
  return map
})

async function fetchData() {
  try {
    loading.value = true
    const params: Record<string, string> = {}
    if (stockConnectEnabled.value) {
      params.stockConnect = 'true'
    }
    const data = await $fetch('/api/market/sectors', { params })
    sectors.value = data as SectorData[]
  } catch (e) {
    console.error('Failed to fetch sectors:', e)
  } finally {
    loading.value = false
  }
}

// 港股通切换时重新获取数据
watch(stockConnectEnabled, () => {
  fetchData()
})

const { start } = useAutoRefresh(fetchData)

onMounted(async () => {
  await fetchData()
  start()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #1a1a2e;
}

.heatmap-page {
  width: 100vw;
  height: 100vh;
  background: #1a1a2e;
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.treemap-wrapper {
  flex: 1;
  min-height: 0;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 4px 0;
}

.loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
}

.loading-text {
  font-size: 24px;
  font-weight: bold;
  color: #999;
  margin-bottom: 8px;
}

.loading-sub {
  font-size: 14px;
  color: #666;
}

.error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ff5252;
  gap: 16px;
}

.error button {
  padding: 8px 24px;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
}

.error button:hover {
  background: #444;
}
</style>
