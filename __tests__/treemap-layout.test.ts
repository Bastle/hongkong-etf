import { describe, it, expect } from 'vitest'
import { computeLayout, filterSmallLeaves, buildHierarchy } from '../lib/treemap-layout'
import type { HKStockQuote, SectorData } from '../types/market'

function makeStock(overrides: Partial<HKStockQuote>): HKStockQuote {
  return {
    code: '00001',
    name: 'test',
    price: 10,
    prevClose: 10,
    change: 0,
    changePercent: 0,
    volume: 0,
    amount: 0,
    marketCap: 1e10,
    high: 10,
    low: 10,
    open: 10,
    turnover: 0,
    pe: 0,
    pb: 0,
    lotSize: 100,
    board: 'main',
    source: 'tencent',
    timestamp: Date.now(),
    ...overrides,
  }
}

const mockStocks: HKStockQuote[] = [
  makeStock({ code: '00700', name: '腾讯', marketCap: 3.7e12, change: 1.5 }),
  makeStock({ code: '00005', name: '汇丰', marketCap: 1.2e12, change: -0.3 }),
  makeStock({ code: '01810', name: '小米', marketCap: 5e11, change: 3.2 }),
]

const mockSectors: SectorData[] = [
  { name: '信息技术', stocks: [mockStocks[0], mockStocks[2]] },
  { name: '金融', stocks: [mockStocks[1]] },
]

describe('buildHierarchy', () => {
  it('构建正确的层级结构', () => {
    const root = buildHierarchy(mockStocks, mockSectors)
    expect(root.name).toBe('root')
    expect(root.children?.length).toBe(2)
    expect(root.children?.[0].name).toBe('信息技术')
    expect(root.children?.[0].children?.length).toBe(2)
  })
})

describe('computeLayout', () => {
  it('每个叶子节点都有坐标', () => {
    const root = computeLayout(mockStocks, mockSectors, { width: 1200, height: 800 })
    root.leaves().forEach((leaf) => {
      expect(leaf.x0).toBeDefined()
      expect(leaf.y0).toBeDefined()
      expect(leaf.x1).toBeGreaterThan(leaf.x0)
      expect(leaf.y1).toBeGreaterThan(leaf.y0)
    })
  })

  it('总面积约等于画布面积', () => {
    const root = computeLayout(mockStocks, mockSectors, { width: 1200, height: 800 })
    const totalArea = root.leaves().reduce((sum, l) => {
      return sum + (l.x1 - l.x0) * (l.y1 - l.y0)
    }, 0)
    expect(totalArea).toBeGreaterThan(1200 * 800 * 0.5)
    expect(totalArea).toBeLessThan(1200 * 800 * 1.15)
  })

  it('大市值股票面积更大', () => {
    const root = computeLayout(mockStocks, mockSectors, { width: 1200, height: 800 })
    const leaves = root.leaves()
    const tencent = leaves.find(l => (l.data as any)._stock?.code === '00700')
    const xiaomi = leaves.find(l => (l.data as any)._stock?.code === '01810')
    expect(tencent).toBeDefined()
    expect(xiaomi).toBeDefined()
    if (tencent && xiaomi) {
      const tencentArea = (tencent.x1 - tencent.x0) * (tencent.y1 - tencent.y0)
      const xiaomiArea = (xiaomi.x1 - xiaomi.x0) * (xiaomi.y1 - xiaomi.y0)
      expect(tencentArea).toBeGreaterThan(xiaomiArea)
    }
  })
})

describe('filterSmallLeaves', () => {
  it('minSize <= 0 时不过滤', () => {
    const leaves = [
      { x0: 0, y0: 0, x1: 10, y1: 5 } as any,
      { x0: 10, y0: 0, x1: 100, y1: 50 } as any,
    ]
    expect(filterSmallLeaves(leaves, 0)).toHaveLength(2)
    expect(filterSmallLeaves(leaves, -1)).toHaveLength(2)
  })

  it('过滤掉小于 minSize 的节点', () => {
    const leaves = [
      { x0: 0, y0: 0, x1: 10, y1: 5 } as any,  // 10x5
      { x0: 10, y0: 0, x1: 100, y1: 50 } as any, // 90x50
    ]
    const result = filterSmallLeaves(leaves, 20)
    expect(result).toHaveLength(1)
  })
})
