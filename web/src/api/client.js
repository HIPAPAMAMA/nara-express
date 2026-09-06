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
