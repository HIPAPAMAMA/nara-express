const { search } = require('./naraClient');
const { normalizeItem } = require('./normalize');
const { getJob, saveJob } = require('./jobStore');

// 2단계 청크 엔진 — Vercel 서버리스 호환을 위해 "한 호출당 청크 1개만 처리"하는 구조.
// 프론트가 done 상태가 아닐 때까지 이 함수를 반복 호출한다 (SearchWorkspace.jsx의 poll 참고).
function matchesKeyword(item, keywordFilter) {
  if (!keywordFilter?.keyword) return true;
  const q = keywordFilter.keyword.toLowerCase();
  if (keywordFilter.keywordType === 'company') return (item.winner?.name || '').toLowerCase().includes(q);
  if (keywordFilter.keywordType === 'bizno') return item.winner?.bizNo === keywordFilter.keyword;
  return (item.title || '').toLowerCase().includes(q) || (item.bidNo || '').toLowerCase().includes(q);
}

/** jobId의 다음 청크 1개를 처리하고 갱신된 job을 반환한다. 이미 끝났으면 그대로 반환. */
async function stepJob(jobId) {
  const job = await getJob(jobId);
  if (!job) return null;

  if (job.status !== 'running') return job; // 이미 done/cancelled — 아무 것도 안 하고 그대로 반환

  if (job.cursor >= job.windows.length) {
    job.status = 'done';
    job.elapsedMs = Date.now() - job.startedAt;
    return saveJob(job);
  }

  const window = job.windows[job.cursor];
  try {
    const {
      items: rawItems,
      errors,
      truncatedByPageCap,
      callCount,
      totalCount,
      fetchedCount,
    } = await search(job.kind, job.bizCode, {
      from: window.from.replaceAll('-', ''),
      to: window.to.replaceAll('-', ''),
    });

    job.apiCallCount += callCount;
    job.estimatedTotalAvailable += totalCount;
    if (truncatedByPageCap) job.truncatedChunks.push({ ...window, totalCount, fetchedCount });

    const seen = new Set(job.items.map((it) => it.id)); // 6.3·중복제거: 동일 공고번호+차수 단일화
    for (const raw of rawItems) {
      const item = normalizeItem(raw);
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      if (matchesKeyword(item, job.keywordFilter)) job.items.push(item);
    }
    if (errors.length > 0) job.errors.push(...errors.map((e) => ({ ...e, window })));
  } catch (e) {
    job.errors.push({ window, message: e.message, resultCode: e.resultCode });
  }

  job.cursor += 1;
  job.chunk.done = job.cursor;

  if (job.cursor >= job.windows.length) {
    job.status = 'done';
    job.elapsedMs = Date.now() - job.startedAt;
  }

  return saveJob(job);
}

module.exports = { stepJob };
