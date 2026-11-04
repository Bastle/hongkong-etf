<template>
  <div class="filter-bar">
    <button
      :class="['filter-btn', { active: stockConnect }]"
      @click="$emit('update:stockConnect', !stockConnect)"
    >
      港股通标的
    </button>
    <button
      :class="['filter-btn', { active: southbound }]"
      @click="$emit('update:southbound', !southbound)"
    >
      南向资金
    </button>
    <button
      :class="['filter-btn', { active: ahPremium }]"
      @click="$emit('update:ahPremium', !ahPremium)"
    >
      AH溢价
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stockConnect: boolean
  southbound: boolean
  ahPremium: boolean
}>()

defineEmits<{
  'update:stockConnect': [value: boolean]
  'update:southbound': [value: boolean]
  'update:ahPremium': [value: boolean]
}>()
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.filter-btn {
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  background: transparent;
  color: #999;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  color: #e0e0e0;
  border-color: rgba(255, 255, 255, 0.3);
}

.filter-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}
</style>
