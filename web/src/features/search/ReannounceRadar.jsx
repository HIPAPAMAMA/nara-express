import { useState } from 'react';
import { predictReannouncement } from '../../api/client';
import { formatAmount, formatRate } from '../../lib/format';
import { toSearchKeyword } from '../../lib/titleKeyword';

// 재공고 레이더 — 작년 이맘때 낙찰된 건을 찾아 올해 재공고 시점을 추정한다(확정 공고 아님).
// 단가계약성 용역(청소·경비 등)이 1년 주기로 재발주되는 관행을 이용한 참고용 예측.
export default function ReannounceRadar({ onSearchBid }) {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handlePredict(e) {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (trimmed.length < 2) {
      setError('키워드를 2자 이상 입력하세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await predictReannouncement(trimmed);
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
      <h2 className="mb-1 text-sm font-medium text-ink-800">재공고 레이더</h2>
      <p className="mb-3 text-xs text-ink-400">작년 이맘때 낙찰 → 올해 재공고 예측 (추정치, 확정 공고 아님)</p>
      <form onSubmit={handlePredict} className="mb-2 flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="예: 청소용역"
          className="min-w-0 flex-1 rounded-md border border-cream-400 px-3 py-1.5 text-sm outline-none focus:border-clay-400"
        />
        <button type="submit" disabled={loading} className="shrink-0 rounded-md bg-clay-400 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
          {loading ? '예측 중…' : '재공고 예측'}
        </button>
      </form>
      {error && <p className="mb-2 text-[12px] text-amber-800">{error}</p>}
      {result && (
        <div>
          <p className="mb-2 text-[12px] text-ink-400">
            작년 {result.windowFrom}~{result.windowTo} 낙찰 {result.totalMatched}건 중 1주년 임박순 {result.predictions.length}건
          </p>
          {result.predictions.length === 0 ? (
            <p className="rounded-lg bg-cream-50 p-3 text-[12px] text-ink-300">일치하는 작년 낙찰 이력이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {result.predictions.map((p) => (
                <li key={p.id} className="rounded-lg border border-cream-400 bg-cream-50 p-2.5">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <span className="text-xs text-ink-800">{p.title}</span>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                        p.dDay <= 7 ? 'bg-amber-100 text-amber-800' : 'bg-ink-100 text-ink-600'
                      }`}
                    >
                      {p.dDay < 0 ? `D+${-p.dDay}` : `D-${p.dDay}`}
                    </span>
                  </div>
                  <div className="mb-1 text-[12px] text-ink-400">
                    현직 {p.winner?.name || '-'} · 낙찰률 {formatRate(p.awardRate)}% · {formatAmount(p.awardAmount)}
                  </div>
                  <div className="mb-2 text-[12px] text-ink-300">
                    작년 낙찰 {p.lastAwardDate} → 1주년 {p.predictedDate}
                  </div>
                  <button
                    onClick={() => onSearchBid(toSearchKeyword(p.title))}
                    className="w-full rounded-md border border-cream-400 py-1 text-[12px] text-ink-600 hover:bg-cream-200"
                  >
                    공고 검색
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
