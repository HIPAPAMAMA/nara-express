import { SearchIcon, HomeIcon, SettingsIcon } from './icons';

// 모바일 하단 탭 3개 — PC 상단 대메뉴(통합검색·대시보드·내설정)와 동일 구조.
// 나머지 화면(키워드·경쟁사·쇼핑몰·저장내역·평가분석)은 대시보드 안 메뉴 카드로 진입한다.
const TABS = [
  { key: 'search', Icon: SearchIcon, label: '통합검색' },
  { key: 'dashboard', Icon: HomeIcon, label: '대시보드' },
  { key: 'mysettings', Icon: SettingsIcon, label: '내설정' },
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
