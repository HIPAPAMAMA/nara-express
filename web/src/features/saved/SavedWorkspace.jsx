import { useState } from 'react';
import { loadSavedItems } from '../../lib/savedItems';
import ResultRow from '../results/ResultRow';

// SC-06 저장내역: SAV-001(저장/해제) SAV-002(목록 조회). SAV-003(첨부파일 보관)은 미구현.
export default function SavedWorkspace({ onOpenDetail }) {
  const [items, setItems] = useState(loadSavedItems);

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
  );
}
