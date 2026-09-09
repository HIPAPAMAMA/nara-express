// 서명된 쿠키 기반 세션 — 별도 세션 저장소 없이 uid 자체를 서명해서 쿠키에 담는다.
// 카카오 알림 연결(nra_session)과 앱 계정 로그인(appSession.js의 nra_app_session)이
// 서로 다른 쿠키로 독립적인 세션을 가지므로, 쿠키 이름별로 인스턴스를 만들 수 있게 팩토리로 뺐다.
const crypto = require('node:crypto');

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET 환경변수가 설정되지 않았습니다.');
  return secret;
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

function createSessionStore({ cookieName, maxAgeSeconds, reqField }) {
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

  function verifySessionCookie(cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    return verify(cookies[cookieName]);
  }

  function setSessionCookie(res, uid) {
    const value = sign(uid);
    const secure = process.env.VERCEL ? '; Secure' : ''; // 로컬 개발(http)에서는 Secure 속성 빼야 브라우저가 쿠키를 받는다
    res.setHeader(
      'Set-Cookie',
      `${cookieName}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`
    );
  }

  function clearSessionCookie(res) {
    res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
  }

  // 로그인 필수 라우트에 붙이는 미들웨어 — req[reqField]를 채우거나 401
  function requireAuth(req, res, next) {
    const uid = verifySessionCookie(req.headers.cookie);
    if (!uid) return res.status(401).json({ message: '로그인이 필요합니다.' });
    req[reqField] = uid;
    next();
  }

  // 로그인 여부만 확인하고 싶을 때(있으면 채우고, 없어도 통과)
  function optionalAuth(req, res, next) {
    req[reqField] = verifySessionCookie(req.headers.cookie);
    next();
  }

  return { verifySessionCookie, setSessionCookie, clearSessionCookie, requireAuth, optionalAuth };
}

// 기존 카카오 알림 연결 세션 — 이름 그대로 유지(하위 호환)
const kakaoSession = createSessionStore({
  cookieName: 'nra_session',
  maxAgeSeconds: 60 * 24 * 60 * 60, // 60일 — 카카오 리프레시 토큰 수명과 맞춤
  reqField: 'kakaoUserId',
});

module.exports = { ...kakaoSession, parseCookies, createSessionStore };
