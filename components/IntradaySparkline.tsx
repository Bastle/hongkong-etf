import { useState, useEffect, useMemo } from 'react'

interface IntradayPoint {
  time: string
  price: number
}

interface IntradayData {
  points: IntradayPoint[]
  prevClose: number
}

interface IntradaySparklineProps {
  code: string
  prevClose?: number
  width?: number
  height?: number
}

export default function IntradaySparkline({
  code,
  prevClose: prevCloseProp,
  width = 120,
  height = 40,
}: IntradaySparklineProps) {
  const [data, setData] = useState<IntradayData | null>(null)

  useEffect(() => {
    if (!code) return
    let cancelled = false

    fetch(`/api/market/intraday?code=${code}`)
      .then(res => res.json())
      .then(json => {
        if (!cancelled && json.data) setData(json.data)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [code])

  const svgContent = useMemo(() => {
    if (!data || data.points.length < 2) return null

    const prices = data.points.map(p => p.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1

    const prevClose = prevCloseProp || data.prevClose || prices[0]
    const isUp = prices[prices.length - 1] >= prevClose
    const lineColor = isUp ? '#f63538' : '#00e676'

    // 生成折线路径
    const padding = 2
    const w = width - padding * 2
    const h = height - padding * 2

    const pathPoints = prices.map((price, i) => {
      const x = padding + (i / (prices.length - 1)) * w
      const y = padding + (1 - (price - min) / range) * h
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    const polyline = pathPoints.join(' ')

    // 前收盘参考线
    const refY = padding + (1 - (prevClose - min) / range) * h
    const refYClamped = Math.max(padding, Math.min(height - padding, refY))

    // 渐变填充区域
    const areaPath = `M${pathPoints[0]} L${polyline.replace(/ /g, ' L')} L${(padding + w).toFixed(1)},${height - padding} L${padding},${height - padding} Z`

    return { polyline, lineColor, refY: refYClamped, areaPath, isUp }
  }, [data, prevCloseProp, width, height])

  if (!svgContent) {
    return <div style={{ width, height }} />
  }

  const gradientId = `spark-${code}`

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={svgContent.lineColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={svgContent.lineColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* 填充区域 */}
      <path d={svgContent.areaPath} fill={`url(#${gradientId})`} />
      {/* 前收盘参考虚线 */}
      <line
        x1="0" y1={svgContent.refY}
        x2={width} y2={svgContent.refY}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
        strokeDasharray="3,3"
      />
      {/* 价格折线 */}
      <polyline
        points={svgContent.polyline}
        fill="none"
        stroke={svgContent.lineColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
