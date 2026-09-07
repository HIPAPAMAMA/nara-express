import { HomeIcon, SearchIcon, StarIcon, FolderIcon, MoreIcon } from './icons';

// 모바일 하단 고정 5탭 (대시보드/검색/키워드/저장내역/더보기) — 대시보드가 메인이라 첫 자리 차지,
// 경쟁사·내 업체·쇼핑몰·설정·평가분석은 '더보기' 탭 → MobileMoreSheet로 진입
const TABS = [
  { key: 'dashboard', Icon: HomeIcon, label: '대시보드' },
  { key: 'search', Icon: SearchIcon, label: '검색' },
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
