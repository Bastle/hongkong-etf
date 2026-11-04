<template>
  <div class="market-switcher">
    <button
      v-for="option in options"
      :key="option.value"
      :class="['switcher-btn', { active: modelValue === option.value }]"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const options = [
  { label: '全部', value: 'all' },
  { label: '主板', value: 'main' },
  { label: '创业板', value: 'gem' },
]
</script>

<style scoped>
.market-switcher {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.switcher-btn {
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  background: transparent;
  color: #999;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.switcher-btn:hover {
  color: #e0e0e0;
  border-color: rgba(255, 255, 255, 0.3);
}

.switcher-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}
</style>
