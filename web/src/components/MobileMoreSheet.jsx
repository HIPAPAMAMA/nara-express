import { FactoryIcon, CartIcon, BellIcon, ChartIcon } from './icons';

// 모바일 하단 탭 '더보기' → 자리가 없는 나머지 화면들로 가는 바텀시트
const ITEMS = [
  { key: 'company', Icon: FactoryIcon, label: '내 업체' },
  { key: 'mall', Icon: CartIcon, label: '쇼핑몰 상품검색' },
  { key: 'settings', Icon: BellIcon, label: '알림·설정' },
  { key: 'evaluation', Icon: ChartIcon, label: '평가분석', badge: '준비중' },
];

export default function MobileMoreSheet({ open, onClose, onSelect }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink-800/40 md:hidden" onClick={onClose}>
      <div
        className="w-full rounded-t-xl bg-cream-50 pb-[env(safe-area-inset-bottom)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-cream-400" />
        <div className="p-2">
          {ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                onSelect(item.key);
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-ink-800 active:bg-cream-200"
            >
              <item.Icon className="h-5 w-5 text-ink-400" />
              <span className="flex-1">{item.label}</span>
              {item.badge && <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] text-ink-400">{item.badge}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
