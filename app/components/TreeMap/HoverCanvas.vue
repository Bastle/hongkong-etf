<template>
  <canvas
    ref="canvasRef"
    id="hover-map"
    :width="width * dpr"
    :height="height * dpr"
    :style="{ width: width + 'px', height: height + 'px' }"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    @dblclick="onDblClick"
  />
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { TreeNode } from '~/types/market'
import { findLeafAtPoint, drawHighlight } from '~/composables/useCanvasRender'

const props = defineProps<{
  leaves: TreeNode[]
  width: number
  height: number
}>()

const emit = defineEmits<{
  hover: [leaf: TreeNode | null, x: number, y: number]
  select: [leaf: TreeNode | null]
}>()

const canvasRef = ref<HTMLCanvasElement>()
const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
const currentLeaf = ref<TreeNode | null>(null)

function clearHighlight() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, props.width, props.height)
}

function onMouseMove(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const leaf = findLeafAtPoint(props.leaves, x, y)

  if (leaf !== currentLeaf.value) {
    currentLeaf.value = leaf
    clearHighlight()
    if (leaf) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        drawHighlight(ctx, leaf)
      }
    }
  }

  emit('hover', leaf, e.clientX, e.clientY)
}

function onMouseLeave() {
  currentLeaf.value = null
  clearHighlight()
  emit('hover', null, 0, 0)
}

function onDblClick(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const leaf = findLeafAtPoint(props.leaves, x, y)
  emit('select', leaf)
}

watch(
  () => [props.width, props.height],
  () => {
    nextTick(() => {
      clearHighlight()
      currentLeaf.value = null
    })
  },
)
</script>

<style scoped>
#hover-map {
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer;
}
</style>
