<template>
  <canvas
    ref="canvasRef"
    id="treemap"
    :width="width * dpr"
    :height="height * dpr"
    :style="{ width: width + 'px', height: height + 'px' }"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import type { TreeNode, SouthboundFlow } from '~/types/market'
import { drawTreemap, drawSectorLabels } from '~/composables/useCanvasRender'
import type { SectorRect } from '~/composables/useTreeMapLayout'

const props = defineProps<{
  leaves: TreeNode[]
  sectors?: SectorRect[]
  width: number
  height: number
  southboundMap?: Map<string, SouthboundFlow>
}>()

const canvasRef = ref<HTMLCanvasElement>()
const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

defineExpose({ canvasRef })

function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawTreemap(ctx, props.leaves, props.width, props.height, props.southboundMap)
  if (props.sectors && props.sectors.length > 0) {
    drawSectorLabels(ctx, props.sectors)
  }
}

onMounted(() => {
  render()
})

// Watch width/height changes (e.g., zoom)
watch(
  () => [props.width, props.height],
  () => {
    nextTick(() => {
      render()
    })
  },
)

// Watch leaves changes
watch(
  () => props.leaves,
  () => {
    nextTick(() => {
      render()
    })
  },
  { deep: true },
)

// Watch southboundMap changes
watch(
  () => props.southboundMap,
  () => {
    nextTick(() => {
      render()
    })
  },
)
</script>

<style scoped>
#treemap {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
</style>
