const app = require('./app');

// Firebase Cloud Functions로 배포할 때는 아래를 사용:
//   const functions = require('firebase-functions');
//   exports.api = functions.https.onRequest(app);
// 로컬 개발 중에는 일반 Express 서버로 바로 실행한다.
if (require.main === module) {
  const port = process.env.PORT || 5001;
  app.listen(port, () => {
    console.log(`NARA Express backend listening on http://localhost:${port}`);
  });
}

module.exports = app;
