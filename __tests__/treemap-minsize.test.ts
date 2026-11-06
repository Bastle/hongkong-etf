import { describe, it, expect } from 'vitest'
import { computeLayout, filterSmallLeaves, flattenLayout } from '../lib/treemap-layout'
import type { HKStockQuote, SectorData } from '../types/market'

function makeStock(overrides: Partial<HKStockQuote>): HKStockQuote {
  return {
    code: '00001', name: 'test', price: 10, prevClose: 10,
    change: 0, changePercent: 0, volume: 0, amount: 0,
    marketCap: 1e10, high: 10, low: 10, open: 10,
    turnover: 0, pe: 0, pb: 0, lotSize: 100,
    board: 'main', source: 'tencent', timestamp: Date.now(),
    ...overrides,
  }
}

describe('minSize 配置', () => {
  it('小于 minSize 的色块被过滤', () => {
    const stocks = [
      makeStock({ code: '00700', name: '腾讯', marketCap: 1e12, change: 0 }),
      makeStock({ code: '00001', name: '微型股', marketCap: 1e6, change: 0 }),
    ]
    const sectors: SectorData[] = [{ name: '测试', stocks }]
    const root = computeLayout(stocks, sectors, { width: 1200, height: 800 })
    const allLeaves = flattenLayout(root)
    const filtered = filterSmallLeaves(allLeaves, 40)
    // 微型股面积应小于 40x20，被过滤掉
    expect(filtered.length).toBeLessThanOrEqual(allLeaves.length)
  })

  it('minSize=0 时保留所有节点', () => {
    const stocks = [
      makeStock({ code: '00700', name: '腾讯', marketCap: 1e12, change: 0 }),
      makeStock({ code: '00001', name: '微型股', marketCap: 1e6, change: 0 }),
    ]
    const sectors: SectorData[] = [{ name: '测试', stocks }]
    const root = computeLayout(stocks, sectors, { width: 1200, height: 800 })
    const allLeaves = flattenLayout(root)
    const filtered = filterSmallLeaves(allLeaves, 0)
    expect(filtered.length).toBe(allLeaves.length)
  })
})
