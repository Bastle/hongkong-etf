import { fetchSouthboundAggregate, fetchSouthboundStocks } from '../../utils/southbound'

export default defineEventHandler(async () => {
  const [aggregate, stocks] = await Promise.all([
    fetchSouthboundAggregate(),
    fetchSouthboundStocks(100),
  ])

  return {
    aggregate: aggregate || { buy: 0, sell: 0, net: 0, date: '' },
    stocks,
    timestamp: Date.now(),
  }
})
