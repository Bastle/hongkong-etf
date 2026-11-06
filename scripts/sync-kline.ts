/**
 * K 线数据全量同步脚本
 * 用法: make sync-kline  或  npx tsx scripts/sync-kline.ts
 *
 * 遍历全市场股票代码，从腾讯 API 拉取 240 行日 K，
 * 写入 data/kline/{code}.json，限流 3 秒/次。
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'

// 直接定义，避免 tsconfig 路径解析问题
const DATA_DIR = join(__dirname, '..', 'data', 'kline')

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

// ---- 与 lib/server/stock-list.ts 保持一致 ----
function getDefaultStockCodes(): { code: string; name: string }[] {
  return [
    { code: '00001', name: '长和' }, { code: '00002', name: '中电控股' },
    { code: '00003', name: '香港中华煤气' }, { code: '00005', name: '汇丰控股' },
    { code: '00006', name: '电能实业' }, { code: '00011', name: '恒生银行' },
    { code: '00012', name: '恒基地产' }, { code: '00016', name: '新鸿基地产' },
    { code: '00017', name: '新世界发展' }, { code: '00019', name: '太古股份公司A' },
    { code: '00027', name: '银河娱乐' }, { code: '00066', name: '港铁公司' },
    { code: '00175', name: '吉利汽车' }, { code: '00241', name: '阿里健康' },
    { code: '00267', name: '中信股份' }, { code: '00288', name: '万洲国际' },
    { code: '00291', name: '华润啤酒' }, { code: '00322', name: '康师傅控股' },
    { code: '00386', name: '中国石油化工股份' }, { code: '00388', name: '香港交易所' },
    { code: '00669', name: '创科实业' }, { code: '00688', name: '中国海外发展' },
    { code: '00700', name: '腾讯控股' }, { code: '00762', name: '中国联通' },
    { code: '00823', name: '领展房产基金' }, { code: '00857', name: '中国石油股份' },
    { code: '00883', name: '中国海洋石油' }, { code: '00939', name: '建设银行' },
    { code: '00941', name: '中国移动' }, { code: '00960', name: '龙湖集团' },
    { code: '00968', name: '信义光能' }, { code: '00981', name: '中芯国际' },
    { code: '01038', name: '长江基建集团' }, { code: '01044', name: '恒安国际' },
    { code: '01093', name: '石药集团' }, { code: '01109', name: '华润置地' },
    { code: '01113', name: '长实集团' }, { code: '01177', name: '中国生物制药' },
    { code: '01211', name: '比亚迪股份' }, { code: '01299', name: '友邦保险' },
    { code: '01378', name: '中国宏桥' }, { code: '01398', name: '工商银行' },
    { code: '01766', name: '中国中车' }, { code: '01810', name: '小米集团-W' },
    { code: '01876', name: '百威亚太' }, { code: '01928', name: '金沙中国有限公司' },
    { code: '01929', name: '周大福珠宝集团' }, { code: '01997', name: '九龙仓置业' },
    { code: '02007', name: '碧桂园' }, { code: '02013', name: '微盟集团' },
    { code: '02018', name: '瑞声科技' }, { code: '02020', name: '安踏体育' },
    { code: '02269', name: '药明生物' }, { code: '02313', name: '申洲国际' },
    { code: '02318', name: '中国平安' }, { code: '02319', name: '蒙牛乳业' },
    { code: '02328', name: '中国财险' }, { code: '02331', name: '李宁' },
    { code: '02382', name: '舜宇光学科技' }, { code: '02388', name: '中银香港' },
    { code: '02518', name: '汽车之家' }, { code: '02628', name: '中国人寿' },
    { code: '02688', name: '新奥能源' }, { code: '02899', name: '紫金矿业' },
    { code: '03328', name: '交通银行' }, { code: '03333', name: '恒大地产' },
    { code: '03690', name: '美团-W' }, { code: '03692', name: '翰森制药' },
    { code: '03888', name: '金山软件' }, { code: '03968', name: '招商银行' },
    { code: '03988', name: '中国银行' }, { code: '06030', name: '中信证券' },
    { code: '06060', name: '众安在线' }, { code: '06098', name: '碧桂园服务' },
    { code: '06160', name: '百济神州' }, { code: '06185', name: '康希诺生物' },
    { code: '06618', name: '京东健康' }, { code: '06690', name: '海尔智家' },
    { code: '06862', name: '海底捞' }, { code: '06969', name: '思摩尔国际' },
    { code: '09618', name: '京东集团-SW' }, { code: '09626', name: '哔哩哔哩-W' },
    { code: '09633', name: '农夫山泉' }, { code: '09688', name: '再鼎医药' },
    { code: '09698', name: '万国数据-SW' }, { code: '09888', name: '百度集团-SW' },
    { code: '09961', name: '携程集团-S' }, { code: '09988', name: '阿里巴巴-W' },
    { code: '09999', name: '网易-S' },
  ]
}

// ---- 令牌桶限流（3 秒/次） ----
let lastRequest = 0
async function throttle(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastRequest
  if (elapsed < 3000) {
    await new Promise(r => setTimeout(r, 3000 - elapsed))
  }
  lastRequest = Date.now()
}

// ---- 多端点容错 ----
const KLINE_HOSTS = [
  'ifzq.gtimg.cn',
  'web.ifzq.gtimg.cn',
]

async function fetchKline(code: string): Promise<KlineItem[]> {
  const symbol = `hk${code.padStart(5, '0')}`
  let lastError: Error | null = null

  for (const host of KLINE_HOSTS) {
    try {
      const url = `https://${host}/appstock/app/fqkline/get?param=${symbol},day,,,240,qfq`
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const json = await response.json()
      // 腾讯 K 线数据列顺序: [date, open, close, high, low, volume]
      const dayData = json?.data?.[symbol]?.day ?? json?.data?.[symbol]?.qfqday ?? []

      const data = dayData.map((item: any[]): KlineItem => ({
        date: item[0],
        open: parseFloat(item[1]) || 0,
        close: parseFloat(item[2]) || 0,
        high: parseFloat(item[3]) || 0,
        low: parseFloat(item[4]) || 0,
        volume: parseFloat(item[5]) || 0,
      })).filter((item: KlineItem) => item.open > 0 && item.close > 0)

      if (data.length > 0) return data
    } catch (e: any) {
      lastError = e
    }
  }
  throw lastError ?? new Error('All K-line hosts failed')
}

// ---- 主流程 ----
async function main() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }

  const stocks = getDefaultStockCodes()
  console.log(`开始同步 ${stocks.length} 只股票的 K 线数据...`)

  let ok = 0
  let skip = 0
  let fail = 0

  for (let i = 0; i < stocks.length; i++) {
    const { code, name } = stocks[i]
    const filePath = join(DATA_DIR, `${code}.json`)

    // 已有当日数据则跳过
    if (existsSync(filePath)) {
      try {
        const existing: KlineFile = JSON.parse(readFileSync(filePath, 'utf-8'))
        const age = Date.now() - existing.updatedAt
        const isToday = new Date(existing.updatedAt).toDateString() === new Date().toDateString()
        if (isToday && existing.data.length > 0) {
          skip++
          continue
        }
      } catch {}
    }

    await throttle()
    try {
      const data = await fetchKline(code)
      if (data.length > 0) {
        const file: KlineFile = { updatedAt: Date.now(), data }
        writeFileSync(filePath, JSON.stringify(file))
        ok++
        console.log(`[${i + 1}/${stocks.length}] ✓ ${code} ${name} (${data.length} rows)`)
      } else {
        fail++
        console.log(`[${i + 1}/${stocks.length}] ✗ ${code} ${name} (empty data)`)
      }
    } catch (e: any) {
      fail++
      console.log(`[${i + 1}/${stocks.length}] ✗ ${code} ${name} (${e.message})`)
    }
  }

  console.log(`\n同步完成: ${ok} 成功, ${skip} 跳过, ${fail} 失败`)
  if (fail > 0) process.exit(1)
}

main()
