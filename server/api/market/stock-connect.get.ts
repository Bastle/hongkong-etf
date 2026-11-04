import { getStockConnectList } from '../../utils/stock-connect'

export default defineEventHandler(async () => {
  const codes = await getStockConnectList()
  return {
    codes: Array.from(codes),
    count: codes.size,
    timestamp: Date.now(),
  }
})
