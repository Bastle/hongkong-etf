import { describe, it, expect, vi, afterEach } from 'vitest'
import { isTradingHours } from '../normalization'

describe('isTradingHours', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('上午盘时段返回 true', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-24T10:30:00+08:00'))
    expect(isTradingHours()).toBe(true)
  })

  it('下午盘时段返回 true', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-24T14:30:00+08:00'))
    expect(isTradingHours()).toBe(true)
  })

  it('午休时段返回 false', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-24T12:30:00+08:00'))
    expect(isTradingHours()).toBe(false)
  })

  it('夜间返回 false', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-24T20:00:00+08:00'))
    expect(isTradingHours()).toBe(false)
  })
})
