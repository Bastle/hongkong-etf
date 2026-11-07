import type { NextApiRequest, NextApiResponse } from 'next'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { getCache, setCache } from '@/lib/server/cache'
import { getKV, setKV } from '@/lib/server/kv'
import { waitForToken } from '@/lib/server/rate-limiter'
import { fetchStocksBatch } from '@/lib/server/tencent'

interface KlineItem {
  date: string
  open: number
  close: number
  high: number
  low: number
  volume: number
}

interface KlineFile {
  updatedAt: number
  data: KlineItem[]
}

const KLINE_DIR = join(process.cwd(), 'data', 'kline')

/** 港股今日是否已开盘（工作日 + HKT 09:30 后） */
function hasMarketOpenedToday(): boolean {
  const now = new Date()
  const hkTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const day = hkTime.getUTCDay()
  const minutes = hkTime.getUTCHours() * 60 + hkTime.getUTCMinutes()
  if (day === 0 || day === 6) return false
  return minutes >= 540 // 09:00 HKT（含集合竞价）
}

/** 读取本地 JSON 文件中的历史 K 线 */
function loadKlineFile(code: string): KlineItem[] | null {
  const filePath = join(KLINE_DIR, `${code}.json`)
  if (!existsSync(filePath)) return null
  try {
    const file: KlineFile = JSON.parse(readFileSync(filePath, 'utf-8'))
    return file.data.length > 0 ? file.data : null
  } catch {
    return null
  }
}

/** 从腾讯行情 API 获取今日 OHLCV，构造今日 K 线 */
async function fetchTodayKline(code: string): Promise<KlineItem | null> {
  try {
    await waitForToken('tencent')
    const stocks = await fetchStocksBatch([code])
    const s = stocks[0]
    if (!s || !s.open || !s.price) return null

    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    return {
      date,
      open: s.open,
      close: s.price,
      high: s.high || s.price,
      low: s.low || s.price,
      volume: s.volume || 0,
    }
  } catch {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const code = req.query.code as string

  if (!code) {
    return res.status(400).json({ error: 'Missing required parameter: code' })
  }

  // 1. 内存缓存（60s TTL）
  const cacheKey = `kline:${code}`
  const cached = getCache<KlineItem[]>(cacheKey)
  if (cached) {
    return res.json({ data: cached.slice(-120) })
  }

  let history: KlineItem[] | null = null

  // 2. KV 持久层（Redis，部署环境）→ 本地文件（开发环境 fallback）
  history = await getKV<KlineItem[]>(`kline:${code}`)
  if (!history || history.length === 0) {
    history = loadKlineFile(code)
  }

  // 3. 外部 API 兜底（仅本地文件缺失时，多端点容错）
  if (!history) {
    const symbol = `hk${code.padStart(5, '0')}`
    const klineHosts = ['ifzq.gtimg.cn', 'web.ifzq.gtimg.cn']

    for (const host of klineHosts) {
      try {
        await waitForToken('tencent')
        const url = `https://${host}/appstock/app/fqkline/get?param=${symbol},day,,,240,qfq`
        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const json = await response.json()

        // 腾讯 K 线数据列顺序: [date, open, close, high, low, volume]
        const dayData = json?.data?.[symbol]?.day ?? json?.data?.[symbol]?.qfqday ?? []

        history = dayData.map((item: any[]): KlineItem => ({
          date: item[0],
          open: parseFloat(item[1]) || 0,
          close: parseFloat(item[2]) || 0,
          high: parseFloat(item[3]) || 0,
          low: parseFloat(item[4]) || 0,
          volume: parseFloat(item[5]) || 0,
        })).filter((item: KlineItem) => item.open > 0 && item.close > 0)

        if (history && history.length > 0) {
          // 写入 Redis 持久层（7 天过期），本地开发同时写入文件
          await setKV(`kline:${code}`, history, 7 * 24 * 60 * 60)
          try {
            const { writeFileSync, mkdirSync } = require('fs')
            if (!existsSync(KLINE_DIR)) mkdirSync(KLINE_DIR, { recursive: true })
            writeFileSync(join(KLINE_DIR, `${code}.json`), JSON.stringify({ updatedAt: Date.now(), data: history }))
          } catch {}
          break // 成功则不再尝试下一个端点
        }
      } catch (e) {
        console.error(`Failed to fetch kline from ${host}:`, e)
      }
    }
  }

  // 4. 拼接今日实时 K 线（仅今日已开盘时，避免未开盘时行情接口返回昨日数据导致重复）
  if (history && history.length > 0) {
    if (hasMarketOpenedToday()) {
      const today = await fetchTodayKline(code)
      if (today && history[history.length - 1].date !== today.date) {
        history = [...history, today]
      }
    }

    // 返回近半年数据（约 120 个交易日），本地缓存保留全量 240 行
    const result = history.slice(-120)
    setCache(cacheKey, result, { ttl: 60 * 1000 })
    return res.json({ data: result })
  }

  res.json({ data: [] })
}
