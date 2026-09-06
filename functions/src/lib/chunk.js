// 2단계 청크 분할 엔진
//
// ⚠️ 실측 정정 (2026-09-05): T-1에서 "31일 고정 상한"으로 확인했던 것은 부정확했다.
// 실제 규칙은 **"시작일 + 1개월(달력 기준)"**이며, 날짜 수가 아니라 캘린더 월 단위다.
// 말일 시작은 다음달 말일로 클램프된다 (예: 1/31+1개월=2/28, 3/31+1개월=4/30 — JS의
// Date.setMonth 오버플로 방식(3/31+1개월=5/1)과는 다르다). 실측으로 검증한 사실:
//   - 같은 일자(예: 8/5~9/5), 말일 클램프(1/31~2/28, 3/31~4/30) 등 "정확히 +1개월"은 전부 정상
//   - 고정 일수(31일)로 계산한 범위는 시작일에 따라 성공/실패가 갈림(달의 실제 일수가 달라서)
// 따라서 청크는 반드시 달력 월 연산으로 만들어야 한다.

function toDate(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function pad(n) {
  return String(n).padStart(2, '0');
}
function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysInMonth(year, monthIndex0) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

/** 말일 클램프 방식으로 date에 개월수를 더한다 (나라장터 API 실측 규칙과 동일하게). */
function addMonthsClamped(date, months) {
  const totalMonths = date.getFullYear() * 12 + date.getMonth() + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonthIndex0 = ((totalMonths % 12) + 12) % 12;
  const clampedDay = Math.min(date.getDate(), daysInMonth(targetYear, targetMonthIndex0));
  return new Date(targetYear, targetMonthIndex0, clampedDay);
}

/** [from,to] 범위를 "시작일+1개월" 청크로 분할한다. 오래된 순으로 반환. */
function computeChunks(from, to) {
  const start = toDate(from);
  const end = toDate(to);
  const chunks = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    let chunkEnd = addMonthsClamped(cursor, 1);
    if (chunkEnd > end) chunkEnd = new Date(end);
    chunks.push({ from: toDateStr(cursor), to: toDateStr(chunkEnd) });
    cursor = new Date(chunkEnd);
    cursor.setDate(cursor.getDate() + 1);
  }
  return chunks;
}

module.exports = { computeChunks, addMonthsClamped };
