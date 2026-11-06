export interface HKStockQuote {
  code: string
  name: string
  price: number
  prevClose: number
  change: number
  changePercent: number
  volume: number
  amount: number
  marketCap: number
  high: number
  low: number
  open: number
  turnover: number
  pe: number
  pb: number
  lotSize: number
  board: 'main' | 'gem' | 'wvr' | 'secondary'
  source: 'tencent' | 'sina'
  timestamp: number
}

export interface SectorData {
  name: string
  stocks: HKStockQuote[]
}

export interface TreeNode {
  data: HKStockQuote
  x0: number
  y0: number
  x1: number
  y1: number
  color?: string
  sector?: string
}

export interface IndexData {
  code: string
  name: string
  value: number
  change: number
  changePercent: number
}

export interface SouthboundFlow {
  code: string
  name: string
  buy: number
  sell: number
  net: number
}

export interface SouthboundAggregate {
  buy: number
  sell: number
  net: number
  date: string
}

export interface AHPremiumPair {
  hkCode: string
  hkName: string
  hkPrice: number
  aCode: string
  aName: string
  aPrice: number
  premium: number
  exchangeRate: number
}
