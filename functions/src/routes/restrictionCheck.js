const express = require('express');
const { checkRestriction } = require('../lib/restrictionCheck');

const router = express.Router();

// DTL-009·010: "확인하기" 클릭 시에만 호출되는 온디맨드 엔드포인트.
// 목록 전수 자동 판정이 아니라, 프론트가 사용자가 클릭한 건 하나의 첨부파일만 넘긴다.
router.post('/', async (req, res) => {
  const { attachments } = req.body || {};
  if (!Array.isArray(attachments)) {
    return res.status(400).json({ message: 'attachments 배열이 필요합니다.' });
  }
  try {
    const result = await checkRestriction(attachments);
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
