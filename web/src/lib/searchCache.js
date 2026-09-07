// 같은 조건으로 재조회할 때 서버에 다시 안 물어보고 재사용 — 세션 동안만 유지(새로고침하면 비워짐).
// 청크 잡이 끝까지(done) 진행된 원본 결과(jobData)만 캐시한다 — 진행 중·취소·에러 상태는 대상 아님.
// orderOrg·demandOrg·price 같은 고급 필터는 서버 잡과 무관하게 클라이언트에서 매번 다시 적용되므로
// (SearchWorkspace.jsx의 applyAdvancedFilters) 캐시 키에 넣지 않는다 — 필터만 바꿔도 캐시가 재사용된다.
const cache = new Map();

function keyOf(params) {
  return [params.kind, params.from, params.to, params.bizType, params.mode, params.keywordType, params.keyword || ''].join('|');
}

export function getCachedJob(params) {
  return cache.get(keyOf(params)) || null;
}

export function setCachedJob(params, jobData) {
  cache.set(keyOf(params), jobData);
}
