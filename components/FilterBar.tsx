interface FilterBarProps {
  stockConnect: boolean
  southbound: boolean
  ahPremium: boolean
  onToggleStockConnect: () => void
  onToggleSouthbound: () => void
  onToggleAHPremium: () => void
}

export default function FilterBar({
  stockConnect,
  southbound,
  ahPremium,
  onToggleStockConnect,
  onToggleSouthbound,
  onToggleAHPremium,
}: FilterBarProps) {
  return (
    <div className="flex gap-1">
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
    </div>
  )
}
