import { describe, it, expect } from 'vitest'
import { getHeatColor, lerpColor } from '../lib/color'

describe('getHeatColor', () => {
  it('极端大涨 (>20%) 返回暗红色系', () => {
    const color = getHeatColor(30)
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    // 红色占主导
    expect(r).toBeGreaterThan(g)
    expect(r).toBeGreaterThan(b)
  })

  it('大涨 (10~20%) 返回红色系', () => {
    const color = getHeatColor(15)
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    expect(r).toBeGreaterThan(g)
  })

  it('小涨 (0~5%) 返回偏红色', () => {
    const color = getHeatColor(3)
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    // 应该比 flat 更红
    const flatColor = getHeatColor(0)
    const flatR = parseInt(flatColor.slice(1, 3), 16)
    const r = parseInt(color.slice(1, 3), 16)
    expect(r).toBeGreaterThan(flatR)
  })

  it('平盘 (0%) 返回 flat 色', () => {
    expect(getHeatColor(0)).toBe('#8c8c8c')
  })

  it('小跌 (-5~0%) 返回偏绿色', () => {
    const color = getHeatColor(-3)
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    const flatColor = getHeatColor(0)
    const flatG = parseInt(flatColor.slice(3, 5), 16)
    const flatR = parseInt(flatColor.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const r = parseInt(color.slice(1, 3), 16)
    // 更绿 + 更不红
    expect(g).toBeGreaterThan(flatG)
    expect(r).toBeLessThan(flatR)
  })

  it('大跌 (-20~-10%) 返回绿色系', () => {
    const color = getHeatColor(-15)
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    // 绿色占主导
    expect(g).toBeGreaterThan(r)
  })

  it('极端大跌 (<-20%) 返回深绿色系', () => {
    const color = getHeatColor(-30)
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    // 绿色占主导（深绿 #1b5e20 的 g 低于浅绿但仍是主色）
    expect(g).toBeGreaterThan(r)
  })

  it('涨跌幅符号正确：正值红，负值绿（A 股风格）', () => {
    const up = getHeatColor(5)
    const down = getHeatColor(-5)
    const upR = parseInt(up.slice(1, 3), 16)
    const downR = parseInt(down.slice(1, 3), 16)
    expect(upR).toBeGreaterThan(downR)
  })

  it('渐变生效：小跌与大跌色值不同', () => {
    const mildDown = getHeatColor(-2)
    const highDown = getHeatColor(-15)
    expect(mildDown).not.toBe(highDown)
  })

  it('渐变生效：小涨与大涨色值不同', () => {
    const mildUp = getHeatColor(2)
    const highUp = getHeatColor(15)
    expect(mildUp).not.toBe(highUp)
  })

  it('中间调可辨：小涨/小跌与平盘不同', () => {
    const flat = getHeatColor(0)
    const mildUp = getHeatColor(1)
    const mildDown = getHeatColor(-1)
    expect(mildUp).not.toBe(flat)
    expect(mildDown).not.toBe(flat)
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
