import { describe, it, expect, vi } from 'vitest'
import { drawTreemap, findLeafAtPoint, getTopStocks, isMobile, drawHighlight } from '../useCanvasRender'
import type { TreeNode, HKStockQuote } from '../../types/market'

function makeLeaf(overrides: Partial<TreeNode>): TreeNode {
  return {
    data: {
      code: '00700', name: '腾讯', price: 388, prevClose: 386,
      change: 2, changePercent: 0.52, volume: 0, amount: 0,
      marketCap: 3.7e12, high: 389, low: 385, open: 387,
      turnover: 0, pe: 0, pb: 0, lotSize: 100,
      board: 'main', source: 'tencent', timestamp: Date.now(),
    },
    x0: 0, y0: 0, x1: 100, y1: 50,
    color: '#FF5252',
    ...overrides,
  }
}

function makeMockCtx() {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 20 }),
    beginPath: vi.fn(),
    setTransform: vi.fn(),
    set fillStyle(_val: string) {},
    set strokeStyle(_val: string) {},
    set lineWidth(_val: number) {},
    set font(_val: string) {},
    set textAlign(_val: string) {},
    set textBaseline(_val: string) {},
  }
}

describe('getTopStocks', () => {
  it('返回前 N 只股票（按市值降序）', () => {
    const stocks: HKStockQuote[] = [
      { code: '00700', name: '腾讯', marketCap: 1e12 } as any,
      { code: '00005', name: '汇丰', marketCap: 5e11 } as any,
      { code: '01810', name: '小米', marketCap: 3e11 } as any,
    ]
    const top = getTopStocks(stocks, 2)
    expect(top.length).toBe(2)
    expect(top[0].code).toBe('00700')
    expect(top[1].code).toBe('00005')
  })

  it('默认返回 200 只', () => {
    const stocks = Array.from({ length: 300 }, (_, i) => ({
      code: `${i}`, name: `s${i}`, marketCap: 300 - i,
    } as any))
    const top = getTopStocks(stocks)
    expect(top.length).toBe(200)
  })
})

describe('findLeafAtPoint', () => {
  const leaves: TreeNode[] = [
    makeLeaf({ x0: 0, y0: 0, x1: 100, y1: 50, data: { code: '00700' } as any }),
    makeLeaf({ x0: 100, y0: 0, x1: 200, y1: 50, data: { code: '00005' } as any }),
  ]

  it('在色块内返回该节点', () => {
    const result = findLeafAtPoint(leaves, 50, 25)
    expect(result?.data.code).toBe('00700')
  })

  it('在色块边界返回该节点', () => {
    const result = findLeafAtPoint(leaves, 100, 25)
    expect(result?.data.code).toBe('00005')
  })

  it('在空白区域返回 null', () => {
    const result = findLeafAtPoint(leaves, 250, 25)
    expect(result).toBeNull()
  })
})

describe('drawTreemap', () => {
  it('调用 clearRect 清空画布', () => {
    const ctx = makeMockCtx() as any
    const leaves = [makeLeaf({})]
    drawTreemap(ctx, leaves, 1200, 800)
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 1200, 800)
  })

  it('为每个节点调用 fillRect', () => {
    const ctx = makeMockCtx() as any
    const leaves = [makeLeaf({}), makeLeaf({ x0: 100, y0: 0, x1: 200, y1: 50 })]
    drawTreemap(ctx, leaves, 1200, 800)
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('跳过面积为 0 的节点', () => {
    const ctx = makeMockCtx() as any
    const leaves = [makeLeaf({ x0: 0, y0: 0, x1: 0, y1: 0 })]
    drawTreemap(ctx, leaves, 1200, 800)
    // fillRect 被调用次数不应包含面积为 0 的节点
    expect(ctx.fillRect).not.toHaveBeenCalled()
  })
})

describe('drawHighlight', () => {
  it('绘制高亮框', () => {
    const ctx = makeMockCtx() as any
    const leaf = makeLeaf({})
    drawHighlight(ctx, leaf)
    expect(ctx.strokeRect).toHaveBeenCalled()
    expect(ctx.fillRect).toHaveBeenCalled()
  })
})

describe('isMobile', () => {
  it('在服务端返回 false', () => {
    // 模拟服务端环境（无 window）
    expect(isMobile()).toBe(false)
  })
})
