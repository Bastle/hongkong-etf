import { useRef, useEffect, forwardRef } from 'react'
import type { TreeNode, SouthboundFlow } from '@/types/market'
import { drawTreemap, drawSectorLabels } from '@/lib/canvas-render'
import type { SectorRect } from '@/lib/treemap-layout'

interface MainCanvasProps {
  leaves: TreeNode[]
  sectors?: SectorRect[]
  width: number
  height: number
  southboundMap?: Map<string, SouthboundFlow>
}

const MainCanvas = forwardRef<HTMLCanvasElement, MainCanvasProps>(
  function MainCanvas({ leaves, sectors, width, height, southboundMap }, ref) {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

    useEffect(() => {
      const canvas = (ref as React.RefObject<HTMLCanvasElement>)?.current
      if (!canvas || width === 0 || height === 0) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawTreemap(ctx, leaves, width, height, southboundMap)
      if (sectors && sectors.length > 0) {
        drawSectorLabels(ctx, sectors)
      }
    }, [leaves, sectors, width, height, southboundMap, dpr, ref])

    return (
      <canvas
        ref={ref}
        id="treemap"
        width={width * dpr}
        height={height * dpr}
        style={{ width: `${width}px`, height: `${height}px`, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      />
    )
  }
)

export default MainCanvas
