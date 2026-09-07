const KIND_LABEL = { bid: '입찰공고', award: '낙찰결과', prespec: '사전규격' };

function loadSavedCount() {
  try {
    return JSON.parse(localStorage.getItem('savedItems') || '[]').length;
  } catch {
    return 0;
  }
}

// RES-021: 사이드 요약 패널 — 검색건수 / 조회유형 / 조회기간 / 저장항목 수
export default function SummaryPanel({ response }) {
  if (!response) {
    return (
      <div className="rounded-xl border border-cream-400 bg-cream-100 p-4 text-xs text-ink-400">
        조회 후 요약 정보가 여기에 표시됩니다.
      </div>
    );
  }
  const kind = response.items[0]?.kind;

  return (
    <div className="rounded-xl border border-cream-400 bg-cream-100 p-4 text-xs">
      <div className="mb-2 text-[12px] font-medium text-ink-400">조회 요약</div>
      <dl className="space-y-1.5">
        <div className="flex justify-between">
          <dt className="text-ink-400">검색건수</dt>
          <dd className="tabular-nums text-ink-800">{response.totalCount}건</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-400">조회유형</dt>
          <dd className="text-ink-800">{KIND_LABEL[kind] || '-'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-400">조회기간</dt>
          <dd className="text-ink-800">
            {response.range?.from} ~ {response.range?.to}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-400">저장항목 수</dt>
          <dd className="text-ink-800">{loadSavedCount()}건 <span className="text-ink-300">(3단계 예정)</span></dd>
        </div>
      </dl>
    </div>
  );
}
