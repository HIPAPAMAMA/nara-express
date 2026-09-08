// 모바일 하단 네비게이션용 단순 선 아이콘 — currentColor를 써서 활성/비활성
// 색상(text-clay-600 / text-ink-300)을 그대로 물려받는다. 컬러 이모지 대신 브랜드 톤에 맞춤.
const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function HomeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9.5h12V10" />
      <line x1="10" y1="19.5" x2="10" y2="14.5" />
      <line x1="14" y1="19.5" x2="14" y2="14.5" />
    </svg>
  );
}

export function SettingsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <circle cx="9" cy="7" r="2" fill="currentColor" stroke="none" />
      <line x1="4" y1="14" x2="20" y2="14" />
      <circle cx="15" cy="14" r="2" fill="currentColor" stroke="none" />
      <line x1="4" y1="19" x2="20" y2="19" />
      <circle cx="11" cy="19" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...common}>
      <circle cx="11" cy="11" r="6.5" />
      <line x1="20" y1="20" x2="15.5" y2="15.5" />
    </svg>
  );
}
