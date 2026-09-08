import { useMemo, useState } from 'react';
import { loadSavedItems } from '../../lib/savedItems';
import { createSearchJob, stepSearchJob } from '../../api/client';
import { formatAmount, formatDateTime, deadlineBadge } from '../../lib/format';
import ReannounceRadar from '../search/ReannounceRadar';
import OrderPlanRadar from '../search/OrderPlanRadar';

const MAX_KEYWORDS_TO_CHECK = 3;
const MAX_POLLS = 40; // 이 이상 걸리면 포기 — 대시보드는 빠른 확인용이지 정밀조회가 아님

function loadKeywords() {
  try {
    return JSON.parse(localStorage.getItem('keywords') || '[]');
  } catch {
    return [];
  }
}
function loadCompetitors() {
  try {
    return JSON.parse(localStorage.getItem('competitors') || '[]');
  } catch {
    return [];
  }
}
function loadMyCompany() {
  try {
    return JSON.parse(localStorage.getItem('myCompany') || 'null');
  } catch {
    return null;
  }
}

function pad(n) {
  return String(n).padStart(2, '0');
}
function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 최근 31일 · 빠른 조회로 키워드 하나를 검색하고 끝까지 진행시킨다 (KWD-002와 같은 조건)
async function quickTitleSearch(keyword) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 31);
  const { jobId } = await createSearchJob({
    kind: 'bid',
    from: toDateStr(from),
    to: toDateStr(to),
    bizType: '전체',
    mode: 'quick',
    keywordType: 'title',
    keyword,
  });
  for (let i = 0; i < MAX_POLLS; i++) {
    const job = await stepSearchJob(jobId);
    if (job.status !== 'running') return job.items || [];
  }
  return [];
}

// 대시보드 — 매일 들어와서 한눈에 보는 화면(신규). API 호출이 부담스러운 검색은 자동으로 안 돌리고
// "지금 확인" 버튼으로만 실행 — 앱을 열 때마다 정부 API를 자동으로 두드리지 않기 위함.
export default function DashboardWorkspace({ onOpenDetail, onNavigate, onSearchBid }) {
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState(null);
  const [newBids, setNewBids] = useState(null);
  const [checkError, setCheckError] = useState(null);

  const savedDeadlines = useMemo(() => {
    return loadSavedItems()
      .filter((it) => it.kind === 'bid' && deadlineBadge(it.bidDeadline))
      .sort((a, b) => new Date(a.bidDeadline) - new Date(b.bidDeadline))
      .slice(0, 5);
  }, []);

  const keywords = useMemo(loadKeywords, []);
  const competitors = useMemo(loadCompetitors, []);
  const myCompany = useMemo(loadMyCompany, []);

  async function handleCheckNow() {
    setChecking(true);
    setCheckError(null);
    try {
      const targets = keywords.slice(0, MAX_KEYWORDS_TO_CHECK);
      const results = await Promise.all(targets.map((kw) => quickTitleSearch(kw)));
      const seen = new Set();
      const merged = [];
      for (const items of results) {
        for (const item of items) {
          if (seen.has(item.id)) continue;
          seen.add(item.id);
          merged.push(item);
        }
      }
      merged.sort((a, b) => new Date(a.bidDeadline || 0) - new Date(b.bidDeadline || 0));
      setNewBids(merged);
      setCheckedAt(new Date());
    } catch (e) {
      setCheckError(e.message);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="rounded-xl border border-cream-400 bg-cream-100 p-4">
        <h2 className="mb-1 text-sm font-medium text-ink-800">등록 현황</h2>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <button onClick={() => onNavigate('keyword')} className="rounded-lg bg-cream-50 p-3 hover:bg-cream-200">
            <div className="text-lg font-medium text-ink-800">{keywords.length}</div>
            <div className="text-ink-400">관심 키워드</div>
          </button>
          <button onClick={() => onNavigate('competitor')} className="rounded-lg bg-cream-50 p-3 hover:bg-cream-200">
            <div className="text-lg font-medium text-ink-800">{competitors.length}</div>
            <div className="text-ink-400">경쟁사</div>
          </button>
          <button onClick={() => onNavigate('company')} className="rounded-lg bg-cream-50 p-3 hover:bg-cream-200">
            <div className="text-sm font-medium text-ink-800">{myCompany?.corpNm ? '등록됨' : '미등록'}</div>
            <div className="text-ink-400">내 업체</div>
          </button>
        </div>
      </div>

      <ReannounceRadar onSearchBid={onSearchBid} />
      <OrderPlanRadar onSearchBid={onSearchBid} />

      <div className="rounded-xl border border-cream-400 bg-cream-100 p-4">
        <h2 className="mb-1 text-sm font-medium text-ink-800">
          저장내역 마감 임박 <span className="text-ink-400">({savedDeadlines.length}건)</span>
        </h2>
        {savedDeadlines.length === 0 ? (
          <p className="text-xs text-ink-300">마감이 임박한 저장 공고가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-cream-400">
            {savedDeadlines.map((it) => {
              const badge = deadlineBadge(it.bidDeadline);
              return (
                <li key={it.id} className="flex items-center justify-between gap-2 py-2">
                  <button onClick={() => onOpenDetail(it)} className="min-w-0 flex-1 truncate text-left text-xs text-ink-800 hover:underline">
                    {it.title}
                  </button>
                  <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">{badge.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-cream-400 bg-cream-100 p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink-800">관심 키워드 새 공고</h2>
          <button
            onClick={handleCheckNow}
            disabled={checking || keywords.length === 0}
            className="rounded-md bg-clay-400 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {checking ? '확인 중…' : '지금 확인'}
          </button>
        </div>
        <p className="mb-2 text-xs text-ink-400">
          {keywords.length === 0
            ? '관심 키워드를 등록하면 최근 31일 새 공고를 확인할 수 있습니다.'
            : `등록된 키워드 중 최근 ${Math.min(keywords.length, MAX_KEYWORDS_TO_CHECK)}개를 확인합니다 (앱을 열 때 자동으로는 확인하지 않습니다).`}
        </p>
        {checkError && <p className="mb-2 text-[12px] text-amber-800">{checkError}</p>}
        {checkedAt && (
          <p className="mb-2 text-[12px] text-ink-300">
            {checkedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 확인 · {newBids?.length ?? 0}건
          </p>
        )}
        {newBids && newBids.length > 0 && (
          <ul className="divide-y divide-cream-400">
            {newBids.slice(0, 10).map((it) => (
              <li key={it.id} className="py-2">
                <button onClick={() => onOpenDetail(it)} className="block w-full text-left text-xs text-ink-800 hover:underline">
                  {it.title}
                </button>
                <div className="text-[12px] text-ink-400">
                  {it.orderOrg} · {formatAmount(it.estimatedPrice)} · 마감 {formatDateTime(it.bidDeadline)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
