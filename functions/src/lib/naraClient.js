// 나라장터 OpenAPI 클라이언트
// End Point·오퍼레이션명은 전부 공공데이터포털 실측(2026-09-05)으로 확인된 값만 사용한다.
// 절대 추측으로 새 엔드포인트를 추가하지 말 것 — 서비스마다 /as/ /ad/ /ao/ /at/ 등 경로 규칙이 다르다.

const BASES = {
  award: 'https://apis.data.go.kr/1230000/as/ScsbidInfoService', // 낙찰정보서비스
  bid: 'https://apis.data.go.kr/1230000/ad/BidPublicInfoService', // 입찰공고정보서비스
  prespec: 'https://apis.data.go.kr/1230000/ao/HrcspSsstndrdInfoService', // 사전규격정보서비스
};

// 업무구분별 오퍼레이션 접미사 (4.2절 실측 완료: 낙찰정보서비스 4종 전부 확인, 입찰공고정보서비스는 화면 캡처로 4종 확인)
const BIZ_SUFFIX = {
  servc: 'Servc', // 용역
  thng: 'Thng', // 물품
  cnstwk: 'Cnstwk', // 공사
  frgcpt: 'Frgcpt', // 외자
};

const OPERATIONS = {
  award: (biz) => `getScsbidListSttus${BIZ_SUFFIX[biz]}`,
  bid: (biz) => `getBidPblancListInfo${BIZ_SUFFIX[biz]}`,
  // 사전규격: 물품(Thng)·외자(Frgcpt) 오퍼레이션명은 포털 화면으로 확인됨.
  // 용역(Servc)·공사(Cnstwk)는 같은 접미사 규칙일 것으로 추정되나 미확인 — 호출 실패 시 그대로 에러를 올려보낸다(추측을 진실인 척 감추지 않는다).
  prespec: (biz) => `getPublicPrcureThngInfo${BIZ_SUFFIX[biz]}`,
};

const ALL_BIZ = ['servc', 'thng', 'cnstwk', 'frgcpt'];

function getServiceKey() {
  const key = process.env.NARA_SERVICE_KEY;
  if (!key) throw new Error('NARA_SERVICE_KEY 환경변수가 설정되지 않았습니다.');
  return key;
}

async function callOperation(base, operation, params, signal) {
  const url = new URL(`${base}/${operation}`);
  url.searchParams.set('serviceKey', getServiceKey());
  url.searchParams.set('type', 'json');
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), { signal });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    const err = new Error('나라장터 API 응답을 JSON으로 해석할 수 없습니다.');
    err.raw = text.slice(0, 500);
    err.httpStatus = res.status;
    throw err;
  }

  const header = json?.response?.header ?? json?.['nkoneps.com.response.ResponseError']?.header;
  const resultCode = header?.resultCode;
  if (resultCode !== '00' && resultCode !== '0') {
    const err = new Error(header?.resultMsg || '나라장터 API 오류');
    err.resultCode = resultCode;
    err.httpStatus = res.status;
    throw err;
  }

  const body = json?.response?.body;
  const items = body?.items ?? [];
  return {
    items: Array.isArray(items) ? items : items ? [items] : [],
    totalCount: Number(body?.totalCount ?? 0),
    numOfRows: Number(body?.numOfRows ?? 0),
    pageNo: Number(body?.pageNo ?? 1),
  };
}

// ⚠️ 실측 발견 (2026-09-05): 청크(달력 1개월)당 실제 건수가 예상보다 훨씬 크다 — 예를 들어
// 입찰공고 "용역" 한 업무구분만으로도 한 달에 12,000~20,000건 이상 나온다(전국 단위라 학교
// 급식·청소 등 소액 건까지 전부 잡힘). 이 말은 페이지네이션으로 "완전 수집"을 시도하면 청크 하나당
// 수십 콜이 필요하고, 5년 정밀조회는 수천~수만 콜이 필요해 **일일 1,000건 한도로는 물리적으로
// 완주가 불가능**하다는 뜻이다. 그래서 페이지네이션으로 누락을 감추려 하지 않고, 청크당 정확히
// 1콜(최대 999건)만 가져오고 **API가 알려주는 실제 총건수(totalCount)와의 차이를 그대로
// 노출**하는 쪽을 택했다 (6.3 원칙: 누락 가능성을 숨기지 않는다). MAX_PAGES_PER_CALL을 늘려서
// "더 완전하게" 만들려는 시도는 밑 빠진 독에 물 붓기이니 하지 말 것 — 대신 UI에서 truncated
// 건수를 정직하게 보여주는 방향으로 설계했다.
const MAX_PAGES_PER_CALL = 1;

/** 업무구분 1개에 대해 조회한다 (청크당 정확히 1콜, numOfRows=999). */
async function searchOneBizPaged(kind, biz, { from, to, signal }, callCounter) {
  const base = BASES[kind];
  const operation = OPERATIONS[kind](biz);
  const items = [];
  let pageNo = 1;
  let truncatedByPageCap = false;
  let totalCount = 0;

  while (true) {
    const result = await callOperation(
      base,
      operation,
      { inqryDiv: '1', inqryBgnDt: `${from}0000`, inqryEndDt: `${to}2359`, numOfRows: 999, pageNo },
      signal
    );
    if (callCounter) callCounter.count += 1;
    items.push(...result.items.map((item) => ({ ...item, __kind: kind, __bizType: biz })));
    totalCount = result.totalCount;

    const fetchedSoFar = pageNo * 999;
    const hasMore = result.items.length === 999 && fetchedSoFar < result.totalCount;
    if (!hasMore) break;
    if (pageNo >= MAX_PAGES_PER_CALL) {
      truncatedByPageCap = true;
      break;
    }
    pageNo += 1;
  }

  return { items, truncatedByPageCap, totalCount };
}

/**
 * kind: 'award' | 'bid' | 'prespec'
 * bizType: 'servc' | 'thng' | 'cnstwk' | 'frgcpt' | 'all'
 * 반환: { items, errors, truncatedByPageCap, callCount, totalCount(API가 알려준 실제 총건수 합), fetchedCount }
 */
async function search(kind, bizType, { from, to, signal, callCounter } = {}) {
  const base = BASES[kind];
  if (!base) throw new Error(`알 수 없는 데이터 유형: ${kind}`);

  const bizList = bizType === 'all' ? ALL_BIZ : [bizType];
  const counter = callCounter || { count: 0 };

  const results = await Promise.allSettled(bizList.map((biz) => searchOneBizPaged(kind, biz, { from, to, signal }, counter)));

  const items = [];
  const errors = [];
  let truncatedByPageCap = false;
  let totalCount = 0;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      items.push(...r.value.items);
      totalCount += r.value.totalCount;
      if (r.value.truncatedByPageCap) truncatedByPageCap = true;
    } else {
      errors.push({ bizType: bizList[i], message: r.reason?.message, resultCode: r.reason?.resultCode });
    }
  }

  if (items.length === 0 && errors.length > 0) {
    // 전부 실패한 경우에만 에러로 던진다 (부분 실패는 6.3 원칙에 따라 결과와 함께 노출)
    const err = new Error(errors[0].message);
    err.resultCode = errors[0].resultCode;
    throw err;
  }

  return { items, errors, truncatedByPageCap, callCount: counter.count, totalCount, fetchedCount: items.length };
}

module.exports = { search, BASES, OPERATIONS, callOperation, MAX_PAGES_PER_CALL };
