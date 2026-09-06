const { search } = require('./naraClient');
const { normalizeItem } = require('./normalize');
const { getJob, touch } = require('./jobStore');

// SRC-005 정밀조회/빠른조회 백그라운드 실행기.
// 청크("시작일+1개월", chunk.js 참고)를 순차 호출하며 잡 상태를 실시간으로 갱신한다 (6.3 상태 피드백).
function matchesKeyword(item, keywordFilter) {
  if (!keywordFilter?.keyword) return true;
  const q = keywordFilter.keyword.toLowerCase();
  if (keywordFilter.keywordType === 'company') return (item.winner?.name || '').toLowerCase().includes(q);
  // CMP-006·010: 경쟁사 등록 목록은 사업자번호로 정확히 매칭한다 (동명이인 업체 혼동 방지)
  if (keywordFilter.keywordType === 'bizno') return item.winner?.bizNo === keywordFilter.keyword;
  return (item.title || '').toLowerCase().includes(q) || (item.bidNo || '').toLowerCase().includes(q);
}

async function runJob(jobId, kind, bizCode, windows, keywordFilter) {
  const job = getJob(jobId);
  if (!job) return;

  const seenIds = new Set();
  job.apiCallCount = 0;
  job.estimatedTotalAvailable = 0; // API가 알려준 실제 총건수 합 (dedup 전, all업무구분이면 4개 합산)
  job.truncatedChunks = []; // 청크당 999건 상한에 걸려 못 가져온 구간 — 6.3: 누락 가능성을 숨기지 않는다

  for (const window of windows) {
    if (job.cancelled) break;

    const controller = new AbortController();
    job.controllers.add(controller);
    try {
      const {
        items: rawItems,
        errors,
        truncatedByPageCap,
        callCount,
        totalCount,
        fetchedCount,
      } = await search(kind, bizCode, {
        from: window.from.replaceAll('-', ''),
        to: window.to.replaceAll('-', ''),
        signal: controller.signal,
      });

      job.apiCallCount += callCount;
      job.estimatedTotalAvailable += totalCount;
      if (truncatedByPageCap) {
        job.truncatedChunks.push({ ...window, totalCount, fetchedCount });
      }

      for (const raw of rawItems) {
        const item = normalizeItem(raw);
        if (seenIds.has(item.id)) continue; // 6.3·중복제거: 동일 공고번호+차수 단일화
        seenIds.add(item.id);
        if (matchesKeyword(item, keywordFilter)) job.items.push(item);
      }
      if (errors.length > 0) job.errors.push(...errors.map((e) => ({ ...e, window })));
    } catch (e) {
      if (e.name === 'AbortError') {
        job.controllers.delete(controller);
        break; // SRC-007 조회 중단
      }
      job.errors.push({ window, message: e.message, resultCode: e.resultCode });
    } finally {
      job.controllers.delete(controller);
      job.chunk.done += 1;
      touch(job);
    }
  }

  job.status = job.cancelled ? 'cancelled' : 'done';
  job.elapsedMs = Date.now() - job.startedAt;
  touch(job);
}

module.exports = { runJob };
