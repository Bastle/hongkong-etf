import type { HKStockQuote } from '../../types/market'

const SINA_API_BASE = 'http://hq.sinajs.cn/list='

/**
 * 解析新浪 API 响应
 * 响应格式: var hq_str_rt_hk{code}="field1,field2,..."
 */
export function parseSinaResponse(text: string): Partial<HKStockQuote>[] {
  const stocks: Partial<HKStockQuote>[] = []
  const lines = text.split('\n').filter(line => line.includes('="'))

  for (const line of lines) {
    const match = line.match(/hq_str_rt_hk(\d+)="(.+)"/)
    if (!match) continue

    const code = match[1].replace(/^0+/, '').padStart(4, '0')
    const fields = match[2].split(',')

    const price = parseFloat(fields[6]) || 0
    if (price <= 0) continue

    stocks.push({
      code,
      name: fields[1] || '',
      price: parseFloat(price.toFixed(2)),
      changePercent: parseFloat((parseFloat(fields[8]) || 0).toFixed(2)),
      volume: parseFloat(fields[12]) || 0,
      marketCap: 0, // 新浪不提供市值
      prevClose: parseFloat(fields[3]) || 0,
    })
  }

  return stocks
}

/**
 * 批量获取新浪股票数据
 */
export async function fetchStocksSina(codes: string[]): Promise<Partial<HKStockQuote>[]> {
  const symbols = codes.map(c => `rt_hk${c.padStart(5, '0')}`).join(',')
  const url = `${SINA_API_BASE}${symbols}`

  try {
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://finance.sina.com.cn',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    const text = await response.text()
    return parseSinaResponse(text)
  } catch {
    return []
  }
}
