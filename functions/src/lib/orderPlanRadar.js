// 발주계획 레이더 — 아직 입찰공고로 뜨기 전, 기관이 미리 공시한 연간 발주계획에서 키워드를 찾는다.
// 나라장터 발주계획현황서비스(OrderPlanSttusService) 실측 결과: 다른 3개 서비스와 달리
// 파라미터명이 inqryBgnDt가 아니라 inqryBgnDate(Dt가 아니라 Date) — 실측 없이 추측했으면 계속
// "필수값 입력 에러"만 났을 자리. operationId 접미사(Servc/Thng/Cnstwk/Frgcpt)는 기존 3개
// 서비스와 동일한 규칙임을 확인함(2026-09-08).
const { callOperation } = require('./naraClient');

const BASE = 'https://apis.data.go.kr/1230000/ao/OrderPlanSttusService';
const BIZ_SUFFIX = { servc: 'Servc', thng: 'Thng', cnstwk: 'Cnstwk', frgcpt: 'Frgcpt' };
const ALL_BIZ = ['servc', 'thng', 'cnstwk', 'frgcpt'];
const MONTHS_AHEAD = 6;
const MAX_RESULTS = 30;

function pad(n) {
  return String(n).padStart(2, '0');
}
function toDateStr(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

// 나라장터 공고상세 페이지도 비로그인 시 담당자 성명을 "성+**"로만 보여준다(사칭사기 방지 안내문 확인,
// 2026-09-07) — 이 API는 마스킹 없이 원본 그대로 내려주므로 우리가 표시 전에 직접 마스킹한다.
function maskName(name) {
  if (!name) return null;
  return name[0] + '*'.repeat(Math.max(name.length - 1, 1));
}

function matchesKeyword(bizNm, keyword) {
  return (bizNm || '').toLowerCase().includes(keyword.toLowerCase());
}

async function fetchOrderPlans(from, to) {
  const results = await Promise.allSettled(
    ALL_BIZ.map((biz) =>
      callOperation(BASE, `getOrderPlanSttusList${BIZ_SUFFIX[biz]}`, {
        inqryDiv: '1',
        inqryBgnDate: from,
        inqryEndDate: to,
        numOfRows: 999,
        pageNo: 1,
      })
    )
  );
  const items = [];
  const errors = [];
  for (const r of results) {
    if (r.status === 'fulfilled') items.push(...r.value.items);
    else errors.push({ message: r.reason?.message });
  }
  return { items, errors };
}

async function searchOrderPlans(keyword) {
  const today = new Date();
  const end = new Date(today);
  end.setMonth(end.getMonth() + MONTHS_AHEAD);
  const from = toDateStr(today);
  const to = toDateStr(end);

  const { items, errors } = await fetchOrderPlans(from, to);
  const plans = items
    .filter((it) => matchesKeyword(it.bizNm, keyword))
    .map((it) => ({
      id: it.orderPlanUntyNo,
      title: it.bizNm,
      orderOrg: it.orderInsttNm,
      bizType: it.bsnsDivNm,
      contractMethod: it.cntrctMthdNm || null,
      amount: Number(it.sumOrderAmt) || null,
      orderMonth: it.orderYear && it.orderMnth ? `${it.orderYear}-${it.orderMnth}` : it.orderYear || null,
      dept: it.deptNm || null,
      officer: maskName(it.ofclNm),
      alreadyAnnounced: Boolean(it.bidNtceNoList),
      sourceUrl: it.orderPlanDtlUrl || null,
    }))
    .slice(0, MAX_RESULTS);

  const toDash = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  return { keyword, windowFrom: toDash(from), windowTo: toDash(to), totalMatched: plans.length, plans, errors };
}

module.exports = { searchOrderPlans };
