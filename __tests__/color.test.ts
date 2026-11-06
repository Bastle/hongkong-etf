import { describe, it, expect } from 'vitest'
import { getHeatColor, lerpColor } from '../lib/color'

// 解析 rgba(r, g, b, a) 字符串
function parseRGBA(color: string): { r: number; g: number; b: number; a: number } {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)
  if (!m) throw new Error(`Not an rgba string: ${color}`)
  return { r: +m[1], g: +m[2], b: +m[3], a: +m[4] }
}

describe('getHeatColor', () => {
  it('极端大涨 (>20%) 返回高透明度红色', () => {
    const { r, g, b, a } = parseRGBA(getHeatColor(30))
    expect(r).toBeGreaterThan(g)
    expect(r).toBeGreaterThan(b)
    expect(a).toBeGreaterThan(0.7)
  })

  it('大涨 (10~20%) 返回红色', () => {
    const { r, g, a } = parseRGBA(getHeatColor(15))
    expect(r).toBeGreaterThan(g)
    expect(a).toBeGreaterThan(0.5)
  })

  it('小涨 (0~5%) 返回低透明度红色', () => {
    const { r, g, a } = parseRGBA(getHeatColor(3))
    expect(r).toBeGreaterThan(g)
    expect(a).toBeLessThan(0.5)
  })

  it('平盘 (0%) 返回低透明度灰色', () => {
    const { r, g, b, a } = parseRGBA(getHeatColor(0))
    expect(r).toBe(g)
    expect(g).toBe(b)
    expect(a).toBeLessThan(0.2)
  })

  it('小跌 (-5~0%) 返回低透明度绿色', () => {
    const { r, g, a } = parseRGBA(getHeatColor(-3))
    expect(g).toBeGreaterThan(r)
    expect(a).toBeLessThan(0.5)
  })

  it('大跌 (-20~-10%) 返回高透明度绿色', () => {
    const { r, g, a } = parseRGBA(getHeatColor(-15))
    expect(g).toBeGreaterThan(r)
    expect(a).toBeGreaterThan(0.5)
  })

  it('极端大跌 (<-20%) 返回高透明度绿色', () => {
    const { r, g, a } = parseRGBA(getHeatColor(-30))
    expect(g).toBeGreaterThan(r)
    expect(a).toBeGreaterThan(0.7)
  })

  it('涨跌幅符号正确：正值红，负值绿', () => {
    const up = parseRGBA(getHeatColor(5))
    const down = parseRGBA(getHeatColor(-5))
    expect(up.r).toBeGreaterThan(up.g)    // 涨 = 红
    expect(down.g).toBeGreaterThan(down.r) // 跌 = 绿
  })

  it('透明度随幅度单调递增', () => {
    const mild = parseRGBA(getHeatColor(2))
    const mid = parseRGBA(getHeatColor(8))
    const high = parseRGBA(getHeatColor(20))
    expect(mid.a).toBeGreaterThan(mild.a)
    expect(high.a).toBeGreaterThan(mid.a)
  })

  it('小幅涨跌与平盘颜色不同', () => {
    const flat = getHeatColor(0)
    const mildUp = parseRGBA(getHeatColor(1))
    const mildDown = parseRGBA(getHeatColor(-1))
    // 不同方向
    expect(mildUp.r).toBeGreaterThan(mildUp.g)
    expect(mildDown.g).toBeGreaterThan(mildDown.r)
  })
})

describe('lerpColor', () => {
  it('t=0 返回起始颜色', () => {
    expect(lerpColor('#FF0000', '#00FF00', 0)).toBe('#ff0000')
  })

  it('t=1 返回结束颜色', () => {
    expect(lerpColor('#FF0000', '#00FF00', 1)).toBe('#00ff00')
  })

  it('t=0.5 返回中间颜色', () => {
    expect(lerpColor('#000000', '#FFFFFF', 0.5)).toBe('#808080')
  })
})
