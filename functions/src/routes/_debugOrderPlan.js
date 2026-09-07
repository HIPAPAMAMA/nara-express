// 임시 진단 라우트 — 발주계획현황서비스 실제 파라미터를 실측으로 확인하기 위한 것.
// 확정되면(성공 응답 확보) 이 파일은 삭제하고 정식 orderPlanClient.js/radar 라우트로 대체한다.
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const key = process.env.NARA_SERVICE_KEY;
  const operation = req.query.op || 'getOrderPlanSttusListThng';
  const url = new URL(`https://apis.data.go.kr/1230000/ao/OrderPlanSttusService/${operation}`);
  url.searchParams.set('serviceKey', key);
  url.searchParams.set('type', 'json');
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'op') continue;
    url.searchParams.set(k, v);
  }
  try {
    const r = await fetch(url.toString());
    const text = await r.text();
    res.json({ status: r.status, calledUrl: url.toString().replace(key, 'KEY'), body: text.slice(0, 3000) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
