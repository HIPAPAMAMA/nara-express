// 카카오 로그인 세션 — 별도 세션 저장소 없이 서명된 쿠키 하나로 처리한다.
// 모든 사용자 데이터가 카카오 user id로 KV에 저장되므로, 쿠키에 담긴 uid 자체가 조회키다.
const crypto = require('node:crypto');

const COOKIE_NAME = 'nra_session';
const MAX_AGE_SECONDS = 60 * 24 * 60 * 60; // 60일 — 카카오 리프레시 토큰 수명과 맞춤

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET 환경변수가 설정되지 않았습니다.');
  return secret;
}

function sign(uid) {
  const hmac = crypto.createHmac('sha256', getSecret()).update(uid).digest('hex');
  return `${uid}.${hmac}`;
}

function verify(value) {
  if (!value) return null;
  const idx = value.lastIndexOf('.');
  if (idx === -1) return null;
  const uid = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  const expected = crypto.createHmac('sha256', getSecret()).update(uid).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return uid;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

function verifySessionCookie(cookieHeader) {
  const cookies = parseCookies(cookieHeader);
  return verify(cookies[COOKIE_NAME]);
}

function setSessionCookie(res, uid) {
  const value = sign(uid);
  const secure = process.env.VERCEL ? '; Secure' : ''; // 로컬 개발(http)에서는 Secure 속성 빼야 브라우저가 쿠키를 받는다
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}${secure}`
  );
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

// 로그인 필수 라우트에 붙이는 미들웨어 — req.kakaoUserId를 채우거나 401
function requireAuth(req, res, next) {
  const uid = verifySessionCookie(req.headers.cookie);
  if (!uid) return res.status(401).json({ message: '로그인이 필요합니다.' });
  req.kakaoUserId = uid;
  next();
}

// 로그인 여부만 확인하고 싶을 때(있으면 채우고, 없어도 통과)
function optionalAuth(req, res, next) {
  req.kakaoUserId = verifySessionCookie(req.headers.cookie);
  next();
}

module.exports = { verifySessionCookie, setSessionCookie, clearSessionCookie, requireAuth, optionalAuth, parseCookies };
