require('dotenv').config();
const express = require('express');
const cors = require('cors');

const healthRoute = require('./routes/health');
const searchRoute = require('./routes/search');
const restrictionCheckRoute = require('./routes/restrictionCheck');
const companyRoute = require('./routes/company');
const mallRoute = require('./routes/mall');
const authKakaoRoute = require('./routes/authKakao');
const authUserRoute = require('./routes/authUser');
const adminRoute = require('./routes/admin');
const alertsRoute = require('./routes/alerts');
const cronRoute = require('./routes/cron');
const userDataRoute = require('./routes/userData');
const radarRoute = require('./routes/radar');
const { requireApprovedApp } = require('./lib/appGate');

const app = express();
// FRONTEND_ORIGIN이 설정돼 있으면(Render 배포) 그 출처만 허용, 없으면(로컬 개발) 전체 허용
app.use(cors(process.env.FRONTEND_ORIGIN ? { origin: process.env.FRONTEND_ORIGIN } : {}));
app.use(express.json({ limit: '1mb' }));

// 가입 승인된 앱 계정만 API를 쓸 수 있다 — 가입·로그인·헬스체크·크론은 appGate.js의 예외 경로
app.use(requireApprovedApp);

app.use('/api/health', healthRoute);
app.use('/api/account', authUserRoute);
app.use('/api/admin', adminRoute);
app.use('/api/search', searchRoute);
app.use('/api/restriction-check', restrictionCheckRoute);
app.use('/api/company', companyRoute);
app.use('/api/mall', mallRoute);
app.use('/api/auth', authKakaoRoute);
app.use('/api/alerts', alertsRoute);
app.use('/api/cron', cronRoute);
app.use('/api/userdata', userDataRoute);
app.use('/api/radar', radarRoute);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal error' });
});

module.exports = app;
