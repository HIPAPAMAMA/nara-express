// 5.2 Item 정규화 모델 — 3개 API 소스의 서로 다른 필드명을 단일 모델로 합친다.
// 프론트는 이 모델만 보고, 소스별 원본 필드명은 알 필요가 없다.

function toNumber(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function collectAttachments(raw, nameKeyPrefix, urlKeyPrefix, count) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const url = raw[`${urlKeyPrefix}${i}`];
    if (!url) continue;
    const name = raw[`${nameKeyPrefix}${i}`] || `첨부파일 ${i}`;
    list.push({ name, url });
  }
  return list;
}

function normalizeAward(raw) {
  const bidNo = raw.bidNtceNo;
  const bidSeq = raw.bidNtceOrd || '000';
  return {
    id: `${bidNo}-${bidSeq}`,
    kind: 'award',
    title: raw.bidNtceNm,
    bidNo,
    bidSeq,
    postedAt: raw.rgstDt || null,
    orderOrg: raw.dminsttNm || null,
    demandOrg: raw.dminsttNm || null,
    bizType: raw.__bizType,
    region: null,
    estimatedPrice: null, // T-4 확인: 낙찰정보서비스 응답엔 없음
    basePrice: null,
    bidDeadline: null,
    proposalDeadline: null,
    openingAt: raw.rlOpengDt || null,
    winner: raw.bidwinnrNm ? { name: raw.bidwinnrNm, bizNo: raw.bidwinnrBizno || null } : null,
    awardAmount: toNumber(raw.sucsfbidAmt),
    awardRate: toNumber(raw.sucsfbidRate), // API가 이미 계산해서 제공 (6.2 규칙)
    isFailed: false,
    noticeKind: null,
    sourceUrl: null, // TODO: 낙찰정보서비스 응답에 원문 URL 필드가 없음 — 확인되면 채울 것
    attachments: [],
    contract: null,
    restrictionCheck: null,
  };
}

function normalizeBid(raw) {
  const bidNo = raw.bidNtceNo;
  const bidSeq = raw.bidNtceOrd || '000';
  const noticeKind = raw.ntceKindNm || null;
  return {
    id: `${bidNo}-${bidSeq}`,
    kind: 'bid',
    title: raw.bidNtceNm,
    bidNo,
    bidSeq,
    postedAt: raw.bidNtceDt || raw.rgstDt || null,
    orderOrg: raw.ntceInsttNm || null,
    demandOrg: raw.dminsttNm || null,
    bizType: raw.__bizType,
    region: null,
    estimatedPrice: toNumber(raw.presmptPrce),
    basePrice: null, // 별도 오퍼레이션(BsisAmount) 필요 — 목록에는 없음 (T-4)
    bidDeadline: raw.bidClseDt || null,
    proposalDeadline: null,
    openingAt: raw.opengDt || null,
    winner: null,
    awardAmount: null,
    awardRate: null,
    isFailed: noticeKind === '취소공고',
    noticeKind,
    sourceUrl: raw.bidNtceUrl || raw.bidNtceDtlUrl || null,
    attachments: collectAttachments(raw, 'ntceSpecFileNm', 'ntceSpecDocUrl', 10),
    contract: null,
    restrictionCheck: null,
  };
}

function normalizePrespec(raw) {
  const bidNo = raw.bfSpecRgstNo;
  return {
    id: bidNo,
    kind: 'prespec',
    title: raw.prdctClsfcNoNm,
    bidNo,
    bidSeq: null,
    postedAt: raw.rgstDt || null,
    orderOrg: raw.orderInsttNm || null,
    demandOrg: raw.rlDminsttNm || null,
    bizType: raw.__bizType,
    region: null,
    estimatedPrice: toNumber(raw.asignBdgtAmt),
    basePrice: null,
    bidDeadline: null,
    proposalDeadline: raw.opninRgstClseDt || null,
    openingAt: null,
    winner: null,
    awardAmount: null,
    awardRate: null,
    isFailed: false,
    noticeKind: null,
    sourceUrl: null,
    attachments: collectAttachments(raw, 'specDocFileNm', 'specDocFileUrl', 5),
    contract: null,
    restrictionCheck: null,
  };
}

function normalizeItem(raw) {
  if (raw.__kind === 'award') return normalizeAward(raw);
  if (raw.__kind === 'bid') return normalizeBid(raw);
  if (raw.__kind === 'prespec') return normalizePrespec(raw);
  throw new Error(`정규화할 수 없는 원본 항목: ${JSON.stringify(raw).slice(0, 100)}`);
}

// 동일 공고번호+차수 중복 제거 (2단계 청크 엔진에서도 재사용)
function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

module.exports = { normalizeItem, dedupe };
