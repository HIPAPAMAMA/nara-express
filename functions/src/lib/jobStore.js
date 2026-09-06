// 2단계 청크 조회 진행상황을 담는 인메모리 저장소.
// 주의: Cloud Functions는 인스턴스가 여러 개로 스케일될 수 있어, 폴링 요청이 다른 인스턴스로
// 가면 이 잡을 못 찾을 수 있다. 개발/개인 프로젝트 단일 인스턴스 전제로 우선 구현 — 운영
// 규모가 커지면 Firestore 등 외부 저장소로 옮겨야 한다 (지금은 로그인도 DB도 없다는 설계 원칙과
// 상충하지 않는 범위에서 임시로 메모리에만 둠).

const crypto = require('node:crypto');

const jobs = new Map();
const TTL_MS = 10 * 60 * 1000;

function createJob(meta) {
  const id = crypto.randomUUID();
  jobs.set(id, {
    id,
    status: 'running', // running | done | cancelled | error
    items: [],
    chunk: { done: 0, total: meta.chunkCount },
    errors: [],
    startedAt: Date.now(),
    updatedAt: Date.now(),
    controllers: new Set(),
    cancelled: false,
    ...meta,
  });
  return id;
}

function getJob(id) {
  return jobs.get(id);
}

function touch(job) {
  job.updatedAt = Date.now();
}

// 오래된 잡 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.updatedAt > TTL_MS) jobs.delete(id);
  }
}, 60_000).unref();

function toPublicJob(job) {
  if (!job) return null;
  const { controllers, ...pub } = job;
  return pub;
}

module.exports = { createJob, getJob, touch, toPublicJob };
