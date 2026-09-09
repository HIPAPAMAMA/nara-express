// 앱 전체 접근 게이트 — 가입만으로는 부족하고 승인(status==='approved')까지 돼야 API를 쓸 수 있다.
// 쿠키 서명 검증만으로 끝내지 않고 매 요청마다 최신 상태를 조회하는 이유: 관리자가 승인을
// 취소(rejected로 변경)했을 때 이미 발급된 쿠키로도 즉시 접근이 막혀야 하기 때문.
const appSession = require('./appSession');
const userStore = require('./userStore');

// 로그인 전에도 열려 있어야 하는 경로(가입·로그인 자체, 헬스체크, 크론은 별도 시크릿으로 인증)
const OPEN_PATH_PREFIXES = ['/api/health', '/api/account', '/api/cron'];

async function requireApprovedApp(req, res, next) {
  if (OPEN_PATH_PREFIXES.some((prefix) => req.path.startsWith(prefix))) return next();

  const email = appSession.verifySessionCookie(req.headers.cookie);
  if (!email) return res.status(401).json({ message: '로그인이 필요합니다.', code: 'NOT_LOGGED_IN' });

  const user = await userStore.getUser(email);
  if (!user || user.status !== 'approved') {
    return res.status(403).json({ message: '승인 대기 중이거나 비활성화된 계정입니다.', code: 'NOT_APPROVED' });
  }

  req.appUserEmail = email;
  next();
}

module.exports = { requireApprovedApp };
