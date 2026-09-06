const express = require('express');
const { computeChunks } = require('../lib/chunk');
const { createJob, getJob, toPublicJob } = require('../lib/jobStore');
const { runJob } = require('../lib/searchJob');

const router = express.Router();

const KIND_MAP = { bid: 'bid', award: 'award', prespec: 'prespec' };
const BIZ_MAP = { 전체: 'all', 용역: 'servc', 물품: 'thng', 공사: 'cnstwk', 외자: 'frgcpt' };
const BIZ_COUNT = { all: 4, servc: 1, thng: 1, cnstwk: 1, frgcpt: 1 };

function withinDays(from, to) {
  const days = Math.round((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86400000);
  return days >= 0;
}

// SRC-006: 조회하기 — 잡을 생성하고 백그라운드로 청크 처리를 시작한다.
// mode='quick'(빠른조회): 최근 1개 청크만. mode='full'(정밀조회): 전체 범위 순차 처리.
router.post('/:kind/jobs', (req, res) => {
  const kind = KIND_MAP[req.params.kind];
  if (!kind) return res.status(400).json({ message: `알 수 없는 데이터 유형: ${req.params.kind}` });

  const { from, to, bizType = '전체', mode = 'quick', keywordType, keyword } = req.body || {};
  if (!from || !to) return res.status(400).json({ message: 'from, to 날짜가 필요합니다 (YYYY-MM-DD).' });
  if (!withinDays(from, to)) return res.status(400).json({ message: '종료일이 시작일보다 빠릅니다.' });

  const bizCode = BIZ_MAP[bizType] || 'all';
  const allWindows = computeChunks(from, to);
  const truncated = mode === 'quick' && allWindows.length > 1;
  const targetWindows = mode === 'quick' ? allWindows.slice(-1) : allWindows;
  // 청크당 1콜 기준 최소 추정치 — 한 구간에 999건 넘는 공고가 있으면 페이지네이션으로 더 소요될 수 있다 (naraClient.MAX_PAGES_PER_CALL 참고)
  const minApiCalls = targetWindows.length * BIZ_COUNT[bizCode];

  const jobId = createJob({
    kind,
    mode,
    bizType,
    range: { from, to },
    queriedRange: { from: targetWindows[0]?.from ?? from, to: targetWindows.at(-1)?.to ?? to },
    truncated,
    minApiCalls,
    chunkCount: targetWindows.length,
  });

  runJob(jobId, kind, bizCode, targetWindows, { keywordType, keyword }).catch((e) => {
    const job = getJob(jobId);
    if (job) {
      job.status = 'error';
      job.errors.push({ message: e.message });
    }
  });

  res.json({ jobId, minApiCalls, chunkCount: targetWindows.length, truncated });
});

// RES-002: 진행률·소요시간 폴링
router.get('/jobs/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ message: '존재하지 않거나 만료된 조회입니다.' });
  const pub = toPublicJob(job);
  pub.elapsedMs = pub.elapsedMs ?? Date.now() - pub.startedAt;
  res.json(pub);
});

// SRC-007: 조회 중단
router.post('/jobs/:jobId/cancel', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ message: '존재하지 않거나 만료된 조회입니다.' });
  job.cancelled = true;
  for (const controller of job.controllers) controller.abort();
  res.json({ ok: true });
});

module.exports = router;
