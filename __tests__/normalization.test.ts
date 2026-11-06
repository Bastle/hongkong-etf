import { describe, it, expect } from 'vitest'
import { normalizeTencentData, detectBoard } from '../lib/normalization'

describe('normalizeTencentData', () => {
  it('正确解析腾讯 API 数据', () => {
    const raw = {
      name: '腾讯控股', code: '00700', price: '388.000',
      prevClose: '386.400', change: '0.41', changeAmount: '1.600',
      volume: '12345678', amount: '4852345678', marketCap: '3710000000000',
      lotSize: '100', high: '389.500', low: '385.200', open: '387.000',
      turnover: '0.13', pe: '22.35', pb: '5.23'
    }
    const stock = normalizeTencentData(raw)
    expect(stock.code).toBe('00700')
    expect(stock.name).toBe('腾讯控股')
    expect(typeof stock.price).toBe('number')
    expect(stock.price).toBe(388)
    expect(stock.board).toBe('main')
  })

  it('缺失字段用默认值填充', () => {
    const raw = { name: '测试', code: '00001' }
    const stock = normalizeTencentData(raw)
    expect(stock.price).toBe(0)
    expect(stock.change).toBe(0)
    expect(stock.lotSize).toBe(100)
  })

  it('NaN 值用安全解析兜底', () => {
    const raw = { name: '测试', code: '00001', price: 'NaN', change: 'abc' }
    const stock = normalizeTencentData(raw)
    expect(stock.price).toBe(0)
    expect(stock.change).toBe(0)
    expect(Number.isFinite(stock.price)).toBe(true)
    expect(Number.isFinite(stock.change)).toBe(true)
  })

  it('停牌股（价格=0）', () => {
    const raw = { name: '长和', code: '00001', price: '0', volume: '0' }
    const stock = normalizeTencentData(raw)
    expect(stock.price).toBe(0)
    expect(stock.volume).toBe(0)
  })

  it('仙股（价格<0.1）', () => {
    const raw = { name: '测试', code: '00002', price: '0.05' }
    const stock = normalizeTencentData(raw)
    expect(stock.price).toBe(0.05)
  })

  it('市值为 0 时兜底为 1 亿', () => {
    const raw = { name: '测试', code: '00001', marketCap: '0' }
    const stock = normalizeTencentData(raw)
    expect(stock.marketCap).toBe(1e8)
  })
})

describe('detectBoard', () => {
  it('正确识别板块类型', () => {
    expect(detectBoard('00700')).toBe('main')
    expect(detectBoard('80001')).toBe('gem')
    expect(detectBoard('99880')).toBe('secondary')
  })
})
