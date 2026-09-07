import { useMemo, useState } from 'react';
import { loadSavedItems } from '../../lib/savedItems';
import ResultRow from '../results/ResultRow';
import { exportCsv, exportExcel } from '../../lib/export';

const KIND_LABEL = { bid: '입찰공고', award: '낙찰결과', prespec: '사전규격' };

// SC-06 저장내역: SAV-001(저장/해제) SAV-002(목록 조회). SAV-003(첨부파일 보관)은 미구현.
export default function SavedWorkspace({ onOpenDetail }) {
  const [items, setItems] = useState(loadSavedItems);

  const kindCounts = useMemo(() => {
    const map = new Map();
    for (const it of items) map.set(it.kind, (map.get(it.kind) || 0) + 1);
    return [...map.entries()];
  }, [items]);

  function handleToggleSave(item, nowSaved) {
    if (!nowSaved) setItems((list) => list.filter((it) => it.id !== item.id));
  }

  function copyBidNo(bidNo) {
    navigator.clipboard?.writeText(bidNo);
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-cream-400 bg-cream-100 p-10 text-center text-sm text-ink-400">
        저장된 공고가 없습니다. 조회 결과 목록에서 ☆ 아이콘을 눌러 저장하세요.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_240px]">
      <div>
        <h2 className="mb-3 text-sm font-medium text-ink-800">
          저장내역 <span className="rounded-full bg-clay-100 px-2 py-0.5 text-xs text-clay-600">{items.length}건</span>
        </h2>
        <div className="rounded-xl border border-cream-400 bg-cream-50">
          {items.map((item) => (
            <ResultRow key={item.id} item={item} dense={false} onOpenDetail={onOpenDetail} onCopyBidNo={copyBidNo} onToggleSave={handleToggleSave} />
          ))}
        </div>
      </div>

      {/* 데스크톱 전용 요약 — 모바일은 헤딩의 건수 뱃지로 충분해서 숨김 */}
      <div className="hidden lg:block">
        <div className="rounded-xl border border-cream-400 bg-cream-100 p-4 text-xs">
          <div className="mb-2 text-[12px] font-medium text-ink-400">유형별 건수</div>
          <dl className="mb-3 space-y-1.5">
            {kindCounts.map(([kind, count]) => (
              <div key={kind} className="flex justify-between">
                <dt className="text-ink-400">{KIND_LABEL[kind] || kind}</dt>
                <dd className="tabular-nums text-ink-800">{count}건</dd>
              </div>
            ))}
          </dl>
          <div className="flex gap-2">
            <button onClick={() => exportCsv(items)} className="flex-1 rounded-md border border-cream-400 px-2.5 py-1.5 text-ink-600">
              CSV
            </button>
            <button onClick={() => exportExcel(items)} className="flex-1 rounded-md border border-cream-400 px-2.5 py-1.5 text-ink-600">
              Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
