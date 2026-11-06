import { useRef, useEffect, useCallback } from 'react'
import type { TreeNode } from '@/types/market'
import { findLeafAtPoint, drawHighlight } from '@/lib/canvas-render'

interface HoverCanvasProps {
  leaves: TreeNode[]
  width: number
  height: number
  onHover: (leaf: TreeNode | null, x: number, y: number) => void
  onSelect: (leaf: TreeNode | null) => void
}

export default function HoverCanvas({ leaves, width, height, onHover, onSelect }: HoverCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const currentLeafRef = useRef<TreeNode | null>(null)
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  const clearHighlight = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
  }, [width, height, dpr])

  // 尺寸变化时清除高亮
  useEffect(() => {
    clearHighlight()
    currentLeafRef.current = null
  }, [width, height, clearHighlight])

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const leaf = findLeafAtPoint(leaves, x, y)

    if (leaf !== currentLeafRef.current) {
      currentLeafRef.current = leaf
      clearHighlight()
      if (leaf) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          drawHighlight(ctx, leaf)
        }
      }
    }

    onHover(leaf, e.clientX, e.clientY)
  }

  function handleMouseLeave() {
    currentLeafRef.current = null
    clearHighlight()
    onHover(null, 0, 0)
  }

  function handleDblClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const leaf = findLeafAtPoint(leaves, x, y)
    onSelect(leaf)
  }

  return (
    <canvas
      ref={canvasRef}
      id="hover-map"
      width={width * dpr}
      height={height * dpr}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'absolute',
        top: 0,
        left: 0,
        cursor: 'pointer',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDblClick}
    />
  )
}
