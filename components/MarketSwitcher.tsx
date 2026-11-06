interface MarketSwitcherProps {
  value: string
  onChange: (value: string) => void
}

const OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'main', label: '主板' },
  { value: 'gem', label: '创业板' },
]

export default function MarketSwitcher({ value, onChange }: MarketSwitcherProps) {
  return (
    <div className="flex gap-1">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            value === opt.value
              ? 'bg-blue-600 text-white'
              : 'bg-white/10 text-gray-400 hover:bg-white/20'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
