interface FilterBarProps {
  stockConnect: boolean
  southbound: boolean
  ahPremium: boolean
  klineColorMode: 'open' | 'prevClose'
  onToggleStockConnect: () => void
  onToggleSouthbound: () => void
  onToggleAHPremium: () => void
  onSetColorMode: (mode: 'open' | 'prevClose') => void
}

export default function FilterBar({
  stockConnect,
  southbound,
  ahPremium,
  klineColorMode,
  onToggleStockConnect,
  onToggleSouthbound,
  onToggleAHPremium,
  onSetColorMode,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onToggleStockConnect}
        className={`px-3 py-1 text-xs rounded transition-colors ${
          stockConnect
            ? 'bg-orange-600 text-white'
            : 'bg-white/10 text-gray-400 hover:bg-white/20'
        }`}
      >
        港股通标的
      </button>
      <button
        onClick={onToggleSouthbound}
        className={`px-3 py-1 text-xs rounded transition-colors ${
          southbound
            ? 'bg-blue-600 text-white'
            : 'bg-white/10 text-gray-400 hover:bg-white/20'
        }`}
      >
        南向资金
      </button>
      <button
        onClick={onToggleAHPremium}
        className={`px-3 py-1 text-xs rounded transition-colors ${
          ahPremium
            ? 'bg-purple-600 text-white'
            : 'bg-white/10 text-gray-400 hover:bg-white/20'
        }`}
      >
        AH 溢价
      </button>
      <div className="w-px h-4 bg-white/10 mx-1" />
      <span className="text-[10px] text-gray-500 mr-0.5">K线颜色</span>
      <div className="flex rounded overflow-hidden">
        <button
          onClick={() => onSetColorMode('open')}
          className={`px-2.5 py-1 text-xs transition-colors ${
            klineColorMode === 'open'
              ? 'bg-green-600 text-white font-medium'
              : 'bg-white/10 text-gray-400 hover:bg-white/20'
          }`}
        >
          开收
        </button>
        <button
          onClick={() => onSetColorMode('prevClose')}
          className={`px-2.5 py-1 text-xs transition-colors ${
            klineColorMode === 'prevClose'
              ? 'bg-green-600 text-white font-medium'
              : 'bg-white/10 text-gray-400 hover:bg-white/20'
          }`}
        >
          昨收
        </button>
      </div>
    </div>
  )
}
