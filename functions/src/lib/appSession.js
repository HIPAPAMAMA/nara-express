// 앱 계정(이메일 가입·승인제) 로그인 세션 — 카카오 알림 연결(session.js의 nra_session)과는
// 별개의 쿠키(nra_app_session)를 쓴다. 앱 전체 접근 게이트가 이 세션을 기준으로 판단한다.
const { createSessionStore } = require('./session');

module.exports = createSessionStore({
  cookieName: 'nra_app_session',
  maxAgeSeconds: 180 * 24 * 60 * 60, // 180일 — 사내 소규모 도구라 자주 재로그인시키지 않음
  reqField: 'appUserEmail',
});
