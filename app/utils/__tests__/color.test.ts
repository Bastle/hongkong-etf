import { describe, it, expect } from 'vitest'
import { getHeatColor, lerpColor } from '../color'

describe('getHeatColor', () => {
  it('极端大涨 (>20%) 返回红色系', () => {
    const color = getHeatColor(30)
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    // 应该是红色系（R 值高）
    const r = parseInt(color.slice(1, 3), 16)
    expect(r).toBeGreaterThan(150)
  })

  it('大涨 (10~20%) 返回红色系', () => {
    const color = getHeatColor(15)
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    const r = parseInt(color.slice(1, 3), 16)
    expect(r).toBeGreaterThan(120)
  })

  it('小涨 (0~5%) 返回偏红色', () => {
    const color = getHeatColor(3)
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    // 应该比 flat 更红
    const flatR = parseInt('#aab7b8'.slice(1, 3), 16)
    const r = parseInt(color.slice(1, 3), 16)
    expect(r).toBeGreaterThan(flatR)
  })

  it('平盘 (0%) 返回 flat 色', () => {
    expect(getHeatColor(0)).toBe('#aab7b8')
  })

  it('小跌 (-5~0%) 返回偏绿色', () => {
    const color = getHeatColor(-3)
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    // 应该比 flat 更绿
    const flatG = parseInt('#aab7b8'.slice(3, 5), 16)
    const g = parseInt(color.slice(3, 5), 16)
    expect(g).toBeGreaterThan(flatG)
  })

  it('大跌 (-20~-10%) 返回绿色系', () => {
    const color = getHeatColor(-15)
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    const g = parseInt(color.slice(3, 5), 16)
    expect(g).toBeGreaterThan(120)
  })

  it('极端大跌 (<-20%) 返回深绿色系', () => {
    const color = getHeatColor(-30)
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    const g = parseInt(color.slice(3, 5), 16)
    expect(g).toBeGreaterThan(150)
  })

  it('涨跌幅符号正确：正值红，负值绿', () => {
    const up = getHeatColor(5)
    const down = getHeatColor(-5)
    // 红色的 R 值应该比绿色高
    const upR = parseInt(up.slice(1, 3), 16)
    const downR = parseInt(down.slice(1, 3), 16)
    expect(upR).toBeGreaterThan(downR)
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
