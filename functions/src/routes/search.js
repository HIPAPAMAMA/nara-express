const express = require('express');
const { computeChunks } = require('../lib/chunk');
const { createJob, getJob, saveJob } = require('../lib/jobStore');
const { stepJob } = require('../lib/searchJob');

const router = express.Router();

const KIND_MAP = { bid: 'bid', award: 'award', prespec: 'prespec' };
const BIZ_MAP = { 전체: 'all', 용역: 'servc', 물품: 'thng', 공사: 'cnstwk', 외자: 'frgcpt' };
const BIZ_COUNT = { all: 4, servc: 1, thng: 1, cnstwk: 1, frgcpt: 1 };

function withinDays(from, to) {
  const days = Math.round((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86400000);
  return days >= 0;
}

// SRC-006: 조회하기 — 잡을 만들기만 하고, 청크 처리는 안 한다 (호출 하나를 가볍게 유지).
// mode='quick'(빠른조회): 최근 1개 청크만. mode='full'(정밀조회): 전체 범위.
router.post('/:kind/jobs', async (req, res) => {
  const kind = KIND_MAP[req.params.kind];
  if (!kind) return res.status(400).json({ message: `알 수 없는 데이터 유형: ${req.params.kind}` });

  const { from, to, bizType = '전체', mode = 'quick', keywordType, keyword } = req.body || {};
  if (!from || !to) return res.status(400).json({ message: 'from, to 날짜가 필요합니다 (YYYY-MM-DD).' });
  if (!withinDays(from, to)) return res.status(400).json({ message: '종료일이 시작일보다 빠릅니다.' });

  const bizCode = BIZ_MAP[bizType] || 'all';
  const allWindows = computeChunks(from, to);
  const truncated = mode === 'quick' && allWindows.length > 1;
  const targetWindows = mode === 'quick' ? allWindows.slice(-1) : allWindows;
  // 청크당 1콜 기준 최소 추정치 — 한 구간에 999건 넘는 공고가 있으면 더 소요될 수 있다 (naraClient.MAX_PAGES_PER_CALL 참고)
  const minApiCalls = targetWindows.length * BIZ_COUNT[bizCode];

  const jobId = await createJob({
    kind,
    bizCode,
    windows: targetWindows,
    mode,
    bizType,
    range: { from, to },
    queriedRange: { from: targetWindows[0]?.from ?? from, to: targetWindows.at(-1)?.to ?? to },
    truncated,
    minApiCalls,
    chunkCount: targetWindows.length,
    keywordFilter: { keywordType, keyword },
  });

  res.json({ jobId, minApiCalls, chunkCount: targetWindows.length, truncated });
});

// RES-002: 진행률 — 이 호출 자체가 청크 1개를 처리한다(프론트가 done 될 때까지 반복 호출).
router.post('/jobs/:jobId/step', async (req, res) => {
  const job = await stepJob(req.params.jobId);
  if (!job) return res.status(404).json({ message: '존재하지 않거나 만료된 조회입니다.' });
  res.json(job);
});

// 읽기 전용 상태 조회 (진행시키지 않고 현재 상태만)
router.get('/jobs/:jobId', async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job) return res.status(404).json({ message: '존재하지 않거나 만료된 조회입니다.' });
  res.json(job);
});

// SRC-007: 조회 중단 — 다음 step 호출부터 더 진행하지 않는다.
router.post('/jobs/:jobId/cancel', async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job) return res.status(404).json({ message: '존재하지 않거나 만료된 조회입니다.' });
  if (job.status === 'running') {
    job.status = 'cancelled';
    job.cancelled = true;
    job.elapsedMs = Date.now() - job.startedAt;
    await saveJob(job);
  }
  res.json({ ok: true });
});

module.exports = router;
