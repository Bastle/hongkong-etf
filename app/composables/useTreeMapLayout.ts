import { computed, type Ref } from 'vue'
import { hierarchy, treemap, type HierarchyRectangularNode } from 'd3-hierarchy'
import type { HKStockQuote, SectorData, TreeNode } from '../types/market'
import { getHeatColor } from '../utils/color'

export interface TreeMapOptions {
  width: number
  height: number
  minSize?: number
}

// D3 层级中间数据结构
interface SectorNode {
  name: string
  children?: SectorNode[]
  _stock?: HKStockQuote
}

/**
 * 构建 D3 兼容的层级数据
 */
export function buildHierarchy(
  _stocks: HKStockQuote[],
  sectors: SectorData[],
): SectorNode {
  return {
    name: 'root',
    children: sectors.map(sector => ({
      name: sector.name,
      children: sector.stocks.map(stock => ({
        name: `${stock.code} ${stock.name}`,
        _stock: stock,
      } as SectorNode)),
    })),
  }
}

/**
 * 计算 treemap 布局
 * 纯函数，无副作用
 */
export function computeLayout(
  stocks: HKStockQuote[],
  sectors: SectorData[],
  options: TreeMapOptions,
): HierarchyRectangularNode<SectorNode> {
  const { width, height } = options

  // 市值上限：单只股票不超过总市值的 15%，防止超大盘股独占画面
  const totalMarketCap = stocks.reduce((sum, s) => sum + s.marketCap, 0)
  const MAX_RATIO = 0.15
  const cappedStocks = stocks.map(s => ({
    ...s,
    effectiveCap: Math.min(s.marketCap, totalMarketCap * MAX_RATIO),
  }))

  // 用 cappedStocks 替换原始市值
  const cappedSectors = sectors.map(sector => ({
    ...sector,
    stocks: sector.stocks.map(s => cappedStocks.find(cs => cs.code === s.code) ?? s),
  }))

  const data = buildHierarchy(cappedStocks, cappedSectors)

  const root = hierarchy(data)
    .sum((d: any) => d._stock ? d._stock.effectiveCap ?? d._stock.marketCap : 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  const layout = treemap<SectorNode>()
    .size([width, height])
    .paddingOuter(3)
    .paddingInner(1)
    .paddingTop(20)
    .round(true)

  return layout(root)
}

/**
 * 将 D3 布局输出转换为扁平 TreeNode[] 数组
 * @param colorFn 自定义颜色函数，默认使用涨跌幅热力图
 * @param colorMap 颜色覆盖 Map（code → color），用于 AH 溢价等模式
 */
export function flattenLayout(
  root: HierarchyRectangularNode<SectorNode>,
  colorFn?: (value: number) => string,
  colorMap?: Map<string, string>,
): TreeNode[] {
  return root.leaves().map(leaf => {
    const stock = (leaf.data as any)._stock as HKStockQuote
    const color = colorMap?.get(stock.code)
      ?? (colorFn ? colorFn(stock.changePercent) : getHeatColor(stock.changePercent))
    return {
      data: stock,
      x0: leaf.x0,
      y0: leaf.y0,
      x1: leaf.x1,
      y1: leaf.y1,
      color,
      sector: leaf.parent?.data.name ?? '',
    }
  })
}

/**
 * 过滤掉尺寸过小的叶子节点
 */
export function filterSmallLeaves(
  leaves: TreeNode[],
  minSize: number = 0,
): TreeNode[] {
  if (minSize <= 0) return leaves
  return leaves.filter(leaf => {
    const w = leaf.x1 - leaf.x0
    const h = leaf.y1 - leaf.y0
    return w >= minSize && h >= minSize
  })
}

/**
 * 行业分组矩形（用于绘制分组标题带）
 */
export interface SectorRect {
  name: string
  x0: number
  y0: number
  x1: number
  y1: number
  avgChange: number
  stockCount: number
}

/**
 * 从 D3 层级中提取行业分组矩形
 */
export function getSectorRects(
  root: HierarchyRectangularNode<SectorNode>,
): SectorRect[] {
  return root.children?.map(node => {
    const stocks = node.leaves().map(l => (l.data as any)._stock as HKStockQuote)
    const avgChange = stocks.length > 0
      ? stocks.reduce((sum, s) => sum + s.changePercent, 0) / stocks.length
      : 0
    return {
      name: node.data.name,
      x0: node.x0,
      y0: node.y0,
      x1: node.x1,
      y1: node.y1,
      avgChange,
      stockCount: stocks.length,
    }
  }) ?? []
}

/**
 * Vue composable：响应式 treemap 布局
 */
export function useTreeMapLayout(
  stocks: Ref<HKStockQuote[]>,
  sectors: Ref<SectorData[]>,
  options: Ref<TreeMapOptions>,
) {
  const layoutResult = computed(() => {
    if (stocks.value.length === 0 || sectors.value.length === 0) {
      return null
    }
    const root = computeLayout(stocks.value, sectors.value, options.value)
    const allLeaves = flattenLayout(root)
    const minSize = options.value.minSize ?? 0
    return {
      root,
      leaves: filterSmallLeaves(allLeaves, minSize),
    }
  })

  return { layout: layoutResult }
}
