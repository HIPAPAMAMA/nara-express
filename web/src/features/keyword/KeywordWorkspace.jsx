import { useState } from 'react';

const STORAGE_KEY = 'keywords';

function loadKeywords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
function saveKeywords(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// SC-04 관심 키워드: KWD-001(등록/삭제) KWD-002(클릭 시 검색 실행). KWD-003(알림 설정)은 4단계 예정.
export default function KeywordWorkspace({ onSearchKeyword }) {
  const [keywords, setKeywords] = useState(loadKeywords);
  const [input, setInput] = useState('');

  function addKeyword(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || keywords.includes(trimmed)) return;
    const next = [...keywords, trimmed];
    setKeywords(next);
    saveKeywords(next);
    setInput('');
  }

  function removeKeyword(kw) {
    const next = keywords.filter((k) => k !== kw);
    setKeywords(next);
    saveKeywords(next);
  }

  return (
    <div className="mx-auto max-w-xl">
      <form onSubmit={addKeyword} className="mb-4 rounded-xl border border-cream-400 bg-cream-100 p-4">
        <h2 className="mb-1 text-sm font-medium text-ink-800">관심 키워드</h2>
        <p className="mb-3 text-xs text-ink-400">등록한 키워드를 클릭하면 바로 통합검색이 실행됩니다.</p>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="키워드 입력 (사업명 기준)"
            className="flex-1 rounded-md border border-cream-400 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-clay-400 px-4 py-2 text-sm font-medium text-white">
            등록
          </button>
        </div>
      </form>

      {keywords.length === 0 ? (
        <div className="rounded-xl border border-cream-400 bg-cream-100 p-8 text-center text-sm text-ink-400">
          등록된 키워드가 없습니다.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <span key={kw} className="flex items-center gap-1.5 rounded-full border border-clay-400 bg-cream-50 py-1.5 pl-3 pr-2 text-sm">
              <button onClick={() => onSearchKeyword(kw)} className="text-clay-600 hover:underline">
                {kw}
              </button>
              <button onClick={() => removeKeyword(kw)} className="text-ink-300 hover:text-amber-800" title="삭제">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="mt-4 text-[11px] text-ink-300">키워드 신규공고 알림(KWD-003)은 4단계(카카오톡 연동)에서 추가됩니다.</p>
    </div>
  );
}
