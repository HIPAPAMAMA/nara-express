// 2단계 청크 조회 진행상황 저장소.
//
// ⚠️ 아키텍처 변경 (2026-09-07, Vercel 전환): 예전엔 서버 프로세스가 계속 켜져있는 걸
// 전제로 메모리(Map)에 저장하고 백그라운드에서 계속 처리했다. Vercel 서버리스 함수는
// 응답을 보내면 프로세스가 바로 얼려지고, 다음 요청이 같은 인스턴스로 간다는 보장도 없어서
// 그 방식이 안 통한다. 그래서 "청크 1개 처리 → 저장 → 응답"을 프론트가 반복 호출하는
// 방식으로 바꾸고(searchJob.js의 stepJob), 상태 저장소도 KV_REST_API_URL이 있으면
// Vercel KV(여러 인스턴스가 공유하는 저장소)를, 없으면(로컬 개발) 메모리 Map을 쓴다.

const crypto = require('node:crypto');

let kv = null;
if (process.env.KV_REST_API_URL) {
  // eslint-disable-next-line global-require
  kv = require('@vercel/kv').kv;
}

const memoryStore = new Map(); // 로컬 개발 전용 폴백 — Vercel 배포 시엔 안 쓰인다
const TTL_SECONDS = 30 * 60;

function keyFor(jobId) {
  return `job:${jobId}`;
}

async function createJob(meta) {
  const id = crypto.randomUUID();
  const job = {
    id,
    status: 'running', // running | done | cancelled | error
    items: [],
    chunk: { done: 0, total: meta.chunkCount },
    errors: [],
    startedAt: Date.now(),
    updatedAt: Date.now(),
    cancelled: false,
    cursor: 0, // 다음에 처리할 windows 배열의 인덱스
    apiCallCount: 0,
    estimatedTotalAvailable: 0,
    truncatedChunks: [],
    ...meta,
  };
  await saveJob(job);
  return id;
}

async function getJob(id) {
  if (kv) return (await kv.get(keyFor(id))) || null;
  return memoryStore.get(id) || null;
}

async function saveJob(job) {
  job.updatedAt = Date.now();
  if (kv) await kv.set(keyFor(job.id), job, { ex: TTL_SECONDS });
  else memoryStore.set(job.id, job);
  return job;
}

// 로컬 메모리 폴백에서만 의미 있는 정리 작업 (KV는 ex 옵션으로 자동 만료됨)
setInterval(() => {
  if (kv) return;
  const now = Date.now();
  for (const [id, job] of memoryStore) {
    if (now - job.updatedAt > TTL_SECONDS * 1000) memoryStore.delete(id);
  }
}, 60_000).unref();

module.exports = { createJob, getJob, saveJob };
