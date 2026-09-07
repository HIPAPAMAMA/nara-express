// 로컬 개발: '/api' (vite.config.js의 server.proxy가 localhost:5001로 넘겨줌)
// Vercel 배포: 프론트·백엔드가 같은 프로젝트(같은 도메인)라 그대로 '/api'면 충분 (CORS 불필요)
const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, options);
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const message = typeof body === 'object' ? body.message : body;
    const err = new Error(message || `요청 실패 (HTTP ${res.status})`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export function checkHealth() {
  return request('/health');
}

// SRC-005·006: 조회 잡 생성 (빠른/정밀)
export function createSearchJob({ kind, from, to, bizType, mode, keywordType, keyword }) {
  return request(`/search/${kind}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, bizType, mode, keywordType, keyword }),
  });
}

// RES-002: 진행률 폴링 (읽기 전용, 진행시키지 않음)
export function getSearchJob(jobId) {
  return request(`/search/jobs/${jobId}`);
}

// 청크 1개를 진행시키는 호출 — 프론트가 done 될 때까지 반복 호출한다 (Vercel 서버리스 호환)
export function stepSearchJob(jobId) {
  return request(`/search/jobs/${jobId}/step`, { method: 'POST' });
}

// SRC-007: 조회 중단
export function cancelSearchJob(jobId) {
  return request(`/search/jobs/${jobId}/cancel`, { method: 'POST' });
}

export function checkRestriction(attachments) {
  return request('/restriction-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attachments }),
  });
}

// MYC-001
export function fetchCompanyByBizno(bizno) {
  return request(`/company/mine?bizno=${encodeURIComponent(bizno)}`);
}

// MALL-003
export function searchMall({ searchType, keyword, contractType, numOfRows, pageNo }) {
  const params = new URLSearchParams({
    searchType: searchType || 'name',
    contractType: contractType || 'mas',
    numOfRows: String(numOfRows || 30),
    pageNo: String(pageNo || 1),
  });
  if (keyword) params.set('keyword', keyword);
  return request(`/mall/search?${params.toString()}`);
}

// SET-004: 카카오 로그인 상태 확인 — 로그인 자체는 OAuth라 SPA 밖으로 이동해야 하므로
// fetch가 아니라 App.jsx에서 <a href="/api/auth/kakao/login">으로 직접 이동시킨다.
export function getMe() {
  return request('/auth/me');
}

export function logoutKakao() {
  return request('/auth/logout', { method: 'POST' });
}

// KWD-003·RES-018: 내 알림 구독 현황
export function fetchAlerts() {
  return request('/alerts');
}

export function toggleKeywordAlert(keyword) {
  return request(`/alerts/keywords/${encodeURIComponent(keyword)}/toggle`, { method: 'POST' });
}

export function toggleTrackedBid(bidNo) {
  return request(`/alerts/bids/${encodeURIComponent(bidNo)}/toggle`, { method: 'POST' });
}

// SET-001
export function setNotifyEnabled(enabled) {
  return request('/alerts/notify-enabled', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
}

// 카카오 연결 해제 — 저장된 토큰·구독 전부 삭제
export function disconnectKakao() {
  return request('/alerts/disconnect', { method: 'POST' });
}

// 관심 키워드·저장내역 서버 동기화 (기기 간 이어보기, 카카오 로그인 필요)
export function getCloudKeywords() {
  return request('/userdata/keywords');
}
export function setCloudKeywords(keywords) {
  return request('/userdata/keywords', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords }),
  });
}
export function getCloudSavedItems() {
  return request('/userdata/saved');
}
export function setCloudSavedItems(items) {
  return request('/userdata/saved', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
}

// 재공고 레이더 — 작년 이맘때 낙찰 이력 기준 올해 재공고 예측(추정치)
export function predictReannouncement(keyword) {
  return request(`/radar/reannounce?keyword=${encodeURIComponent(keyword)}`);
}

// 발주계획 레이더 — 공고 전 신호, 앞으로 6개월 이내 공시된 발주계획에서 키워드 검색
export function searchOrderPlans(keyword) {
  return request(`/radar/orderplan?keyword=${encodeURIComponent(keyword)}`);
}
