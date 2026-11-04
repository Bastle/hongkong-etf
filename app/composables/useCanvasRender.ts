import type { HKStockQuote, TreeNode, SouthboundFlow } from '../types/market'

/**
 * 获取市值排名前 N 的股票
 */
export function getTopStocks(stocks: HKStockQuote[], count: number = 200): HKStockQuote[] {
  return [...stocks]
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, count)
}

/**
 * 判断是否为移动端
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

/**
 * 获取移动端最大渲染数量
 */
export function getMobileLimit(): number {
  return 100
}

/**
 * 在 Canvas 上绘制热力图
 */
export function drawTreemap(
  ctx: CanvasRenderingContext2D,
  leaves: TreeNode[],
  width: number,
  height: number,
  southboundMap?: Map<string, SouthboundFlow>,
): void {
  ctx.clearRect(0, 0, width, height)

  // 计算南向资金最大净额用于边框宽度缩放
  let maxNet = 0
  if (southboundMap) {
    for (const flow of southboundMap.values()) {
      const absNet = Math.abs(flow.net)
      if (absNet > maxNet) maxNet = absNet
    }
  }

  for (const leaf of leaves) {
    const w = leaf.x1 - leaf.x0
    const h = leaf.y1 - leaf.y0
    if (w <= 0 || h <= 0) continue

    // 绘制色块
    ctx.fillStyle = leaf.color ?? '#263238'
    ctx.fillRect(leaf.x0, leaf.y0, w, h)

    // 边框：南向资金叠加层或默认边框
    const flow = southboundMap?.get(leaf.data.code)
    if (flow && maxNet > 0) {
      const absNet = Math.abs(flow.net)
      const normalized = Math.log10(absNet + 1) / Math.log10(maxNet + 1)
      const borderWidth = 1 + normalized * 3
      ctx.strokeStyle = flow.net > 0 ? '#2196F3' : '#F44336'
      ctx.lineWidth = borderWidth
    } else {
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'
      ctx.lineWidth = 0.5
    }
    ctx.strokeRect(leaf.x0, leaf.y0, w, h)

    // 面积 >= 40×20 时绘制股票名称
    if (w >= 40 && h >= 20) {
      ctx.fillStyle = '#FFFFFF'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const centerX = leaf.x0 + w / 2
      const centerY = leaf.y0 + h / 2

      // 根据面积调整字号
      const fontSize = Math.min(12, Math.max(9, Math.min(w / 6, h / 3)))
      ctx.font = `bold ${fontSize}px -apple-system, sans-serif`

      const name = leaf.data.name || leaf.data.code
      // 裁剪过长名称
      const maxWidth = w - 4
      let displayName = name
      if (ctx.measureText(name).width > maxWidth) {
        displayName = name.slice(0, Math.floor(name.length * maxWidth / ctx.measureText(name).width))
      }
      ctx.fillText(displayName, centerX, centerY - (h >= 30 ? fontSize * 0.4 : 0))

      // 面积 >= 60×30 时额外绘制涨跌幅
      if (h >= 30 && w >= 60) {
        const changeText = leaf.data.changePercent >= 0
          ? `+${leaf.data.changePercent.toFixed(1)}%`
          : `${leaf.data.changePercent.toFixed(1)}%`
        ctx.font = `${fontSize * 0.85}px -apple-system, sans-serif`
        ctx.fillText(changeText, centerX, centerY + fontSize * 0.6)
      }
    }
  }
}

/**
 * 根据坐标查找对应的叶子节点
 * 倒序遍历（后绘制的在上面）
 */
export function findLeafAtPoint(
  leaves: TreeNode[],
  x: number,
  y: number,
): TreeNode | null {
  for (let i = leaves.length - 1; i >= 0; i--) {
    const leaf = leaves[i]
    if (x >= leaf.x0 && x <= leaf.x1 && y >= leaf.y0 && y <= leaf.y1) {
      return leaf
    }
  }
  return null
}

/**
 * 在 HoverCanvas 上绘制高亮框
 */
export function drawHighlight(
  ctx: CanvasRenderingContext2D,
  leaf: TreeNode,
): void {
  const w = leaf.x1 - leaf.x0
  const h = leaf.y1 - leaf.y0

  ctx.strokeStyle = 'rgba(212, 38, 38, 0.8)'
  ctx.lineWidth = 2
  ctx.strokeRect(leaf.x0 + 1, leaf.y0 + 1, w - 2, h - 2)

  // 半透明覆盖层
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.fillRect(leaf.x0, leaf.y0, w, h)
}
