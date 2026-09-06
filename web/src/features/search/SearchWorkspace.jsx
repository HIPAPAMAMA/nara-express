import { useRef, useState } from 'react';
import SearchForm from './SearchForm';
import ResultsList from '../results/ResultsList';
import SummaryPanel from '../results/SummaryPanel';
import { createSearchJob, getSearchJob, cancelSearchJob } from '../../api/client';

const POLL_INTERVAL_MS = 400;

function applyAdvancedFilters(items, params) {
  let list = items;
  if (params.orderOrg) list = list.filter((i) => (i.orderOrg || '').includes(params.orderOrg));
  if (params.demandOrg) list = list.filter((i) => (i.demandOrg || '').includes(params.demandOrg));
  if (params.priceMin != null) list = list.filter((i) => (i.estimatedPrice ?? i.awardAmount ?? 0) >= params.priceMin);
  if (params.priceMax != null) list = list.filter((i) => (i.estimatedPrice ?? i.awardAmount ?? 0) <= params.priceMax);
  return list;
}

export default function SearchWorkspace({ onOpenDetail }) {
  const [job, setJob] = useState(null); // 서버 잡 상태 원본 (진행 중 폴링 결과)
  const [response, setResponse] = useState(null); // ResultsList에 넘길 가공된 결과
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const currentJobIdRef = useRef(null);
  const paramsRef = useRef(null);

  function stopPolling() {
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRef.current = null;
  }

  function buildResponse(jobData, params) {
    const items = applyAdvancedFilters(jobData.items, params);
    return {
      items,
      totalCount: items.length,
      chunk: jobData.chunk,
      elapsedMs: jobData.elapsedMs ?? Date.now() - jobData.startedAt,
      mode: jobData.mode,
      truncated: jobData.truncated,
      range: jobData.range,
      partialErrors: jobData.errors?.length ? jobData.errors : undefined,
      estimatedTotalAvailable: jobData.estimatedTotalAvailable,
      truncatedChunks: jobData.truncatedChunks,
      jobStatus: jobData.status,
    };
  }

  async function poll(jobId, params) {
    if (currentJobIdRef.current !== jobId) return; // 새 조회가 시작됐으면 이전 폴링 중단
    try {
      const jobData = await getSearchJob(jobId);
      setJob(jobData);
      setResponse(buildResponse(jobData, params));
      if (jobData.status === 'running') {
        pollRef.current = setTimeout(() => poll(jobId, params), POLL_INTERVAL_MS);
      } else {
        setLoading(false);
      }
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  async function handleSearch(params) {
    stopPolling();
    setLoading(true);
    setError(null);
    paramsRef.current = params;
    try {
      const { jobId } = await createSearchJob(params);
      currentJobIdRef.current = jobId;
      poll(jobId, params);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!currentJobIdRef.current) return;
    try {
      await cancelSearchJob(currentJobIdRef.current);
    } catch {
      // 이미 끝난 잡이면 취소 실패는 무시
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
      <div className="flex flex-col gap-4">
        <SearchForm onSearch={handleSearch} loading={loading} onCancel={handleCancel} />
        <SummaryPanel response={response} />
      </div>
      <ResultsList response={response} loading={loading && !response} error={error} onOpenDetail={onOpenDetail} />
    </div>
  );
}
