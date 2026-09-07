import { useMemo, useRef, useState } from 'react';
import ResultRow from './ResultRow';
import { exportCsv, exportExcel } from '../../lib/export';
import { DESKTOP_GRID_COLS } from './gridTemplate';

const TYPE_FILTERS = ['전체', '낙찰결과', '입찰공고', '사전규격', '유찰·재입찰만'];
const KIND_LABEL = { award: '낙찰결과', bid: '입찰공고', prespec: '사전규격' };
const SORT_OPTIONS = [
  { value: 'default', label: '기본' },
  { value: 'amountDesc', label: '금액높은순' },
  { value: 'amountAsc', label: '금액낮은순' },
  { value: 'deadline', label: '마감임박순' },
  { value: 'recent', label: '최신순' },
];

function amountOf(item) {
  return item.awardAmount ?? item.estimatedPrice ?? 0;
}

export default function ResultsList({ response, loading, error, onOpenDetail }) {
  const [typeFilter, setTypeFilter] = useState('전체');
  const [textFilter, setTextFilter] = useState(''); // RES-004
  const [sort, setSort] = useState('default');
  const [dense, setDense] = useState(false); // RES-007
  const [visibleCount, setVisibleCount] = useState(30); // RES-008
  const topRef = useRef(null);

  const items = response?.items ?? [];

  const filtered = useMemo(() => {
    let list = items;
    if (typeFilter === '낙찰결과') list = list.filter((i) => i.kind === 'award');
    else if (typeFilter === '입찰공고') list = list.filter((i) => i.kind === 'bid');
    else if (typeFilter === '사전규격') list = list.filter((i) => i.kind === 'prespec');
    else if (typeFilter === '유찰·재입찰만') list = list.filter((i) => i.isFailed);

    if (textFilter) {
      const q = textFilter.toLowerCase();
      list = list.filter((i) => (i.title || '').toLowerCase().includes(q) || (i.bidNo || '').toLowerCase().includes(q));
    }

    const sorted = [...list];
    if (sort === 'amountDesc') sorted.sort((a, b) => amountOf(b) - amountOf(a));
    else if (sort === 'amountAsc') sorted.sort((a, b) => amountOf(a) - amountOf(b));
    else if (sort === 'deadline') sorted.sort((a, b) => new Date(a.bidDeadline || 0) - new Date(b.bidDeadline || 0));
    else if (sort === 'recent') sorted.sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0));
    return sorted;
  }, [items, typeFilter, textFilter, sort]);

  const visible = filtered.slice(0, visibleCount);

  function copyBidNo(bidNo) {
    navigator.clipboard?.writeText(bidNo);
  }

  if (loading) {
    return <div className="rounded-xl border border-cream-400 bg-cream-100 p-10 text-center text-sm text-ink-400">조회 중입니다…</div>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-400 bg-amber-100 p-4 text-sm text-amber-800">
        {error}
      </div>
    );
  }

  if (!response) {
    return (
      <div className="rounded-xl border border-cream-400 bg-cream-100 p-10 text-center text-sm text-ink-400">
        조회 조건을 설정하고 조회하기를 눌러주세요.
      </div>
    );
  }

  if (items.length === 0 && response.jobStatus !== 'running') {
    // RES-024
    return (
      <div className="rounded-xl border border-cream-400 bg-cream-100 p-10 text-center text-sm text-ink-400">
        조건에 맞는 결과가 없습니다. 기간이나 검색어를 조정해보세요.
      </div>
    );
  }

  const running = response.jobStatus === 'running';
  const cancelled = response.jobStatus === 'cancelled';

  return (
    <div ref={topRef}>
      {/* RES-002 조회 요약/진행 배너 — 6.3: 진행률·소요시간을 그대로 노출 */}
      <div className="mb-3 rounded-lg bg-clay-50 px-3.5 py-2 text-xs text-clay-600">
        {running ? (
          <>
            조회 중… 청크 <b>{response.chunk.done}/{response.chunk.total}</b> · 지금까지 <b>{response.totalCount}</b>건 · {(response.elapsedMs / 1000).toFixed(1)}초 경과
          </>
        ) : (
          <>
            {cancelled ? '조회 중단됨' : '조회 완료'} <b>{response.totalCount}</b>건 · 조회 범위 {response.range?.from} ~ {response.range?.to} · {(response.elapsedMs / 1000).toFixed(1)}초
          </>
        )}
        {response.partialErrors && (
          <span className="ml-2 text-amber-800">(일부 구간 조회 실패: {response.partialErrors.length}건)</span>
        )}
      </div>

      {/* RES-003: 빠른 조회로 범위가 잘렸을 때 */}
      {response.truncated && (
        <div className="mb-3 rounded-lg border border-amber-400 bg-amber-100 px-3.5 py-2 text-xs text-amber-800">
          빠른 조회라 최근 구간만 표시됩니다. 전체 기간을 다 보려면 <b>정밀 조회</b>를 선택하세요.
        </div>
      )}

      {/* T-10: 구간당 999건 상한으로 실제보다 적게 표시된 경우 — 누락 가능성을 숨기지 않는다 */}
      {!running && response.truncatedChunks?.length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-400 bg-amber-100 px-3.5 py-2 text-xs text-amber-800">
          실제로는 약 <b>{response.estimatedTotalAvailable.toLocaleString()}</b>건이 있지만, 구간당 999건 상한 때문에{' '}
          <b>{response.truncatedChunks.length}개 구간</b>에서 일부만 표시됩니다. 기간을 좁혀 다시 조회하면 더 정확합니다.
        </div>
      )}

      {/* 데스크톱 툴바 — 한 줄에 다 들어갈 폭이 있을 때 */}
      <div className="mb-3 hidden items-center gap-2 md:flex">
        <div className="flex flex-wrap gap-1">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-md px-2.5 py-1 text-xs ${
                typeFilter === t ? 'bg-clay-100 text-clay-600 font-medium' : 'border border-cream-400 text-ink-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
          placeholder="결과 내 검색"
          className="ml-auto w-48 rounded-md border border-cream-400 px-2 py-1 text-xs"
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-md border border-cream-400 px-2 py-1 text-xs">
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button onClick={() => setDense((v) => !v)} className="rounded-md border border-cream-400 px-2.5 py-1 text-xs text-ink-600">
          {dense ? '상세 보기' : '간단 보기'}
        </button>
        <button onClick={() => exportCsv(filtered)} className="rounded-md border border-cream-400 px-2.5 py-1 text-xs text-ink-600">
          CSV
        </button>
        <button onClick={() => exportExcel(filtered)} className="rounded-md border border-cream-400 px-2.5 py-1 text-xs text-ink-600">
          Excel
        </button>
      </div>

      {/* 모바일 툴바 — 한 줄에 다 못 들어가서 역할별로 줄바꿈 */}
      <div className="mb-3 flex flex-col gap-2 md:hidden">
        <div className="flex flex-wrap gap-1">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-md px-2.5 py-1 text-xs ${
                typeFilter === t ? 'bg-clay-100 text-clay-600 font-medium' : 'border border-cream-400 text-ink-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
            placeholder="결과 내 검색"
            className="min-w-0 flex-1 rounded-md border border-cream-400 px-2 py-1 text-xs"
          />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-md border border-cream-400 px-2 py-1 text-xs">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setDense((v) => !v)} className="flex-1 rounded-md border border-cream-400 px-2.5 py-1 text-[12px] text-ink-600">
            {dense ? '상세 보기' : '간단 보기'}
          </button>
          <button onClick={() => exportCsv(filtered)} className="flex-1 rounded-md border border-cream-400 px-2.5 py-1 text-[12px] text-ink-600">
            CSV
          </button>
          <button onClick={() => exportExcel(filtered)} className="flex-1 rounded-md border border-cream-400 px-2.5 py-1 text-[12px] text-ink-600">
            Excel
          </button>
        </div>
      </div>

      {/* 7.4절: 좁은 창에서는 표 영역만 가로 스크롤 허용 (필터·네비는 고정) — 720px 최소폭은 데스크톱 표 전용, 모바일 카드엔 강제하지 않는다 */}
      <div className="overflow-x-auto rounded-xl border border-cream-400 bg-cream-50">
        <div className={`hidden lg:grid lg:min-w-[720px] ${DESKTOP_GRID_COLS} gap-3 border-b border-cream-400 bg-cream-100 px-3.5 py-2 text-[12px] font-medium text-ink-400`}>
          <div>공고·사업명</div>
          <div>업체·기관</div>
          <div className="text-right">금액·일정</div>
          <div className="text-right">핵심지표</div>
        </div>
        <div className="lg:min-w-[720px]">
          {visible.map((item) => (
            <ResultRow key={item.id} item={item} dense={dense} onOpenDetail={onOpenDetail} onCopyBidNo={copyBidNo} />
          ))}
        </div>
      </div>

      <div className="mt-3 flex justify-center gap-2">
        {visibleCount < filtered.length && (
          <button
            onClick={() => setVisibleCount((v) => v + 30)}
            className="rounded-lg border border-cream-400 px-4 py-2 text-xs text-ink-600"
          >
            더 보기 ({filtered.length - visibleCount}건 남음)
          </button>
        )}
        <button
          onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="rounded-lg border border-cream-400 px-4 py-2 text-xs text-ink-600"
        >
          맨 위로
        </button>
      </div>
    </div>
  );
}
