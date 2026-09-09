// 앱 계정 가입·로그인 — 회사 이메일(ALLOWED_DOMAIN)로만 가입 신청, 관리자 승인 후 로그인 가능.
const express = require('express');
const userStore = require('../lib/userStore');
const appSession = require('../lib/appSession');

const router = express.Router();

const ALLOWED_DOMAIN = '@lghv.net';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase();

router.post('/signup', async (req, res) => {
  const { name, email, team, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!name?.trim() || !team?.trim() || !password) {
    return res.status(400).json({ message: '이름·소속팀·비밀번호를 모두 입력해주세요.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: '비밀번호는 8자 이상으로 설정해주세요.' });
  }
  if (!normalizedEmail.endsWith(ALLOWED_DOMAIN)) {
    return res.status(400).json({ message: `회사 이메일(${ALLOWED_DOMAIN})로만 가입할 수 있습니다.` });
  }

  const existing = await userStore.getUser(normalizedEmail);
  if (existing) {
    return res.status(409).json({ message: '이미 가입 신청된 이메일입니다.' });
  }

  // 관리자 본인 이메일은 승인 절차 없이 바로 사용 가능해야 승인 화면 자체에 들어갈 수 있다
  const status = normalizedEmail === ADMIN_EMAIL ? 'approved' : 'pending';
  await userStore.createUser({ email: normalizedEmail, name: name.trim(), team: team.trim(), password, status });
  res.json({ ok: true, status });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const user = await userStore.getUser(normalizedEmail);
  if (!user || !userStore.verifyPassword(user, password || '')) {
    return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }
  if (user.status !== 'approved') {
    const message =
      user.status === 'rejected'
        ? '가입 신청이 승인되지 않았습니다. 관리자에게 문의해주세요.'
        : '아직 관리자 승인 대기 중입니다. 승인 후 로그인할 수 있습니다.';
    return res.status(403).json({ message, status: user.status });
  }

  appSession.setSessionCookie(res, normalizedEmail);
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  appSession.clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  const email = appSession.verifySessionCookie(req.headers.cookie);
  if (!email) return res.json({ loggedIn: false });
  const user = await userStore.getUser(email);
  if (!user || user.status !== 'approved') return res.json({ loggedIn: false });
  res.json({
    loggedIn: true,
    name: user.name,
    email: user.email,
    team: user.team,
    isAdmin: email === ADMIN_EMAIL,
  });
});

module.exports = router;
