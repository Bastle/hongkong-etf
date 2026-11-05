<template>
  <div ref="containerRef" class="treemap-container">
    <MainCanvas
      v-if="layout"
      ref="mainCanvasRef"
      :leaves="layout.leaves"
      :sectors="layout.sectors"
      :width="width"
      :height="height"
      :southbound-map="southboundMap"
    />
    <HoverCanvas
      v-if="layout"
      :leaves="layout.leaves"
      :width="width"
      :height="height"
      @hover="onHover"
      @select="onSelect"
    />
    <div v-if="!layout" class="loading">加载中...</div>
    <div class="refresh-indicator">
      <span class="refresh-dot"></span>
    </div>
    <ScreenshotBtn v-if="mainCanvasRef" :canvas-ref="mainCanvasRef.canvasRef" />
    <KlinePopup
      v-show="showKline"
      :stock="selectedStock"
      :visible="showKline"
      :x="klineX"
      :y="klineY"
      :cached-data="selectedStock ? getCached(selectedStock.code) : null"
      @close="showKline = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { HKStockQuote, SectorData, SouthboundFlow } from '~/types/market'
import { useElementSize } from '@vueuse/core'
import { computeLayout, flattenLayout, getSectorRects } from '~/composables/useTreeMapLayout'
import { getTopStocks, isMobile, getMobileLimit } from '~/composables/useCanvasRender'
import { useKlinePrefetch } from '~/composables/useKlinePrefetch'
import type { TreeNode } from '~/types/market'

const props = defineProps<{
  sectors: SectorData[]
  marketFilter?: string
  southboundMap?: Map<string, SouthboundFlow>
  ahColorMap?: Map<string, string>
}>()

const containerRef = ref<HTMLDivElement>()
const mainCanvasRef = ref<InstanceType<any>>()
const { width, height } = useElementSize(containerRef)

// K 线预取
const { prefetch, getCached, prefetchSingle } = useKlinePrefetch()

// 按市场过滤后的 sectors
const filteredSectors = computed(() => {
  const filter = props.marketFilter || 'all'
  if (filter === 'all') return props.sectors
  return props.sectors
    .map(s => ({
      ...s,
      stocks: s.stocks.filter(stock => stock.board === filter),
    }))
    .filter(s => s.stocks.length > 0)
})

// 展平所有股票
const allStocks = computed(() => {
  return filteredSectors.value.flatMap(s => s.stocks)
})

// 渐进式渲染：先 Top 200，再全量
const displayStocks = ref<HKStockQuote[]>([])

watch(
  () => allStocks.value,
  (stocks) => {
    if (stocks.length === 0) return
    const limit = isMobile() ? getMobileLimit() : 200
    displayStocks.value = getTopStocks(stocks, limit)
  },
  { immediate: true },
)

// 渲染时批量预取所有展示股票的 K 线数据
watch(displayStocks, (stocks) => {
  if (stocks.length > 0) {
    prefetch(stocks.map(s => s.code))
  }
})

// 布局计算
const options = computed(() => ({
  width: width.value,
  height: height.value,
}))

const layout = computed(() => {
  if (displayStocks.value.length === 0 || width.value === 0 || height.value === 0) {
    return null
  }
  const root = computeLayout(displayStocks.value, filteredSectors.value, options.value)
  return {
    root,
    leaves: flattenLayout(root, undefined, props.ahColorMap),
    sectors: getSectorRects(root),
  }
})

// Hover 状态
function onHover(leaf: TreeNode | null, x: number, y: number) {
  if (leaf) {
    // 立即预取 K 线数据（不等防抖）
    prefetchSingle(leaf.data.code)

    // 统一信息面板：防抖 100ms 后显示（信息 + K 线合并）
    clearKlineDebounce()
    klineDebounceTimer = setTimeout(() => {
      selectedStock.value = leaf.data
      klineX.value = x
      klineY.value = y
      showKline.value = true
    }, 100)
  } else {
    clearKlineDebounce()
    showKline.value = false
  }
}

function clearKlineDebounce() {
  if (klineDebounceTimer) {
    clearTimeout(klineDebounceTimer)
    klineDebounceTimer = null
  }
}

// K-line 浮动面板状态
const selectedStock = ref<HKStockQuote | null>(null)
const showKline = ref(false)
const klineX = ref(0)
const klineY = ref(0)
let klineDebounceTimer: ReturnType<typeof setTimeout> | null = null

function onSelect(leaf: TreeNode | null) {
  if (leaf) {
    selectedStock.value = leaf.data
    showKline.value = true
  }
}
</script>

<style scoped>
.treemap-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  overflow: hidden;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #666;
  font-size: 16px;
}

.refresh-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
}

.refresh-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #30cc5a;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
