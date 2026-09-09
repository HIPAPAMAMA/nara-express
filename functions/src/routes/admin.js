// 회원 가입 승인 관리 — ADMIN_EMAIL 계정만 접근 가능
const express = require('express');
const userStore = require('../lib/userStore');
const appSession = require('../lib/appSession');

const router = express.Router();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase();

function requireAdmin(req, res, next) {
  const email = appSession.verifySessionCookie(req.headers.cookie);
  if (!email || email !== ADMIN_EMAIL) {
    return res.status(403).json({ message: '관리자만 접근할 수 있습니다.' });
  }
  next();
}
router.use(requireAdmin);

router.get('/users', async (req, res) => {
  const emails = await userStore.allUserEmails();
  const users = await Promise.all(emails.map((e) => userStore.getUser(e)));
  const sorted = users.filter(Boolean).sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  res.json({ users: sorted });
});

router.post('/users/:email/approve', async (req, res) => {
  await userStore.setStatus(decodeURIComponent(req.params.email), 'approved');
  res.json({ ok: true });
});

router.post('/users/:email/reject', async (req, res) => {
  await userStore.setStatus(decodeURIComponent(req.params.email), 'rejected');
  res.json({ ok: true });
});

module.exports = router;
