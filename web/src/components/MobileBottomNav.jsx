// 2장·7.5절: 모바일 하단 고정 5탭 (검색/경쟁사/키워드/저장내역/설정)
const TABS = [
  { key: 'search', icon: '🔍', label: '검색' },
  { key: 'competitor', icon: '🏢', label: '경쟁사' },
  { key: 'keyword', icon: '★', label: '키워드' },
  { key: 'saved', icon: '📁', label: '저장내역' },
  { key: 'settings', icon: '⚙', label: '설정' },
];

export default function MobileBottomNav({ active = 'search', onSelect }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-cream-400 bg-cream-100 md:hidden">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect?.(tab.key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[9px] ${
              isActive ? 'text-clay-600' : 'text-ink-300'
            }`}
          >
            <span className="text-[18px] leading-none">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
