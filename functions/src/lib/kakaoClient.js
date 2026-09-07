// 카카오 로그인 + 카카오톡 "나에게 보내기" API 클라이언트.
// 참고: developers.kakao.com 카카오 로그인/카카오톡 메시지 REST API 문서 (2026-09-07 확인)
// - 액세스 토큰 만료: 약 12시간(43199초) / 리프레시 토큰 만료: 약 60일(5184000초)
// - 리프레시 토큰은 매번 갱신되지 않고, 남은 유효기간이 1개월 미만일 때만 새로 발급된다
//   → 응답에 refresh_token이 없으면 기존 값을 그대로 유지해야 한다.
const AUTH_BASE = 'https://kauth.kakao.com';
const API_BASE = 'https://kapi.kakao.com';

function getEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} 환경변수가 설정되지 않았습니다.`);
  return v;
}

function getAuthorizeUrl(state) {
  const url = new URL(`${AUTH_BASE}/oauth/authorize`);
  url.searchParams.set('client_id', getEnv('KAKAO_CLIENT_ID'));
  url.searchParams.set('redirect_uri', getEnv('KAKAO_REDIRECT_URI'));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'talk_message');
  url.searchParams.set('state', state);
  return url.toString();
}

async function postForm(path, params) {
  const body = new URLSearchParams(params);
  const res = await fetch(`${AUTH_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body,
  });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.error_description || json.error || '카카오 인증 오류');
    err.kakaoError = json.error;
    throw err;
  }
  return json;
}

async function exchangeCodeForToken(code) {
  const params = {
    grant_type: 'authorization_code',
    client_id: getEnv('KAKAO_CLIENT_ID'),
    redirect_uri: getEnv('KAKAO_REDIRECT_URI'),
    code,
  };
  if (process.env.KAKAO_CLIENT_SECRET) params.client_secret = process.env.KAKAO_CLIENT_SECRET;
  const json = await postForm('/oauth/token', params);
  return tokenResponseToRecord(json);
}

async function refreshAccessToken(refreshToken) {
  const params = {
    grant_type: 'refresh_token',
    client_id: getEnv('KAKAO_CLIENT_ID'),
    refresh_token: refreshToken,
  };
  if (process.env.KAKAO_CLIENT_SECRET) params.client_secret = process.env.KAKAO_CLIENT_SECRET;
  const json = await postForm('/oauth/token', params);
  const record = tokenResponseToRecord(json);
  // 카카오는 남은 유효기간이 1개월 미만일 때만 새 refresh_token을 내려준다 — 없으면 기존 값 유지
  if (!record.refreshToken) {
    record.refreshToken = refreshToken;
    record.refreshExpiresAt = null; // 호출부에서 기존 값 보존
  }
  return record;
}

function tokenResponseToRecord(json) {
  const now = Date.now();
  return {
    accessToken: json.access_token,
    accessExpiresAt: now + json.expires_in * 1000,
    refreshToken: json.refresh_token || null,
    refreshExpiresAt: json.refresh_token_expires_in ? now + json.refresh_token_expires_in * 1000 : null,
  };
}

async function fetchProfile(accessToken) {
  const res = await fetch(`${API_BASE}/v2/user/me?property_keys=%5B%22kakao_account.profile%22%5D`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.msg || '카카오 프로필 조회 실패');
  return {
    kakaoUserId: String(json.id),
    nickname: json.kakao_account?.profile?.nickname || '카카오 사용자',
  };
}

// "나에게 보내기" — 발송 건수 제한 없음(친구 발송과 달리 심사 불필요, 2026-09-07 공식 문서 확인)
async function sendSelfMessage(accessToken, { text, webUrl }) {
  const templateObject = {
    object_type: 'text',
    text,
    link: { web_url: webUrl, mobile_web_url: webUrl },
    button_title: '바로 확인',
  };
  const body = new URLSearchParams({ template_object: JSON.stringify(templateObject) });
  const res = await fetch(`${API_BASE}/v2/api/talk/memo/default/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body,
  });
  const json = await res.json();
  if (!res.ok || json.result_code !== 0) {
    const err = new Error(json.msg || '카카오톡 메시지 발송 실패');
    err.kakaoError = json;
    throw err;
  }
  return json;
}

module.exports = { getAuthorizeUrl, exchangeCodeForToken, refreshAccessToken, fetchProfile, sendSelfMessage };
