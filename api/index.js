// Vercel 서버리스 함수 진입점 — 기존 Express 앱을 그대로 감싼다.
// Express 앱은 (req, res) => void 형태로 호출 가능해서 Vercel 핸들러로 바로 쓸 수 있다.
module.exports = require('../functions/src/app');
