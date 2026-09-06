// 로컬 개발: '/api' (vite.config.js의 server.proxy가 localhost:5001로 넘겨줌)
// Render 배포: VITE_API_BASE_URL(render.yaml에서 설정)이 백엔드 서비스의 실제 주소로 대체
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

// RES-002: 진행률 폴링
export function getSearchJob(jobId) {
  return request(`/search/jobs/${jobId}`);
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
