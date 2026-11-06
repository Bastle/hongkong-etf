import { describe, it, expect } from 'vitest'
import { computeLayout, flattenLayout } from '../lib/treemap-layout'
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

describe('布局节点颜色', () => {
  it('每个叶子节点都有 color 属性', () => {
    const stocks = [
      makeStock({ code: '00700', name: '腾讯', marketCap: 1e12, change: 1.5 }),
      makeStock({ code: '00005', name: '汇丰', marketCap: 1e12, change: -0.3 }),
    ]
    const sectors: SectorData[] = [{ name: '测试', stocks }]
    const root = computeLayout(stocks, sectors, { width: 1200, height: 800 })
    const leaves = flattenLayout(root)
    leaves.forEach((leaf) => {
      expect(leaf.color).toBeDefined()
      expect(leaf.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })

  it('上涨股票颜色不同于平盘', () => {
    const stocks = [
      makeStock({ code: '00700', name: '腾讯', marketCap: 1e12, change: 5 }),
    ]
    const sectors: SectorData[] = [{ name: '测试', stocks }]
    const root = computeLayout(stocks, sectors, { width: 1200, height: 800 })
    const leaves = flattenLayout(root)
    // sigmoid(0.5) ≈ 0.38, 在 mildUp→up 之间
    expect(leaves[0].color).not.toBe('#263238')
    expect(leaves[0].color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('下跌股票颜色不同于平盘', () => {
    const stocks = [
      makeStock({ code: '00700', name: '腾讯', marketCap: 1e12, change: -5 }),
    ]
    const sectors: SectorData[] = [{ name: '测试', stocks }]
    const root = computeLayout(stocks, sectors, { width: 1200, height: 800 })
    const leaves = flattenLayout(root)
    // sigmoid(-0.5) ≈ -0.38, 在 down→mildDown 之间
    expect(leaves[0].color).not.toBe('#263238')
    expect(leaves[0].color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })
})
