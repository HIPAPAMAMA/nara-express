const express = require('express');
const userDataStore = require('../lib/userDataStore');
const { requireAuth } = require('../lib/session');

const router = express.Router();
router.use(requireAuth);

// 관심 키워드·저장내역 서버 동기화 — 로그인한 기기끼리 같은 목록을 이어본다
router.get('/keywords', async (req, res) => {
  res.json({ keywords: await userDataStore.getKeywords(req.kakaoUserId) });
});
router.put('/keywords', async (req, res) => {
  const { keywords } = req.body || {};
  if (!Array.isArray(keywords)) return res.status(400).json({ message: 'keywords 배열이 필요합니다.' });
  await userDataStore.setKeywords(req.kakaoUserId, keywords);
  res.json({ keywords });
});

router.get('/saved', async (req, res) => {
  res.json({ items: await userDataStore.getSavedItems(req.kakaoUserId) });
});
router.put('/saved', async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ message: 'items 배열이 필요합니다.' });
  await userDataStore.setSavedItems(req.kakaoUserId, items);
  res.json({ items });
});

module.exports = router;
