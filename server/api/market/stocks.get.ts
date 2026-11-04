import { fetchStocksBatch } from '../../utils/tencent'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const codesStr = query.codes as string

  if (!codesStr) {
    throw createError({
      statusCode: 400,
      message: 'Missing required parameter: codes'
    })
  }

  const codes = codesStr.split(',').map(c => c.trim()).filter(Boolean)

  if (codes.length === 0) {
    return []
  }

  // 限制单次请求数量
  const batchSize = Math.min(codes.length, 50)
  const stocks = await fetchStocksBatch(codes.slice(0, batchSize))

  return stocks
})
