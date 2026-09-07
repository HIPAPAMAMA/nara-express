const express = require('express');
const { runDailyAlerts } = require('../lib/alertRunner');

const router = express.Router();

// Vercel Cron이 이 라우트를 호출할 때 CRON_SECRET을 Authorization: Bearer 헤더로 자동으로 붙여준다.
// 이 헤더가 없거나 값이 다르면 아무나 URL을 알아내서 임의 호출하는 걸 막는다.
router.get('/run-alerts', async (req, res) => {
  const expected = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  if (!expected || auth !== `Bearer ${expected}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const result = await runDailyAlerts();
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error('알림 배치 실행 실패', e);
    res.status(500).json({ ok: false, message: e.message });
  }
});

module.exports = router;
