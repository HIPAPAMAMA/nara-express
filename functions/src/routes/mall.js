const express = require('express');
const { callOperation } = require('../lib/naraClient');

const router = express.Router();

const MALL_BASE = 'https://apis.data.go.kr/1230000/at/ShoppingMallPrdctInfoService';
const CONTRACT_OPERATIONS = {
  mas: 'getMASCntrctPrdctInfoList', // 다수공급자계약
  thpty: 'getThptyUcntrctPrdctInfoList', // 제3자단가계약
};

function toMallItem(raw) {
  return {
    prdctIdntNo: raw.prdctIdntNo,
    prdctSpecNm: raw.prdctSpecNm,
    cntrctCorpNm: raw.cntrctCorpNm,
    entrprsDivNm: raw.entrprsDivNm,
    cntrctPrceAmt: Number(raw.cntrctPrceAmt) || null,
    prdctUnit: raw.prdctUnit,
    prdctOrgplceNm: raw.prdctOrgplceNm,
    splyJrsdctRgnNm: raw.prdctSplyRgnNm,
    cntrctBgnDate: raw.cntrctBgnDate,
    cntrctEndDate: raw.cntrctEndDate,
    dlvrTmlmtDaynum: Number(raw.dlvrTmlmtDaynum) || null,
    certList: (raw.prodctCertList || '').split(',').map((s) => s.trim()).filter(Boolean),
    specDocUrls: [1, 2, 3, 4, 5].map((i) => raw[`specDocAtchFileNmUrl${i}`]).filter(Boolean),
  };
}

// MALL-001~010
router.get('/search', async (req, res) => {
  const { searchType = 'name', keyword, contractType = 'mas', numOfRows = '30', pageNo = '1' } = req.query;
  const operation = CONTRACT_OPERATIONS[contractType] || CONTRACT_OPERATIONS.mas;

  const params = { numOfRows, pageNo };
  if (keyword) {
    if (searchType === 'ident') params.prdctIdntNo = keyword;
    else params.prdctClsfcNoNm = keyword;
  }

  try {
    const result = await callOperation(MALL_BASE, operation, params);
    res.json({
      items: result.items.map(toMallItem),
      totalCount: result.totalCount,
      numOfRows: result.numOfRows,
      pageNo: result.pageNo,
    });
  } catch (e) {
    res.status(502).json({ message: e.message, resultCode: e.resultCode });
  }
});

module.exports = router;
