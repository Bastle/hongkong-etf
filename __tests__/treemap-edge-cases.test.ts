import { describe, it, expect } from 'vitest'
import { computeLayout } from '../lib/treemap-layout'
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

describe('布局边界情况', () => {
  it('超大股票面积被市值上限限制', () => {
    // 使用多只股票让市值上限真正生效
    const stocks = [
      makeStock({ code: '00700', name: '腾讯', marketCap: 1e13, change: 0 }),
      makeStock({ code: '00005', name: '汇丰', marketCap: 5e11, change: 0 }),
      makeStock({ code: '01810', name: '小米', marketCap: 3e11, change: 0 }),
      makeStock({ code: '09988', name: '阿里', marketCap: 2e11, change: 0 }),
      makeStock({ code: '03690', name: '美团', marketCap: 1e11, change: 0 }),
    ]
    const sectors: SectorData[] = [{ name: '测试', stocks }]
    const root = computeLayout(stocks, sectors, { width: 1200, height: 800 })
    const tencent = root.leaves().find(l => (l.data as any)._stock?.code === '00700')
    expect(tencent).toBeDefined()
    if (tencent) {
      const area = (tencent.x1 - tencent.x0) * (tencent.y1 - tencent.y0)
      const ratio = area / (1200 * 800)
      // 市值上限防止完全独占，但极端比例下仍可能较大
      expect(ratio).toBeLessThan(0.9)
      expect(ratio).toBeGreaterThan(0)
    }
  })

  it('极小行业板块仍然显示', () => {
    const stocks = Array.from({ length: 3 }, (_, i) => ({
      code: `0000${i}`, name: `测试${i}`, marketCap: 1e9, change: 0,
      price: 10, prevClose: 10, changePercent: 0, volume: 0, amount: 0,
      high: 10, low: 10, open: 10, turnover: 0, pe: 0, pb: 0,
      lotSize: 100, board: 'main' as const, source: 'tencent' as const, timestamp: Date.now(),
    }))
    const sectors: SectorData[] = [{ name: '极小行业', stocks }]
    const root = computeLayout(stocks, sectors, { width: 1200, height: 800 })
    expect(root.leaves().length).toBe(3)
  })
})
