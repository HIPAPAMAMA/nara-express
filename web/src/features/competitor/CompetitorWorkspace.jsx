import { useEffect, useRef, useState } from 'react';
import { createSearchJob, getSearchJob } from '../../api/client';
import ResultRow from '../results/ResultRow';

const STORAGE_KEY = 'competitors';
const POLL_INTERVAL_MS = 400;

function loadCompetitors() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
function saveCompetitors(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function pad(n) {
  return String(n).padStart(2, '0');
}
function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function CompetitorWorkspace({ onOpenDetail }) {
  const [competitors, setCompetitors] = useState(loadCompetitors);
  const [selected, setSelected] = useState(new Set());
  const [bizNoInput, setBizNoInput] = useState(''); // CMP-001
  const [nameInput, setNameInput] = useState(''); // CMP-002
  const [candidates, setCandidates] = useState(null);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const [analysis, setAnalysis] = useState(null); // { items, loading, chunk, elapsedMs }
  const pollRef = useRef(null);
  const jobIdRef = useRef(null);

  useEffect(() => saveCompetitors(competitors), [competitors]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  function register(entry) {
    if (competitors.some((c) => c.bizNo === entry.bizNo)) {
      setToast('이미 등록된 업체입니다.');
      return;
    }
    setCompetitors((list) => [...list, entry]);
    setToast(`${entry.name} 등록됨`);
  }

  // CMP-001
  function handleRegisterByBizNo(e) {
    e.preventDefault();
    if (!bizNoInput.trim()) return;
    register({ name: nameInput.trim() || bizNoInput.trim(), bizNo: bizNoInput.trim() });
    setBizNoInput('');
    setNameInput('');
  }

  // CMP-002: 업체명으로 최근 1년 낙찰 데이터 내에서 자체 검색 (T-5: 정방향 검색 API 없음 → 자체 검색으로 대체)
  async function handleMatchByName(e) {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setMatching(true);
    setMatchError(null);
    setCandidates(null);
    try {
      const to = new Date();
      const from = new Date();
      from.setFullYear(from.getFullYear() - 1);
      const { jobId } = await createSearchJob({
        kind: 'award',
        from: toDateStr(from),
        to: toDateStr(to),
        bizType: '전체',
        mode: 'full',
        keywordType: 'company',
        keyword: nameInput.trim(),
      });
      let jobData;
      do {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        jobData = await getSearchJob(jobId);
      } while (jobData.status === 'running');

      const seen = new Map();
      for (const item of jobData.items) {
        if (item.winner?.bizNo && !seen.has(item.winner.bizNo)) seen.set(item.winner.bizNo, item.winner.name);
      }
      setCandidates([...seen.entries()].map(([bizNo, name]) => ({ bizNo, name })));
    } catch (e2) {
      setMatchError(e2.message);
    } finally {
      setMatching(false);
    }
  }

  function toggleSelect(bizNo) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(bizNo)) next.delete(bizNo);
      else next.add(bizNo);
      return next;
    });
  }

  function removeCompetitor(bizNo) {
    setCompetitors((list) => list.filter((c) => c.bizNo !== bizNo));
    setSelected((s) => {
      const next = new Set(s);
      next.delete(bizNo);
      return next;
    });
  }
  function removeSelected() {
    setCompetitors((list) => list.filter((c) => !selected.has(c.bizNo)));
    setSelected(new Set());
  }
  function clearAll() {
    setCompetitors([]);
    setSelected(new Set());
    setConfirmClearAll(false);
  }

  function stopPolling() {
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRef.current = null;
  }

  // CMP-010: 선택(또는 개별) 경쟁사의 낙찰 이력을 분석해 이 화면에 바로 렌더링 (별도 화면 없음)
  async function runAnalysis(targets) {
    stopPolling();
    setAnalysis({ items: [], loading: true, chunk: { done: 0, total: targets.length }, elapsedMs: 0 });
    const started = Date.now();
    const collected = [];

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const to = new Date();
      const from = new Date();
      from.setFullYear(from.getFullYear() - 2);
      try {
        const { jobId } = await createSearchJob({
          kind: 'award',
          from: toDateStr(from),
          to: toDateStr(to),
          bizType: '전체',
          mode: 'full',
          keywordType: 'bizno',
          keyword: target.bizNo,
        });
        jobIdRef.current = jobId;
        let jobData;
        do {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
          jobData = await getSearchJob(jobId);
          setAnalysis((a) => ({ ...a, chunk: { done: i, total: targets.length }, elapsedMs: Date.now() - started }));
        } while (jobData.status === 'running');
        collected.push(...jobData.items);
      } catch {
        // 개별 경쟁사 분석 실패는 건너뛰고 나머지는 계속 진행 (6.3 부분 실패 원칙)
      }
    }

    setAnalysis({ items: collected, loading: false, chunk: { done: targets.length, total: targets.length }, elapsedMs: Date.now() - started });
  }

  const totalAmount = analysis?.items.reduce((sum, it) => sum + (it.awardAmount || 0), 0) ?? 0;

  return (
    <div>
      {toast && <div className="fixed right-4 top-16 z-50 rounded-lg bg-ink-800 px-4 py-2 text-xs text-cream-50 shadow-lg">{toast}</div>}

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <form onSubmit={handleRegisterByBizNo} className="rounded-xl border border-cream-400 bg-cream-100 p-4">
          <h3 className="mb-2 text-sm font-medium text-ink-800">사업자번호 직접 등록</h3>
          <input
            value={bizNoInput}
            onChange={(e) => setBizNoInput(e.target.value)}
            placeholder="사업자등록번호"
            className="mb-2 w-full rounded-md border border-cream-400 px-2 py-1.5 text-sm"
          />
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="업체명 (선택)"
            className="mb-2 w-full rounded-md border border-cream-400 px-2 py-1.5 text-sm"
          />
          <button type="submit" className="w-full rounded-md bg-clay-400 py-1.5 text-xs font-medium text-white">
            등록
          </button>
        </form>

        <form onSubmit={handleMatchByName} className="rounded-xl border border-cream-400 bg-cream-100 p-4">
          <h3 className="mb-2 text-sm font-medium text-ink-800">업체명 자동 매칭</h3>
          <p className="mb-2 text-[11px] text-ink-400">업체명만 입력해도 자동 등록 — 최근 1년 낙찰 이력에서 검색합니다.</p>
          <div className="flex gap-2">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="업체명"
              className="flex-1 rounded-md border border-cream-400 px-2 py-1.5 text-sm"
            />
            <button type="submit" disabled={matching} className="rounded-md bg-clay-400 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">
              {matching ? '검색 중…' : '검색'}
            </button>
          </div>
          {matchError && <p className="mt-2 text-[11px] text-amber-800">{matchError}</p>}
          {candidates && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {candidates.length === 0 && <span className="text-[11px] text-ink-300">일치하는 낙찰 이력이 없습니다.</span>}
              {candidates.map((c) => (
                <button
                  key={c.bizNo}
                  onClick={() => register({ name: c.name, bizNo: c.bizNo })}
                  className="rounded-full border border-clay-400 px-2.5 py-1 text-xs text-clay-600 hover:bg-clay-50"
                >
                  {c.name} ({c.bizNo})
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="mb-4 rounded-xl border border-cream-400 bg-cream-100 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-ink-800">
            등록 목록 <span className="rounded-full bg-clay-100 px-2 py-0.5 text-xs text-clay-600">{competitors.length}개</span>
          </h3>
          {competitors.length > 0 && (
            <div className="flex gap-2 text-xs">
              <button
                disabled={selected.size === 0}
                onClick={() => runAnalysis(competitors.filter((c) => selected.has(c.bizNo)))}
                className="rounded-md border border-cream-400 px-2.5 py-1 text-ink-600 disabled:opacity-40"
              >
                선택 분석
              </button>
              <button disabled={selected.size === 0} onClick={removeSelected} className="rounded-md border border-cream-400 px-2.5 py-1 text-ink-600 disabled:opacity-40">
                선택 삭제
              </button>
              {confirmClearAll ? (
                <button onClick={clearAll} className="rounded-md border border-amber-600 bg-amber-100 px-2.5 py-1 text-amber-800">
                  정말 전체 삭제?
                </button>
              ) : (
                <button onClick={() => setConfirmClearAll(true)} className="rounded-md border border-cream-400 px-2.5 py-1 text-ink-600">
                  전체 삭제
                </button>
              )}
            </div>
          )}
        </div>

        {competitors.length === 0 ? (
          <p className="py-6 text-center text-xs text-ink-300">등록된 경쟁사가 없습니다. 업체명만 입력해도 자동 등록됩니다.</p>
        ) : (
          <div className="space-y-1">
            {competitors.map((c) => (
              <div key={c.bizNo} className="flex items-center gap-2 border-b border-cream-400 py-1.5 text-sm last:border-b-0">
                <input type="checkbox" checked={selected.has(c.bizNo)} onChange={() => toggleSelect(c.bizNo)} />
                <span className="flex-1 text-ink-800">{c.name}</span>
                <span className="text-xs text-ink-400">{c.bizNo}</span>
                <button onClick={() => runAnalysis([c])} className="rounded border border-cream-400 px-2 py-0.5 text-[11px] text-clay-600">
                  분석
                </button>
                <button onClick={() => removeCompetitor(c.bizNo)} className="rounded border border-cream-400 px-2 py-0.5 text-[11px] text-ink-400">
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {analysis && (
        <div>
          <div className="mb-3 rounded-lg bg-clay-50 px-3.5 py-2 text-xs text-clay-600">
            {analysis.loading ? (
              <>분석 중… {analysis.chunk.done}/{analysis.chunk.total}개 업체 · {(analysis.elapsedMs / 1000).toFixed(1)}초 경과</>
            ) : (
              <>
                분석 완료 · 총 낙찰금액 <b>{totalAmount.toLocaleString()}원</b> ({(totalAmount / 100000000).toFixed(1)}억) · {analysis.items.length}건
              </>
            )}
          </div>
          {!analysis.loading && analysis.items.length === 0 && (
            <div className="rounded-xl border border-cream-400 bg-cream-100 p-8 text-center text-sm text-ink-400">최근 2년 낙찰 이력이 없습니다.</div>
          )}
          {analysis.items.length > 0 && (
            <div className="rounded-xl border border-cream-400 bg-cream-50">
              {analysis.items.map((item) => (
                <ResultRow key={item.id} item={item} dense={false} onOpenDetail={onOpenDetail} onCopyBidNo={() => {}} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
