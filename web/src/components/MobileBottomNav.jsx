import { SearchIcon, BuildingIcon, StarIcon, FolderIcon, MoreIcon } from './icons';

// 2장·7.5절: 모바일 하단 고정 5탭 (검색/경쟁사/키워드/저장내역/더보기)
// 내 업체·쇼핑몰·설정·평가분석은 '더보기' 탭 → MobileMoreSheet로 진입 (자체 탭 자리가 없어서)
const TABS = [
  { key: 'search', Icon: SearchIcon, label: '검색' },
  { key: 'competitor', Icon: BuildingIcon, label: '경쟁사' },
  { key: 'keyword', Icon: StarIcon, label: '키워드' },
  { key: 'saved', Icon: FolderIcon, label: '저장내역' },
  { key: 'more', Icon: MoreIcon, label: '더보기' },
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
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${
              isActive ? 'text-clay-600' : 'text-ink-300'
            }`}
          >
            <tab.Icon className="h-[19px] w-[19px]" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
