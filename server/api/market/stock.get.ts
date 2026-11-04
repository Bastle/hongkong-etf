import { fetchStocksBatch } from '../../utils/tencent'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Missing required parameter: code'
    })
  }

  const stocks = await fetchStocksBatch([code])

  if (stocks.length === 0) {
    return { code, name: '', price: 0, error: 'Stock not found' }
  }

  return stocks[0]
})
