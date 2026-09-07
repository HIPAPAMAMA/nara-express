const express = require('express');
const crypto = require('node:crypto');
const kakao = require('../lib/kakaoClient');
const alertStore = require('../lib/alertStore');
const { setSessionCookie, clearSessionCookie, verifySessionCookie, parseCookies } = require('../lib/session');

const router = express.Router();

const STATE_COOKIE = 'nra_oauth_state';

// SET-004: 카카오 로그인 시작 — CSRF 방지용 state를 짧은 쿠키에 심어두고 카카오 인가 화면으로 이동
router.get('/kakao/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const secure = process.env.VERCEL ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${STATE_COOKIE}=${state}; HttpOnly; Path=/; SameSite=Lax; Max-Age=600${secure}`);
  res.redirect(kakao.getAuthorizeUrl(state));
});

router.get('/kakao/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const cookies = parseCookies(req.headers.cookie);

  if (error) return res.redirect('/?kakao=denied');
  if (!code || !state || state !== cookies[STATE_COOKIE]) {
    return res.status(400).send('잘못된 로그인 요청입니다 (state 불일치). 다시 시도해주세요.');
  }

  try {
    const tokens = await kakao.exchangeCodeForToken(code);
    const profile = await kakao.fetchProfile(tokens.accessToken);
    console.log('DEBUG kakao profile:', JSON.stringify(profile));
    await alertStore.saveUser(profile.kakaoUserId, {
      nickname: profile.nickname,
      accessToken: tokens.accessToken,
      accessExpiresAt: tokens.accessExpiresAt,
      refreshToken: tokens.refreshToken,
      refreshExpiresAt: tokens.refreshExpiresAt,
      notifyEnabled: true,
      needsReconnect: false,
    });
    const stored = await alertStore.getUser(profile.kakaoUserId);
    console.log('DEBUG stored user after saveUser:', JSON.stringify(stored));
    setSessionCookie(res, profile.kakaoUserId);
    res.setHeader('Set-Cookie', [
      res.getHeader('Set-Cookie'),
      `${STATE_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`,
    ].flat());
    res.redirect('/?kakao=connected');
  } catch (e) {
    console.error('카카오 로그인 콜백 실패', e);
    res.redirect('/?kakao=error');
  }
});

router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  const uid = verifySessionCookie(req.headers.cookie);
  if (!uid) return res.json({ connected: false });
  const user = await alertStore.getUser(uid);
  if (!user) return res.json({ connected: false });
  res.json({ connected: true, nickname: user.nickname, notifyEnabled: user.notifyEnabled !== false });
});

module.exports = router;
