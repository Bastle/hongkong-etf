<template>
  <div class="index-header">
    <div v-for="item in indices" :key="item.code" class="index-item">
      <span class="index-name">{{ item.name }}</span>
      <span class="index-value">{{ formatValue(item.value) }}</span>
      <span :class="['index-change', item.changePercent >= 0 ? 'up' : 'down']">
        {{ item.changePercent >= 0 ? '+' : '' }}{{ item.changePercent.toFixed(2) }}%
      </span>
    </div>
    <div v-if="southbound && southbound.date" class="southbound-info">
      <span class="southbound-label">南向</span>
      <span class="southbound-buy">买入 {{ southbound.buy }}亿</span>
      <span class="southbound-sell">卖出 {{ southbound.sell }}亿</span>
      <span :class="['southbound-net', southbound.isNetIn ? 'inflow' : 'outflow']">
        净{{ southbound.isNetIn ? '流入' : '流出' }} {{ southbound.isNetIn ? '+' : '' }}{{ southbound.net }}亿
      </span>
    </div>
    <div v-if="timestamp" class="index-timestamp">
      更新于 {{ formatTime(timestamp) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import type { IndexData } from '~/types/market'

const $fetch = globalThis.$fetch

interface IndicesResponse {
  indices: IndexData[]
  timestamp: number
}

defineProps<{
  southbound?: {
    buy: string
    sell: string
    net: string
    isNetIn: boolean
    date: string
  } | null
}>()

const { data, refresh } = useAsyncData<IndicesResponse>(
  'indices',
  () => $fetch('/api/market/indices'),
  { default: () => ({ indices: [], timestamp: 0 }) },
)

const indices = computed(() => data.value?.indices ?? [])
const timestamp = computed(() => data.value?.timestamp ?? 0)

let timer: ReturnType<typeof setInterval> | null = null

function formatValue(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

onMounted(() => {
  timer = setInterval(() => refresh(), 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.index-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.index-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.index-name {
  color: #999;
  font-size: 13px;
}

.index-value {
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 500;
}

.index-change {
  font-size: 13px;
  font-weight: 500;
}

.up {
  color: #f63538;
}

.down {
  color: #30cc5a;
}

.southbound-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 12px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
}

.southbound-label {
  color: #666;
}

.southbound-buy {
  color: #999;
}

.southbound-sell {
  color: #999;
}

.southbound-net {
  font-weight: 500;
}

.southbound-net.inflow {
  color: #2196F3;
}

.southbound-net.outflow {
  color: #f63538;
}

.index-timestamp {
  margin-left: auto;
  color: #666;
  font-size: 12px;
}
</style>
