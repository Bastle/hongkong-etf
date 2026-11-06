import { describe, it, expect } from 'vitest'
import { groupBySector } from '../lib/server/sector-grouping'
import type { HKStockQuote } from '../types/market'

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

describe('groupBySector', () => {
  it('将股票正确分组到 HSCI 行业', () => {
    const stocks = [
      makeStock({ code: '00700', name: '腾讯', marketCap: 3.7e12 }),
      makeStock({ code: '00005', name: '汇丰', marketCap: 1.2e12 }),
    ]
    const sectors = groupBySector(stocks)
    expect(sectors.length).toBeGreaterThanOrEqual(2)

    const itSector = sectors.find(s => s.name === '信息技术')
    const finSector = sectors.find(s => s.name === '金融')
    expect(itSector?.stocks.some(s => s.code === '00700')).toBe(true)
    expect(finSector?.stocks.some(s => s.code === '00005')).toBe(true)
  })

  it('未映射股票兜底到综合企业', () => {
    const stocks = [
      makeStock({ code: '99999', marketCap: 1e8 }),
    ]
    const sectors = groupBySector(stocks)
    const cong = sectors.find(s => s.name === '综合企业')
    expect(cong).toBeDefined()
    expect(cong?.stocks.some(s => s.code === '99999')).toBe(true)
  })

  it('空数组返回空结果', () => {
    const sectors = groupBySector([])
    expect(sectors).toEqual([])
  })

  it('多只同行业股票归入同一板块', () => {
    const stocks = [
      makeStock({ code: '00700', name: '腾讯', marketCap: 3.7e12 }),
      makeStock({ code: '09988', name: '阿里巴巴', marketCap: 2e12 }),
      makeStock({ code: '03690', name: '美团', marketCap: 1e12 }),
    ]
    const sectors = groupBySector(stocks)
    const itSector = sectors.find(s => s.name === '信息技术')
    expect(itSector?.stocks.length).toBe(3)
  })
})
