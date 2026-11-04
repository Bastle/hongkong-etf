declare module 'd3-hierarchy' {
  export interface HierarchyDatum {
    name?: string
    value?: number
    children?: HierarchyDatum[]
  }

  export interface HierarchyNode<Datum> {
    data: Datum
    depth: number
    height: number
    parent: HierarchyNode<Datum> | null
    children?: HierarchyNode<Datum>[]
    value?: number
    leaves(): HierarchyRectangularNode<Datum>[]
    sum(value: (d: Datum) => number): HierarchyNode<Datum>
    sort(compare: (a: HierarchyNode<Datum>, b: HierarchyNode<Datum>) => number): HierarchyNode<Datum>
  }

  export interface HierarchyRectangularNode<Datum> extends HierarchyNode<Datum> {
    x0: number
    y0: number
    x1: number
    y1: number
  }

  export interface TreemapLayout<Datum> {
    (root: HierarchyNode<Datum>): HierarchyRectangularNode<Datum>
    size(size: [number, number]): TreemapLayout<Datum>
    tile(tile: (node: HierarchyRectangularNode<Datum>, x0: number, y0: number, x1: number, y1: number) => void): TreemapLayout<Datum>
    paddingOuter(padding: number): TreemapLayout<Datum>
    paddingInner(padding: number): TreemapLayout<Datum>
    paddingTop(padding: number): TreemapLayout<Datum>
    round(round: boolean): TreemapLayout<Datum>
  }

  export function hierarchy<Datum>(data: Datum, children?: (d: Datum) => Datum[]): HierarchyNode<Datum>
  export function treemap<Datum>(): TreemapLayout<Datum>
}
