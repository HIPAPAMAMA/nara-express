const express = require('express');
const { callOperation, BASES } = require('../lib/naraClient');

const router = express.Router();

// SRC-018: 진입 시 health check. 실제로 가벼운 실호출 1건을 던져 API 연결 상태를 확인한다.
router.get('/', async (req, res) => {
  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const d = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;

  try {
    await callOperation(BASES.award, 'getScsbidListSttusServc', {
      inqryDiv: '1',
      inqryBgnDt: `${d}0000`,
      inqryEndDt: `${d}2359`,
      numOfRows: '1',
      pageNo: '1',
    });
    res.json({ status: 'ok', checkedAt: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'down', message: e.message, checkedAt: new Date().toISOString() });
  }
});

module.exports = router;
