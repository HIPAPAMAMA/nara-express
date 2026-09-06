// 6.1 표기 규칙

export function formatAmount(won) {
  if (won === null || won === undefined) return '예산 미제공';
  const comma = won.toLocaleString('ko-KR');
  const eok = won / 100000000;
  return `${comma}원 ${eok.toFixed(1)}억`;
}

export function formatRate(rate) {
  if (rate === null || rate === undefined) return '-';
  return rate.toFixed(2);
}

export function formatDate(dt) {
  if (!dt) return '-';
  return String(dt).slice(0, 10);
}

export function formatDateTime(dt, { seconds = false } = {}) {
  if (!dt) return '-';
  const s = String(dt);
  return seconds ? s.slice(0, 19) : s.slice(0, 16);
}

/** 마감 임박 D-n 뱃지 (7.5절: n<=7일 때만 노출, 그 이상은 날짜만) */
export function deadlineBadge(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const target = new Date(String(deadline).replace(' ', 'T'));
  const diffDays = Math.ceil((target - now) / 86400000);
  if (diffDays < 0) return { label: '마감', tone: 'neutral' };
  if (diffDays === 0) return { label: 'D-DAY', tone: 'warning' };
  if (diffDays <= 7) return { label: `D-${diffDays}`, tone: 'warning' };
  return null;
}
