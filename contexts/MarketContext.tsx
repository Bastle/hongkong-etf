import { createContext, useContext, useReducer, useEffect, useRef, type ReactNode } from 'react'
import type { SouthboundFlow, SouthboundAggregate, AHPremiumPair } from '@/types/market'
import { getPremiumColor } from '@/lib/color'

// --- State ---

interface MarketState {
  // 筛选
  marketFilter: string // 'all' | 'main' | 'gem'
  stockConnectEnabled: boolean

  // 南向资金
  southboundEnabled: boolean
  southboundAggregate: SouthboundAggregate | null
  southboundFlows: Map<string, SouthboundFlow>

  // AH 溢价
  ahEnabled: boolean
  ahPairs: AHPremiumPair[]
  ahPremiumMap: Map<string, number>

  // K 线颜色模式
  klineColorMode: 'open' | 'prevClose'
}

const initialState: MarketState = {
  marketFilter: 'all',
  stockConnectEnabled: false,
  southboundEnabled: false,
  southboundAggregate: null,
  southboundFlows: new Map(),
  ahEnabled: false,
  ahPairs: [],
  ahPremiumMap: new Map(),
  klineColorMode: 'open',
}

// --- Actions ---

type MarketAction =
  | { type: 'SET_FILTER'; payload: string }
  | { type: 'TOGGLE_STOCK_CONNECT' }
  | { type: 'TOGGLE_SOUTHBOUND' }
  | { type: 'SET_SOUTHBOUND'; payload: { aggregate: SouthboundAggregate | null; flows: Map<string, SouthboundFlow> } }
  | { type: 'TOGGLE_AH' }
  | { type: 'SET_AH'; payload: { pairs: AHPremiumPair[]; premiumMap: Map<string, number> } }
  | { type: 'SET_KLINE_COLOR_MODE'; payload: 'open' | 'prevClose' }

function marketReducer(state: MarketState, action: MarketAction): MarketState {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, marketFilter: action.payload }
    case 'TOGGLE_STOCK_CONNECT':
      return { ...state, stockConnectEnabled: !state.stockConnectEnabled }
    case 'TOGGLE_SOUTHBOUND':
      return { ...state, southboundEnabled: !state.southboundEnabled }
    case 'SET_SOUTHBOUND':
      return {
        ...state,
        southboundAggregate: action.payload.aggregate,
        southboundFlows: action.payload.flows,
      }
    case 'TOGGLE_AH':
      return { ...state, ahEnabled: !state.ahEnabled }
    case 'SET_AH':
      return {
        ...state,
        ahPairs: action.payload.pairs,
        ahPremiumMap: action.payload.premiumMap,
      }
    case 'SET_KLINE_COLOR_MODE':
      return { ...state, klineColorMode: action.payload }
  }
}

// --- Context ---

interface MarketContextValue {
  state: MarketState
  dispatch: React.Dispatch<MarketAction>
  // 计算属性
  southboundMap: Map<string, SouthboundFlow> | undefined
  ahColorMap: Map<string, string> | undefined
  formattedSouthbound: { buy: string; sell: string; net: string; isNetIn: boolean; date: string } | null
}

const MarketContext = createContext<MarketContextValue | null>(null)

// --- Provider ---

export function MarketProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(marketReducer, initialState)
  const refreshTimer = useRef<ReturnType<typeof setInterval>>()

  // 南向资金数据获取
  useEffect(() => {
    if (!state.southboundEnabled) return

    async function fetchSouthbound() {
      try {
        const res = await fetch('/api/market/southbound')
        const json = await res.json()
        const flows = new Map<string, SouthboundFlow>()
        for (const item of json.stocks ?? []) {
          if (item.code) flows.set(item.code, item)
        }
        dispatch({
          type: 'SET_SOUTHBOUND',
          payload: { aggregate: json.aggregate ?? null, flows },
        })
      } catch (e) {
        console.error('Failed to fetch southbound:', e)
      }
    }

    fetchSouthbound()
    refreshTimer.current = setInterval(fetchSouthbound, 30000)
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current)
    }
  }, [state.southboundEnabled])

  // AH 溢价数据获取
  useEffect(() => {
    if (!state.ahEnabled) return

    async function fetchAH() {
      try {
        const res = await fetch('/api/market/ah-premium')
        const json = await res.json()
        const premiumMap = new Map<string, number>()
        for (const pair of json.pairs ?? []) {
          if (pair.hkCode && typeof pair.premium === 'number') {
            premiumMap.set(pair.hkCode, pair.premium)
          }
        }
        dispatch({
          type: 'SET_AH',
          payload: { pairs: json.pairs ?? [], premiumMap },
        })
      } catch (e) {
        console.error('Failed to fetch AH premium:', e)
      }
    }

    fetchAH()
    const timer = setInterval(fetchAH, 30000)
    return () => clearInterval(timer)
  }, [state.ahEnabled])

  // 计算属性
  const southboundMap = state.southboundEnabled && state.southboundFlows.size > 0
    ? state.southboundFlows
    : undefined

  const ahColorMap = state.ahEnabled && state.ahPremiumMap.size > 0
    ? new Map(
        Array.from(state.ahPremiumMap.entries()).map(([code, premium]) => [
          code,
          getPremiumColor(premium),
        ])
      )
    : undefined

  const formattedSouthbound = state.southboundAggregate
    ? {
        buy: (state.southboundAggregate.buy / 1e8).toFixed(2),
        sell: (state.southboundAggregate.sell / 1e8).toFixed(2),
        net: Math.abs(state.southboundAggregate.net / 1e8).toFixed(2),
        isNetIn: state.southboundAggregate.net >= 0,
        date: state.southboundAggregate.date,
      }
    : null

  return (
    <MarketContext.Provider
      value={{
        state,
        dispatch,
        southboundMap,
        ahColorMap,
        formattedSouthbound,
      }}
    >
      {children}
    </MarketContext.Provider>
  )
}

// --- Hook ---

export function useMarket() {
  const ctx = useContext(MarketContext)
  if (!ctx) throw new Error('useMarket must be used within MarketProvider')
  return ctx
}
