// 9 步对称色板：绿(跌) → 灰(平) → 红(涨)
// 红绿饱和度/亮度对称，视觉更平衡
const PALETTE = [
  '#27ae60', // extremeDown  index 0 — 纯绿
  '#27ae60', // highDown     index 1 — 亮绿
  '#27ae60', // down         index 2 — 绿青
  '#27ae60', // mildDown     index 3 — 浅绿
  '#aab7b8', // flat         index 4 — 中性灰
  '#a93226', // mildUp       index 5 — 浅红灰
  '#a93226', // up           index 6 — 亮红
  '#a93226', // highUp       index 7 — 深红
  '#a93226', // extremeUp    index 8 — 暗红
]

/**
 * 将涨跌幅(%)映射为热力图颜色
 * sigmoid: normalized = 2 / (1 + e^(-change/8)) - 1
 * 输出 [-1, 1] 映射到色板索引 [0, 8]，线性插值
 */
export function getHeatColor(changePercent: number): string {
  const normalized = 2 / (1 + Math.exp(-changePercent / 8)) - 1
  // normalized [-1, 1] → index [0, 8]
  const rawIndex = (normalized + 1) / 2 * 8
  const idx = Math.min(7, Math.max(0, Math.floor(rawIndex)))
  const t = rawIndex - idx

  if (t <= 0) return PALETTE[idx]
  return lerpColor(PALETTE[idx], PALETTE[idx + 1], t)
}

/**
 * 按因子 t ∈ [0, 1] 在两个十六进制颜色之间线性插值
 */
export function lerpColor(hex1: string, hex2: string, t: number): string {
  const r1 = parseInt(hex1.slice(1, 3), 16)
  const g1 = parseInt(hex1.slice(3, 5), 16)
  const b1 = parseInt(hex1.slice(5, 7), 16)

  const r2 = parseInt(hex2.slice(1, 3), 16)
  const g2 = parseInt(hex2.slice(3, 5), 16)
  const b2 = parseInt(hex2.slice(5, 7), 16)

  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export { PALETTE }

// AH 溢价色板：蓝(负溢价/H股贵) → 灰(零溢价) → 红(正溢价/A股贵)
const PREMIUM_PALETTE = [
  '#2196F3', // negative premium (H expensive)
  '#64B5F6',
  '#90CAF9',
  '#BDBDBD', // zero premium
  '#EF9A9A',
  '#E57373',
  '#F44336', // positive premium (A expensive)
]

/**
 * 将 AH 溢价率(%)映射为颜色
 * 溢价 > 0 表示 A 股更贵（红色调）
 * 溢价 < 0 表示 H 股更贵（蓝色调）
 */
export function getPremiumColor(premium: number): string {
  // 使用 sigmoid 将溢价率映射到 [0, 1]
  const normalized = 2 / (1 + Math.exp(-premium / 20)) - 1
  // normalized [-1, 1] → index [0, 6]
  const rawIndex = (normalized + 1) / 2 * 6
  const idx = Math.min(5, Math.max(0, Math.floor(rawIndex)))
  const t = rawIndex - idx

  if (t <= 0) return PREMIUM_PALETTE[idx]
  return lerpColor(PREMIUM_PALETTE[idx], PREMIUM_PALETTE[idx + 1], t)
}
