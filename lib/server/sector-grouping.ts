import type { HKStockQuote, SectorData } from '../../types/market'
import { HSCI_SECTORS, type SectorId } from '../../data/hsci-sectors'
import { getSectorForStock } from '../../data/stock-sector-map'

/**
 * 将股票按 HSCI 行业分组
 * 输出保持 HSCI 预定义行业顺序
 */
export function groupBySector(
  stocks: HKStockQuote[],
  sectorMap?: Record<string, SectorId>,
): SectorData[] {
  const groups = new Map<SectorId, HKStockQuote[]>()

  for (const stock of stocks) {
    const sectorId = sectorMap?.[stock.code] ?? getSectorForStock(stock.code, stock.marketCap)
    if (!groups.has(sectorId)) {
      groups.set(sectorId, [])
    }
    groups.get(sectorId)!.push(stock)
  }

  const result: SectorData[] = []
  for (const sector of HSCI_SECTORS) {
    const sectorStocks = groups.get(sector.id) ?? []
    if (sectorStocks.length > 0) {
      result.push({ name: sector.name, stocks: sectorStocks })
    }
  }

  return result
}
