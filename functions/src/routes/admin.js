// 회원 가입 승인 관리 — ADMIN_EMAIL 계정만 접근 가능
const express = require('express');
const crypto = require('node:crypto');
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

// 비밀번호를 잊은 사용자용 — 메일 발송 없이 관리자가 임시 비밀번호를 발급해 직접 전달한다.
// 응답에만 한 번 담겨 오고 서버에 평문으로 남지 않으니, 잊지 말고 본인에게 전달할 것.
router.post('/users/:email/reset-password', async (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const user = await userStore.getUser(email);
  if (!user) return res.status(404).json({ message: '존재하지 않는 계정입니다.' });

  const newPassword = crypto.randomBytes(6).toString('base64url'); // 8자, URL-safe
  await userStore.setPassword(email, newPassword);
  res.json({ ok: true, newPassword });
});

module.exports = router;
