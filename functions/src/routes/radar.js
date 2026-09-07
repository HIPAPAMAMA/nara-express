const express = require('express');
const { predictReannouncements } = require('../lib/reannounceRadar');

const router = express.Router();

// 재공고 레이더 — 작년 이맘때 낙찰 이력 기준 올해 재공고 예측 (추정치, 확정 공고 아님)
router.get('/reannounce', async (req, res) => {
  const keyword = String(req.query.keyword || '').trim();
  if (keyword.length < 2) return res.status(400).json({ message: '키워드를 2자 이상 입력하세요.' });
  try {
    const result = await predictReannouncements(keyword);
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
