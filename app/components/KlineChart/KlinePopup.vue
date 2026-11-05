<template>
  <Teleport to="body">
    <div v-show="visible && stock" class="kline-float" :style="floatStyle">
      <div class="kline-header">
        <span class="kline-title">{{ stock?.name }} {{ stock?.code }}.HK</span>
        <span v-if="loading" class="kline-loading-dot"></span>
      </div>
      <div v-if="stock" class="kline-info">
        <div class="kline-price-row">
          <span class="kline-price">{{ stock.price.toFixed(2) }}</span>
          <span :class="stock.changePercent >= 0 ? 'up' : 'down'">
            {{ stock.changePercent >= 0 ? '+' : '' }}{{ stock.changePercent.toFixed(2) }}%
          </span>
        </div>
        <div class="kline-stats">
          <span>市值 {{ formatMarketCap(stock.marketCap) }}</span>
          <span>每手 {{ stock.lotSize }}股</span>
        </div>
        <div v-if="stock.amount > 0" class="kline-stats">
          <span>成交额 {{ formatAmount(stock.amount) }}</span>
        </div>
      </div>
      <div ref="chartContainer" class="kline-chart"></div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { HKStockQuote } from '~/types/market'
import { computeTooltipPosition } from '~/composables/useTooltipPosition'

const $fetch = globalThis.$fetch

const props = defineProps<{
  stock: HKStockQuote | null
  visible: boolean
  x: number
  y: number
  cachedData?: any[] | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `${(cap / 1e12).toFixed(2)}万亿 HKD`
  if (cap >= 1e8) return `${(cap / 1e8).toFixed(1)}亿 HKD`
  return `${cap.toFixed(0)} HKD`
}

function formatAmount(amount: number): string {
  if (amount >= 1e12) return `${(amount / 1e12).toFixed(2)}万亿`
  if (amount >= 1e8) return `${(amount / 1e8).toFixed(1)}亿`
  if (amount >= 1e4) return `${(amount / 1e4).toFixed(0)}万`
  return amount.toFixed(0)
}

const chartContainer = ref<HTMLDivElement>()
const loading = ref(false)
let chart: any = null
let candleSeries: any = null
let createChartFn: any = null
let CandlestickSeriesDef: any = null
let initDone = false

// 浮动面板定位：确保不超出视口（V-04: 统一使用 computeTooltipPosition）
const floatStyle = computed(() => {
  const panelW = 320
  const panelH = 260
  if (typeof window === 'undefined') {
    return { left: `${props.x + 12}px`, top: `${props.y + 12}px` }
  }
  const pos = computeTooltipPosition(props.x, props.y, panelW, panelH, {
    width: window.innerWidth,
    height: window.innerHeight,
  })
  return { left: `${pos.x}px`, top: `${pos.y}px` }
})

async function fetchData() {
  const code = props.stock?.code
  if (!code) return
  loading.value = true
  try {
    // 优先使用客户端预取缓存
    let data = props.cachedData
    if (!data || data.length === 0) {
      const res = await $fetch(`/api/market/kline?code=${code}`) as { data: any[] }
      data = res.data
    }
    if (candleSeries && data && data.length > 0) {
      const formatted = data.map((item: any) => ({
        time: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }))
      candleSeries.setData(formatted)
      chart?.timeScale().fitContent()
    }
  } catch (e) {
    console.error('Failed to fetch kline:', e)
  } finally {
    loading.value = false
  }
}

function initChart() {
  if (!chartContainer.value || !createChartFn) return

  // 宽度兜底：v-show 切换瞬间 clientWidth 可能为 0
  const chartWidth = chartContainer.value.clientWidth || 318

  // 复用已有图表实例
  if (chart) {
    chart.applyOptions({ width: chartWidth })
    return
  }

  chart = createChartFn(chartContainer.value, {
    width: chartWidth,
    height: 200,
    layout: {
      background: { color: '#1e1e2e' },
      textColor: '#999',
    },
    grid: {
      vertLines: { color: 'rgba(255,255,255,0.05)' },
      horzLines: { color: 'rgba(255,255,255,0.05)' },
    },
    crosshair: { mode: 0 },
    timeScale: { borderColor: 'rgba(255,255,255,0.1)' },
    rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
  })

  candleSeries = chart.addSeries(CandlestickSeriesDef, {
    upColor: '#f63538',
    downColor: '#30cc5a',
    borderUpColor: '#f63538',
    borderDownColor: '#30cc5a',
    wickUpColor: '#f63538',
    wickDownColor: '#30cc5a',
  })

  // 浏览器 paint 后校正宽度（防 v-show 延迟导致宽度为 0）
  requestAnimationFrame(() => {
    if (chart && chartContainer.value) {
      const w = chartContainer.value.clientWidth
      if (w > 0) chart.applyOptions({ width: w })
    }
  })

  initDone = true
}

onUnmounted(() => {
  if (chart) {
    chart.remove()
    chart = null
  }
})

// 模块级预加载：页面加载即开始下载 lightweight-charts
const chartsReady = (async () => {
  if (!createChartFn) {
    const lc = await import('lightweight-charts')
    createChartFn = lc.createChart
    CandlestickSeriesDef = lc.CandlestickSeries
  }
})()

// visible 或 stock 变化时：初始化图表 + 获取数据
watch([() => props.visible, () => props.stock?.code], async ([vis, code]) => {
  if (vis && code) {
    try {
      await chartsReady
    } catch (e) {
      console.error('Failed to load lightweight-charts:', e)
      return
    }
    await nextTick()
    // 等一帧确保 v-show 切换后浏览器已 paint
    await new Promise(r => requestAnimationFrame(r))
    initChart()
    await fetchData()
  }
})
</script>

<style scoped>
.kline-float {
  position: fixed;
  z-index: 1500;
  width: 320px;
  background: #1e1e2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  overflow: hidden;
}

.kline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.kline-title {
  color: #ccc;
  font-size: 12px;
  font-weight: 500;
}

.kline-info {
  padding: 8px 10px 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.kline-price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.kline-price {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.kline-price-row .up {
  color: #FF5252;
  font-size: 13px;
  font-weight: 500;
}

.kline-price-row .down {
  color: #69F0AE;
  font-size: 13px;
  font-weight: 500;
}

.kline-stats {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #999;
  line-height: 1.6;
}

.kline-loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #666;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.kline-chart {
  width: 100%;
  height: 200px;
}
</style>
