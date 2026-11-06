import type { HKStockQuote } from '../../types/market'

const TENCENT_API_BASE = 'http://qt.gtimg.cn/q='

/**
 * 解析腾讯 API 响应
 * 响应格式: v_hk{code}="field1~field2~..."
 * code 可以是数字（股票）或字母（指数如 HSI、HSTECH）
 */
export function parseTencentResponse(text: string): Partial<HKStockQuote>[] {
  const stocks: Partial<HKStockQuote>[] = []
  const lines = text.split(';').filter(line => line.includes('="'))

  for (const line of lines) {
    const match = line.match(/v_hk([A-Za-z0-9]+)="(.+)"/)
    if (!match) continue

    const code = match[1]
    const fields = match[2].split('~')

    if (fields.length < 50) continue

    const price = safeFloat(fields[3])
    if (price <= 0) continue

    stocks.push({
      code,
      name: fields[1] || '',
      price,
      prevClose: safeFloat(fields[4]),
      open: safeFloat(fields[5]),
      volume: safeFloat(fields[6]),
      amount: safeFloat(fields[37]),
      high: safeFloat(fields[33]),
      low: safeFloat(fields[34]),
      change: safeFloat(fields[31]),
      changePercent: safeFloat(fields[32]),
      turnover: safeFloat(fields[38]),
      pe: safeFloat(fields[39]),
      pb: safeFloat(fields[46]),
      marketCap: safeFloat(fields[45]) * 1e8,
      lotSize: safeInt(fields[50]) || 100,
    })
  }

  return stocks
}

/**
 * 批量获取股票数据
 */
export async function fetchStocksBatch(codes: string[]): Promise<Partial<HKStockQuote>[]> {
  const symbols = codes.map(c => `hk${c.padStart(5, '0')}`).join(',')
  const url = `${TENCENT_API_BASE}${symbols}`

  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  const decoder = new TextDecoder('gbk')
  const text = decoder.decode(buffer)

  return parseTencentResponse(text)
}

/**
 * 获取恒生指数系列数据
 */
export async function fetchIndices(): Promise<Partial<HKStockQuote>[]> {
  const symbols = 'hkHSI,hkHSCCI,hkHSTECH'
  const url = `${TENCENT_API_BASE}${symbols}`

  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  const decoder = new TextDecoder('gbk')
  const text = decoder.decode(buffer)

  return parseTencentResponse(text)
}

/**
 * 分批获取所有股票
 * 每批 50 只，批次间等待 3.5 秒
 */
export async function fetchAllStocks(
  codes: string[],
  batchSize = 50,
  batchDelay = 3500
): Promise<Partial<HKStockQuote>[]> {
  const results: Partial<HKStockQuote>[] = []

  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize)
    const batchResults = await fetchStocksBatch(batch)
    results.push(...batchResults)

    if (i + batchSize < codes.length) {
      await new Promise(r => setTimeout(r, batchDelay))
    }
  }

  return results
}

function safeFloat(value: string | undefined): number {
  if (!value || value === '' || value === '-') return 0
  const num = parseFloat(value)
  return Number.isFinite(num) ? num : 0
}

function safeInt(value: string | undefined): number {
  if (!value || value === '' || value === '-') return 0
  const num = parseInt(value, 10)
  return Number.isFinite(num) ? num : 0
}
