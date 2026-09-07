// 재공고 레이더 — 작년 이맘때 낙찰된 건을 찾아 "1년 주기 재공고" 시점을 예측한다.
// 새 API 없이 기존 낙찰정보서비스(award)만 재사용한다 — 학교 급식·청소 등 단가계약성 용역은
// 보통 1년 주기로 재발주되는 관행을 이용한 추정치일 뿐, 확정 공고가 아니다.
const { search } = require('./naraClient');
const { normalizeItem, dedupe } = require('./normalize');
const { matchesKeyword } = require('./searchJob');

const WINDOW_BEFORE_DAYS = 7;
const WINDOW_AFTER_DAYS = 90;
const MIN_D_DAY = -14; // 이미 2주 넘게 지난 건 재공고가 이미 났을 가능성이 높아 제외
const MAX_RESULTS = 30;

function pad(n) {
  return String(n).padStart(2, '0');
}
function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function addDays(d, days) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}
function addYears(d, years) {
  const r = new Date(d);
  r.setFullYear(r.getFullYear() + years);
  return r;
}

async function predictReannouncements(keyword) {
  const today = new Date();
  const lastYearToday = addYears(today, -1);
  const from = toDateStr(addDays(lastYearToday, -WINDOW_BEFORE_DAYS));
  const to = toDateStr(addDays(lastYearToday, WINDOW_AFTER_DAYS));

  // search()는 'YYYYMMDD'(대시 없음)를 기대한다 — searchJob.js와 동일한 관례
  const result = await search('award', 'all', { from: from.replaceAll('-', ''), to: to.replaceAll('-', '') });
  const items = dedupe(result.items.map(normalizeItem));
  const matched = items.filter((it) => it.postedAt && matchesKeyword(it, { keyword, keywordType: 'title' }));

  const predictions = matched
    .map((it) => {
      const awardDate = new Date(it.postedAt);
      const anniversary = addYears(awardDate, 1);
      const dDay = Math.round((anniversary - today) / 86400000);
      return {
        id: it.id,
        title: it.title,
        bidNo: it.bidNo,
        winner: it.winner,
        awardRate: it.awardRate,
        awardAmount: it.awardAmount,
        lastAwardDate: toDateStr(awardDate),
        predictedDate: toDateStr(anniversary),
        dDay,
      };
    })
    .filter((p) => p.dDay >= MIN_D_DAY)
    .sort((a, b) => a.dDay - b.dDay)
    .slice(0, MAX_RESULTS);

  return {
    keyword,
    windowFrom: from,
    windowTo: to,
    totalMatched: matched.length,
    predictions,
    errors: result.errors,
  };
}

module.exports = { predictReannouncements };
