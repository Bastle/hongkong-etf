import type { HKStockQuote } from '~/types/market'

/**
 * 验证股票数据完整性
 */
export function validateStockQuote(stock: Partial<HKStockQuote>): stock is HKStockQuote {
  if (!stock.code || typeof stock.code !== 'string') return false
  if (typeof stock.price !== 'number' || !Number.isFinite(stock.price)) return false
  if (typeof stock.marketCap !== 'number' || !Number.isFinite(stock.marketCap)) return false
  return true
}

/**
 * 清洗股票数据，填充缺失字段
 */
export function sanitizeStockQuote(raw: Partial<HKStockQuote>): HKStockQuote {
  return {
    code: raw.code || '',
    name: raw.name || '',
    price: Number.isFinite(raw.price) ? raw.price : 0,
    prevClose: Number.isFinite(raw.prevClose) ? raw.prevClose : 0,
    change: Number.isFinite(raw.change) ? raw.change : 0,
    changePercent: Number.isFinite(raw.changePercent) ? raw.changePercent : 0,
    volume: Number.isFinite(raw.volume) ? raw.volume : 0,
    amount: Number.isFinite(raw.amount) ? raw.amount : 0,
    marketCap: Number.isFinite(raw.marketCap) && raw.marketCap > 0 ? raw.marketCap : 1e8,
    high: Number.isFinite(raw.high) ? raw.high : 0,
    low: Number.isFinite(raw.low) ? raw.low : 0,
    open: Number.isFinite(raw.open) ? raw.open : 0,
    turnover: Number.isFinite(raw.turnover) ? raw.turnover : 0,
    pe: Number.isFinite(raw.pe) ? raw.pe : 0,
    pb: Number.isFinite(raw.pb) ? raw.pb : 0,
    lotSize: Number.isFinite(raw.lotSize) && raw.lotSize > 0 ? raw.lotSize : 100,
    board: raw.board || 'main',
    source: raw.source || 'tencent',
    timestamp: raw.timestamp || Date.now(),
  }
}
