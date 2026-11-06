// 9 步对称色板：绿(跌) → 灰(平) → 红(涨)  ← A 股风格：红涨绿跌
// 红绿饱和度/亮度对称，视觉更平衡
// 中间调可辨：mildUp/mildDown 与 flat 明显区分，中等涨跌之间可区分
const PALETTE = [
  '#1b5e20', // extremeDown  index 0 — 墨绿（暴跌）
  '#2e7d32', // highDown     index 1 — 深绿（大跌）
  '#4caf50', // down         index 2 — 绿（中跌）
  '#69f0ae', // mildDown     index 3 — 浅绿（小跌）
  '#8c8c8c', // flat         index 4 — 中性灰（比原 #aab7b8 深一档，提高白字对比）
  '#ff8a80', // mildUp       index 5 — 浅红（小涨）
  '#e53935', // up           index 6 — 亮红（中涨）
  '#c62828', // highUp       index 7 — 深红（大涨）
  '#b71c1c', // extremeUp    index 8 — 暗红（暴涨）
]

/**
 * 将涨跌幅(%)映射为热力图颜色
 * 固定红/绿基色 + 半透明度区分幅度：
 *   涨(红) 跌(绿) 颜色不变，α = 0.12 + 0.88 × |sigmoid(normalized)|
 *   小涨/小跌 → 几乎透明；大涨/大跌 → 接近不透明
 */
export function getHeatColor(changePercent: number): string {
  const normalized = 2 / (1 + Math.exp(-changePercent / 8)) - 1  // [-1, 1]
  const alpha = Math.round((0.12 + 0.88 * Math.abs(normalized)) * 100) / 100

  if (Math.abs(normalized) < 0.02) return `rgba(140, 140, 140, 0.15)` // 平盘
  if (normalized > 0) return `rgba(246, 53, 56, ${alpha})`   // 红 = 涨（与 K 线一致）
  return `rgba(0, 230, 118, ${alpha})`                        // 绿 = 跌（高饱和）
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
