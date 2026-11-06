import type { HKStockQuote } from '../types/market'

/**
 * 标准化腾讯 API 数据
 */
export function normalizeTencentData(raw: Record<string, any>): HKStockQuote {
  const code = String(raw.code || '')
  const price = safeFloat(raw.price)
  const prevClose = safeFloat(raw.prevClose)
  const change = price > 0 && prevClose > 0 ? price - prevClose : safeFloat(raw.change)
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : safeFloat(raw.changePercent)

  let marketCap = safeFloat(raw.marketCap)
  if (marketCap <= 0 || !Number.isFinite(marketCap)) {
    marketCap = 1e8 // 兜底 1 亿
  }

  return {
    code,
    name: String(raw.name || ''),
    price,
    prevClose,
    change,
    changePercent,
    volume: safeFloat(raw.volume),
    amount: safeFloat(raw.amount),
    marketCap,
    high: safeFloat(raw.high),
    low: safeFloat(raw.low),
    open: safeFloat(raw.open),
    turnover: safeFloat(raw.turnover),
    pe: safeFloat(raw.pe),
    pb: safeFloat(raw.pb),
    lotSize: safeInt(raw.lotSize) || 100,
    board: detectBoard(code),
    source: 'tencent',
    timestamp: Date.now(),
  }
}

/**
 * 根据代码判断板块类型
 */
export function detectBoard(code: string): HKStockQuote['board'] {
  // GEM 创业板: 8xxxx
  if (code.startsWith('8')) return 'gem'

  // 二次上市: 99xxx (需要在 9xxxx 之前判断)
  if (code.startsWith('99')) return 'secondary'

  // WVR 同股不同权: 9xxxx
  if (code.startsWith('9')) return 'wvr'

  // 主板: 0xxxx, 1xxxx
  return 'main'
}

function safeFloat(value: any): number {
  if (value === null || value === undefined || value === '' || value === '-') return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const num = parseFloat(String(value))
  return Number.isFinite(num) ? num : 0
}

function safeInt(value: any): number {
  if (value === null || value === undefined || value === '' || value === '-') return 0
  if (typeof value === 'number') return Number.isFinite(value) ? Math.floor(value) : 0
  const num = parseInt(String(value), 10)
  return Number.isFinite(num) ? num : 0
}

/**
 * 判断是否在港股交易时间
 */
export function isTradingHours(): boolean {
  const now = new Date()
  const hkTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const hours = hkTime.getUTCHours()
  const minutes = hkTime.getUTCMinutes()
  const time = hours * 60 + minutes

  // 上午盘：09:30 - 12:00
  if (time >= 570 && time <= 720) return true
  // 下午盘：13:00 - 16:10
  if (time >= 780 && time <= 970) return true
  // 收市竞价：16:10 - 16:20
  if (time >= 970 && time <= 980) return true

  return false
}
