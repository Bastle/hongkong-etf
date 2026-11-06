/**
 * 计算 Tooltip 位置，确保不超出视口
 */
export function computeTooltipPosition(
  mouseX: number,
  mouseY: number,
  tooltipWidth: number,
  tooltipHeight: number,
  viewport: { width: number; height: number },
): { x: number; y: number } {
  const OFFSET = 12 // 鼠标与 Tooltip 的间距
  let x = mouseX + OFFSET
  let y = mouseY + OFFSET

  // 右侧超出 → 移到鼠标左侧
  if (x + tooltipWidth > viewport.width) {
    x = mouseX - tooltipWidth - OFFSET
  }

  // 底部超出 → 移到鼠标上方
  if (y + tooltipHeight > viewport.height) {
    y = mouseY - tooltipHeight - OFFSET
  }

  // 左侧/顶部兜底
  if (x < 0) x = 0
  if (y < 0) y = 0

  return { x, y }
}
