// 모바일 하단 네비게이션·더보기 시트용 단순 선 아이콘 — currentColor를 써서 활성/비활성
// 색상(text-clay-600 / text-ink-300)을 그대로 물려받는다. 컬러 이모지 대신 브랜드 톤에 맞춤.
const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <circle cx="11" cy="11" r="6.5" />
      <line x1="20" y1="20" x2="15.5" y2="15.5" />
    </svg>
  );
}

export function BuildingIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <rect x="5" y="4" width="14" height="17" rx="1" />
      <line x1="9" y1="8" x2="9" y2="8.01" />
      <line x1="15" y1="8" x2="15" y2="8.01" />
      <line x1="9" y1="12" x2="9" y2="12.01" />
      <line x1="15" y1="12" x2="15" y2="12.01" />
      <line x1="10" y1="21" x2="10" y2="17" />
      <line x1="14" y1="21" x2="14" y2="17" />
    </svg>
  );
}

export function StarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8z" />
    </svg>
  );
}

export function FolderIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <path d="M4 6.5a1 1 0 0 1 1-1h4.5l2 2.2H19a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

export function MoreIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <circle cx="5.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FactoryIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <path d="M4 20V11l4.5 3V11l4.5 3V11l4.5 3V7l2.5-2.5V20z" />
      <line x1="4" y1="20" x2="20" y2="20" />
    </svg>
  );
}

export function CartIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <path d="M3.5 4.5h2l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h7.4a1.5 1.5 0 0 0 1.5-1.2l1.4-7.2H6.4" />
      <circle cx="9.5" cy="20" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BellIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <path d="M6 10a6 6 0 0 1 12 0v4.5l1.6 2.5H4.4L6 14.5z" />
      <path d="M10 19.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function ChartIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <line x1="5" y1="20" x2="5" y2="13" />
      <line x1="12" y1="20" x2="12" y2="8" />
      <line x1="19" y1="20" x2="19" y2="4" />
      <line x1="3" y1="20" x2="21" y2="20" />
    </svg>
  );
}
