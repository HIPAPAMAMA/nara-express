import { useState } from 'react';
import { searchOrderPlans } from '../../api/client';
import { formatAmount } from '../../lib/format';
import { toSearchKeyword } from '../../lib/titleKeyword';

// 발주계획 레이더 — 아직 입찰공고로 뜨기 전, 기관이 미리 공시한 연간 발주계획에서 키워드를 찾는다.
// "공고 게시됨"이면 이미 실제 입찰공고로 이어진 상태라는 뜻 — 그럴 땐 공고 검색으로 바로 확인.
export default function OrderPlanRadar({ onSearchBid }) {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (trimmed.length < 2) {
      setError('키워드를 2자 이상 입력하세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await searchOrderPlans(trimmed);
      setResult(res);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-cream-400 bg-cream-100 p-4">
      <h2 className="mb-1 text-sm font-medium text-ink-800">발주계획 레이더</h2>
      <p className="mb-3 text-xs text-ink-400">공고 전 신호 — 앞으로 6개월 이내 공시된 발주계획에서 검색</p>
      <form onSubmit={handleSearch} className="mb-2 flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="예: 정보시스템"
          className="min-w-0 flex-1 rounded-md border border-cream-400 px-3 py-1.5 text-sm outline-none focus:border-clay-400"
        />
        <button type="submit" disabled={loading} className="shrink-0 rounded-md bg-clay-400 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
          {loading ? '조회 중…' : '발주계획 조회'}
        </button>
      </form>
      {error && <p className="mb-2 text-[12px] text-amber-800">{error}</p>}
      {result && (
        <div>
          <p className="mb-2 text-[12px] text-ink-400">
            {result.windowFrom}~{result.windowTo} 공시 발주계획 중 {result.plans.length}건
          </p>
          {result.plans.length === 0 ? (
            <p className="rounded-lg bg-cream-50 p-3 text-[12px] text-ink-300">일치하는 발주계획이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {result.plans.map((p) => (
                <li key={p.id} className="rounded-lg border border-cream-400 bg-cream-50 p-2.5">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <span className="text-xs text-ink-800">{p.title}</span>
                    {p.alreadyAnnounced && (
                      <span className="shrink-0 rounded bg-sage-100 px-1.5 py-0.5 text-[11px] font-medium text-sage-600">공고 게시됨</span>
                    )}
                  </div>
                  <div className="mb-1 text-[12px] text-ink-400">
                    {p.orderOrg} · {p.bizType} · {p.contractMethod || '계약방법 미정'} · {formatAmount(p.amount)}
                  </div>
                  <div className="mb-2 text-[12px] text-ink-300">
                    발주예정 {p.orderMonth || '-'} · 담당 {p.dept || '-'} {p.officer ? `· ${p.officer}` : ''}
                  </div>
                  <div className="flex gap-1.5">
                    {p.sourceUrl && (
                      <a
                        href={p.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 rounded-md border border-cream-400 py-1 text-center text-[12px] text-ink-600 hover:bg-cream-200"
                      >
                        발주계획 원문
                      </a>
                    )}
                    <button
                      onClick={() => onSearchBid(toSearchKeyword(p.title))}
                      className="flex-1 rounded-md border border-cream-400 py-1 text-[12px] text-ink-600 hover:bg-cream-200"
                    >
                      공고 검색
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
