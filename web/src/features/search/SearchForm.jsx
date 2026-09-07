import { useState } from 'react';

const DATA_TYPES = [
  { value: 'award', label: '낙찰결과' },
  { value: 'bid', label: '입찰공고' },
  { value: 'prespec', label: '사전규격' },
];

const BIZ_TYPES = ['전체', '용역', '물품', '공사', '외자'];

// SRC-004: 기간 프리셋 — 9개월·2년·4년은 실사용 빈도가 낮다는 피드백으로 6종으로 축소
const PRESETS = [
  { label: '1개월', months: 1 },
  { label: '3개월', months: 3 },
  { label: '6개월', months: 6 },
  { label: '1년', months: 12 },
  { label: '3년', months: 36 },
  { label: '5년', months: 60 },
];

function pad(n) {
  return String(n).padStart(2, '0');
}
function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function SearchForm({ onSearch, loading, onCancel, initialKeyword }) {
  const today = toDateStr(new Date());
  const [dataType, setDataType] = useState('bid');
  const [keywordType, setKeywordType] = useState('title'); // SRC-002: 사업명·공고번호 / 업체명
  const [keyword, setKeyword] = useState(initialKeyword || '');
  const [from, setFrom] = useState(toDateStr(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(today);
  const [bizType, setBizType] = useState('전체'); // SRC-011
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [orderOrg, setOrderOrg] = useState(''); // SRC-013
  const [demandOrg, setDemandOrg] = useState(''); // SRC-014
  const [priceMin, setPriceMin] = useState(''); // SRC-017
  const [priceMax, setPriceMax] = useState('');
  const [mode, setMode] = useState('quick'); // SRC-005: 빠른조회/정밀조회

  function applyPreset(months) {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    setFrom(toDateStr(start));
    setTo(toDateStr(end));
  }

  function buildParams() {
    return {
      kind: dataType,
      from,
      to,
      bizType,
      keywordType,
      keyword,
      orderOrg,
      demandOrg,
      priceMin: priceMin ? Number(priceMin) : null,
      priceMax: priceMax ? Number(priceMax) : null,
      mode,
    };
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSearch(buildParams());
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-cream-400 bg-cream-100 p-4">
      {/* SRC-001 */}
      <div className="mb-4 flex gap-2">
        {DATA_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setDataType(t.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              dataType === t.value
                ? 'bg-clay-400 text-white'
                : 'border border-cream-400 text-ink-600 hover:bg-cream-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SRC-002 — 검색창이 이 폼에서 제일 중요해서 가장 크게. 이 폼은 항상 360px 고정 사이드바
          안에서만 쓰여서(모바일이든 PC든 폭이 넓어질 일이 없음) 뷰포트 기준 반응형 대신 항상 세로로 쌓는다 */}
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex rounded-lg border border-cream-400 overflow-hidden">
          <button
            type="button"
            onClick={() => setKeywordType('title')}
            className={`flex-1 whitespace-nowrap px-3 py-2 text-xs ${keywordType === 'title' ? 'bg-clay-100 text-clay-600' : 'text-ink-400'}`}
          >
            사업명·공고번호
          </button>
          <button
            type="button"
            onClick={() => setKeywordType('company')}
            className={`flex-1 whitespace-nowrap px-3 py-2 text-xs ${keywordType === 'company' ? 'bg-clay-100 text-clay-600' : 'text-ink-400'}`}
          >
            업체명
          </button>
        </div>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={keywordType === 'title' ? '사업명 또는 공고번호 검색' : '업체명 검색'}
          className="min-w-0 flex-1 rounded-lg border border-cream-400 px-4 py-3 text-lg outline-none focus:border-clay-400"
        />
      </div>

      {/* SRC-003·004 */}
      <div className="mb-4">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p.months)}
              className="rounded-md border border-cream-400 px-2.5 py-1 text-xs text-ink-600 hover:bg-cream-200"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-cream-400 px-2 py-1.5" />
          <span className="text-ink-400">~</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-cream-400 px-2 py-1.5" />
        </div>
      </div>

      {/* SRC-011 */}
      <div className="mb-4 flex gap-1.5">
        {BIZ_TYPES.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBizType(b)}
            className={`rounded-md px-3 py-1.5 text-xs ${
              bizType === b ? 'bg-clay-100 text-clay-600 font-medium' : 'border border-cream-400 text-ink-600'
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* 상세조건 (SRC-013·014·017) */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs text-ink-400 underline"
        >
          상세조건 {showAdvanced ? '접기' : '펼치기'}
        </button>
        {showAdvanced && (
          <div className="mt-2 grid grid-cols-1 gap-2 rounded-lg bg-cream-50 p-3 sm:grid-cols-2">
            <input
              value={orderOrg}
              onChange={(e) => setOrderOrg(e.target.value)}
              placeholder="발주기관"
              className="rounded-md border border-cream-400 px-2 py-1.5 text-sm"
            />
            <input
              value={demandOrg}
              onChange={(e) => setDemandOrg(e.target.value)}
              placeholder="수요기관"
              className="rounded-md border border-cream-400 px-2 py-1.5 text-sm"
            />
            <input
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="추정가격 하한(원)"
              type="number"
              className="rounded-md border border-cream-400 px-2 py-1.5 text-sm"
            />
            <input
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="추정가격 상한(원)"
              type="number"
              className="rounded-md border border-cream-400 px-2 py-1.5 text-sm"
            />
          </div>
        )}
      </div>

      {/* SRC-005 */}
      <div className="mb-3 flex overflow-hidden rounded-lg border border-cream-400 text-xs">
        <button
          type="button"
          onClick={() => setMode('quick')}
          disabled={loading}
          className={`flex-1 px-3 py-2 ${mode === 'quick' ? 'bg-clay-100 font-medium text-clay-600' : 'text-ink-400'}`}
        >
          빠른 조회
          <div className="font-normal text-[11px] text-ink-300">최근 구간만, 속도 우선</div>
        </button>
        <button
          type="button"
          onClick={() => setMode('full')}
          disabled={loading}
          className={`flex-1 border-l border-cream-400 px-3 py-2 ${mode === 'full' ? 'bg-clay-100 font-medium text-clay-600' : 'text-ink-400'}`}
        >
          정밀 조회
          <div className="font-normal text-[11px] text-ink-300">전체 기간 순회, 시간 소요</div>
        </button>
      </div>

      {/* SRC-006 / SRC-007: 로딩 중엔 같은 버튼이 조회 중단으로 바뀐다 */}
      {loading ? (
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-lg border border-amber-600 bg-amber-100 py-2.5 text-sm font-medium text-amber-800"
        >
          조회 중단
        </button>
      ) : (
        <button type="submit" className="w-full rounded-lg bg-clay-400 py-2.5 text-sm font-medium text-white">
          조회하기
        </button>
      )}
    </form>
  );
}
