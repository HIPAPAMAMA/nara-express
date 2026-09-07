const express = require('express');
const alertStore = require('../lib/alertStore');
const { requireAuth } = require('../lib/session');

const router = express.Router();
router.use(requireAuth);

// SET-001·002: 내 알림 구독 현황
router.get('/', async (req, res) => {
  const uid = req.kakaoUserId;
  const [user, keywords, bids] = await Promise.all([
    alertStore.getUser(uid),
    alertStore.myKeywordAlerts(uid),
    alertStore.myTrackedBids(uid),
  ]);
  res.json({
    notifyEnabled: user?.notifyEnabled !== false,
    keywords,
    trackedBids: bids,
  });
});

// KWD-003: 키워드 알림 켜기/끄기 (토글)
router.post('/keywords/:keyword/toggle', async (req, res) => {
  const uid = req.kakaoUserId;
  const kw = decodeURIComponent(req.params.keyword);
  const current = await alertStore.myKeywordAlerts(uid);
  const isOn = current.map((k) => k.toLowerCase()).includes(kw.trim().toLowerCase());
  if (isOn) await alertStore.removeKeywordAlert(uid, kw);
  else await alertStore.addKeywordAlert(uid, kw);
  res.json({ on: !isOn });
});

// RES-018: 낙찰 알림 등록/해제 (토글)
router.post('/bids/:bidNo/toggle', async (req, res) => {
  const uid = req.kakaoUserId;
  const bidNo = req.params.bidNo;
  const current = await alertStore.myTrackedBids(uid);
  const isOn = current.includes(bidNo);
  if (isOn) await alertStore.removeTrackedBid(uid, bidNo);
  else await alertStore.addTrackedBid(uid, bidNo);
  res.json({ on: !isOn });
});

// SET-001: 전체 알림 수신 on/off
router.post('/notify-enabled', async (req, res) => {
  const uid = req.kakaoUserId;
  const { enabled } = req.body || {};
  await alertStore.saveUser(uid, { notifyEnabled: Boolean(enabled) });
  res.json({ ok: true });
});

// 연결 해제 — 저장된 토큰·구독 전부 삭제 + 세션 쿠키는 프론트에서 별도로 /api/auth/logout 호출
router.post('/disconnect', async (req, res) => {
  await alertStore.deleteUser(req.kakaoUserId);
  res.json({ ok: true });
});

module.exports = router;
