import { fetchWithFallback } from '../../utils/dataSource'
import { getAllStockCodes } from '../../utils/stock-list'
import { groupBySector } from '../../utils/sector-grouping'
import { getStockConnectList } from '../../utils/stock-connect'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  let codes = getAllStockCodes()

  // 港股通标的筛选
  if (query.stockConnect === 'true') {
    const eligibleCodes = await getStockConnectList()
    if (eligibleCodes.size > 0) {
      codes = codes.filter(c => eligibleCodes.has(c))
    }
  }

  const stocks = await fetchWithFallback(codes)
  const sectors = groupBySector(stocks)
  return sectors
})
