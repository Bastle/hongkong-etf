<template>
  <div
    v-if="visible && stock"
    class="tooltip"
    :style="{ left: x + 'px', top: y + 'px' }"
  >
    <div class="tooltip-header">
      <span class="tooltip-name">{{ stock.name }}</span>
      <span class="tooltip-code">{{ stock.code }}.HK</span>
    </div>
    <div class="tooltip-row">
      <span>现价</span>
      <span>{{ stock.price.toFixed(2) }}</span>
      <span :class="stock.changePercent >= 0 ? 'up' : 'down'">
        {{ stock.changePercent >= 0 ? '+' : '' }}{{ stock.changePercent.toFixed(2) }}%
      </span>
    </div>
    <div class="tooltip-row">
      <span>市值</span>
      <span>{{ formatMarketCap(stock.marketCap) }}</span>
    </div>
    <div class="tooltip-row">
      <span>每手</span>
      <span>{{ stock.lotSize }}股</span>
    </div>
    <div v-if="stock.amount > 0" class="tooltip-row">
      <span>成交额</span>
      <span>{{ formatAmount(stock.amount) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HKStockQuote } from '~/types/market'

defineProps<{
  stock: HKStockQuote | null
  visible: boolean
  x: number
  y: number
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
</script>

<style scoped>
.tooltip {
  position: fixed;
  z-index: 1000;
  background: rgba(30, 30, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 10px 14px;
  pointer-events: none;
  min-width: 180px;
  font-size: 13px;
  color: #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tooltip-name {
  font-weight: bold;
  font-size: 14px;
  color: #fff;
}

.tooltip-code {
  color: #999;
  font-size: 12px;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
}

.tooltip-row span:first-child {
  color: #999;
}

.tooltip-row span:last-child {
  font-weight: 500;
}

.up {
  color: #FF5252;
}

.down {
  color: #69F0AE;
}
</style>
