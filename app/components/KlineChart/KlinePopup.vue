<template>
  <Teleport to="body">
    <div v-show="visible" class="kline-float" :style="floatStyle">
      <div class="kline-header">
        <span class="kline-title">{{ name }} {{ code }}.HK</span>
        <span v-if="loading" class="kline-loading-dot"></span>
      </div>
      <div ref="chartContainer" class="kline-chart"></div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { computeTooltipPosition } from '~/composables/useTooltipPosition'

const $fetch = globalThis.$fetch

const props = defineProps<{
  code: string
  name: string
  visible: boolean
  x: number
  y: number
  cachedData?: any[] | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

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
  if (!props.code) return
  loading.value = true
  try {
    // 优先使用客户端预取缓存
    let data = props.cachedData
    if (!data || data.length === 0) {
      const res = await $fetch(`/api/market/kline?code=${props.code}`) as { data: any[] }
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

  // 复用已有图表实例
  if (chart) {
    chart.applyOptions({ width: chartContainer.value.clientWidth })
    return
  }

  chart = createChartFn(chartContainer.value, {
    width: chartContainer.value.clientWidth,
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

// visible 或 code 变化时：初始化图表 + 获取数据
watch([() => props.visible, () => props.code], async ([vis, code]) => {
  if (vis && code) {
    await chartsReady
    await nextTick()
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
