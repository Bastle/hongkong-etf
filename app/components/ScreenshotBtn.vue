<template>
  <button class="screenshot-btn" @click="takeScreenshot" title="截图下载">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  canvasRef: HTMLCanvasElement | null
}>()

function takeScreenshot() {
  if (!props.canvasRef) return

  const dataUrl = props.canvasRef.toDataURL('image/png')
  const link = document.createElement('a')
  const now = new Date()
  const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-')
  link.download = `hk-stock-heatmap-${timestamp}.png`
  link.href = dataUrl
  link.click()
}
</script>

<style scoped>
.screenshot-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  background: transparent;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
}

.screenshot-btn:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.05);
}
</style>
