const express = require('express');
const { callOperation, BASES } = require('../lib/naraClient');

const router = express.Router();

const USR_BASE = 'https://apis.data.go.kr/1230000/ao/UsrInfoService02';

function pad(n) {
  return String(n).padStart(2, '0');
}
function toApiDate(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

// MYC-001: 사업자번호 → 업체정보 자동 입력.
// T-5 실측 확정 사항: inqryDiv=3 + bizno 조합만 정확히 동작한다 (정방향 이름검색 불가).
router.get('/mine', async (req, res) => {
  const { bizno } = req.query;
  if (!bizno) return res.status(400).json({ message: 'bizno가 필요합니다.' });

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 30); // inqryDiv=3도 날짜범위 필수 (31일 이내) — 실측대로 30일만 사용

  try {
    const result = await callOperation(USR_BASE, 'getPrcrmntCorpBasicInfo02', {
      inqryDiv: '3',
      inqryBgnDt: toApiDate(start) + '0000',
      inqryEndDt: toApiDate(today) + '2359',
      bizno,
      numOfRows: '1',
      pageNo: '1',
    });
    const info = result.items[0];
    if (!info) return res.status(404).json({ message: '해당 사업자번호로 등록된 업체 정보를 찾을 수 없습니다.' });
    // 실측 확인: 이 API는 기업규모(대기업/중견/중소) 필드를 제공하지 않는다 — corpBsnsDivNm은
    // 업종구분(물품/용역 등)이라 기업규모와 다르다. entrprsDiv는 자동 채움 대상에서 제외하고
    // MYC-002(수동 편집)로 사용자가 직접 넣게 한다.
    res.json({
      bizNo: info.bizno,
      corpNm: info.corpNm,
      hqRegion: info.rgnNm || null,
      ceoNm: info.ceoNm || null,
      address: [info.adrs, info.dtlAdrs].filter(Boolean).join(' '),
    });
  } catch (e) {
    res.status(502).json({ message: e.message, resultCode: e.resultCode });
  }
});

module.exports = router;
