require('dotenv').config();
const express = require('express');
const cors = require('cors');

const healthRoute = require('./routes/health');
const searchRoute = require('./routes/search');
const restrictionCheckRoute = require('./routes/restrictionCheck');
const companyRoute = require('./routes/company');
const mallRoute = require('./routes/mall');
const authKakaoRoute = require('./routes/authKakao');
const alertsRoute = require('./routes/alerts');
const cronRoute = require('./routes/cron');
const userDataRoute = require('./routes/userData');

const app = express();
// FRONTEND_ORIGIN이 설정돼 있으면(Render 배포) 그 출처만 허용, 없으면(로컬 개발) 전체 허용
app.use(cors(process.env.FRONTEND_ORIGIN ? { origin: process.env.FRONTEND_ORIGIN } : {}));
app.use(express.json({ limit: '1mb' }));

app.use('/api/health', healthRoute);
app.use('/api/search', searchRoute);
app.use('/api/restriction-check', restrictionCheckRoute);
app.use('/api/company', companyRoute);
app.use('/api/mall', mallRoute);
app.use('/api/auth', authKakaoRoute);
app.use('/api/alerts', alertsRoute);
app.use('/api/cron', cronRoute);
app.use('/api/userdata', userDataRoute);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal error' });
});

module.exports = app;
