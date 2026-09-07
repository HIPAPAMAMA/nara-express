import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { fetchAlerts, toggleKeywordAlert } from '../../api/client';

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

// SC-04 관심 키워드: KWD-001(등록/삭제) KWD-002(클릭 시 검색 실행) KWD-003(알림 on/off, 카카오 로그인 필요)
export default function KeywordWorkspace({ onSearchKeyword }) {
  const auth = useAuth();
  const [keywords, setKeywords] = useState(loadKeywords);
  const [input, setInput] = useState('');
  const [alertKeywords, setAlertKeywords] = useState([]); // 알림 켜진 키워드(서버 저장분)
  const [needLoginNotice, setNeedLoginNotice] = useState(false);

  useEffect(() => {
    if (auth.connected) fetchAlerts().then((res) => setAlertKeywords(res.keywords)).catch(() => setAlertKeywords([]));
    else setAlertKeywords([]);
  }, [auth.connected]);

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

  async function toggleAlert(kw) {
    if (!auth.connected) {
      setNeedLoginNotice(true);
      return;
    }
    const { on } = await toggleKeywordAlert(kw);
    setAlertKeywords((prev) => (on ? [...prev, kw.toLowerCase()] : prev.filter((k) => k !== kw.toLowerCase())));
  }

  return (
    <div className="mx-auto max-w-xl">
      <form onSubmit={addKeyword} className="mb-4 rounded-xl border border-cream-400 bg-cream-100 p-4">
        <h2 className="mb-1 text-sm font-medium text-ink-800">관심 키워드</h2>
        <p className="mb-3 text-xs text-ink-400">등록한 키워드를 클릭하면 바로 통합검색이 실행됩니다. 종 아이콘을 누르면 신규공고를 카카오톡으로 알려드려요.</p>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="키워드 입력 (사업명 기준)"
            className="min-w-0 flex-1 rounded-md border border-cream-400 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-clay-400 px-4 py-2 text-sm font-medium text-white">
            등록
          </button>
        </div>
      </form>

      {needLoginNotice && (
        <div className="mb-3 rounded-lg border border-amber-400 bg-amber-100 px-3 py-2 text-xs text-amber-800">
          알림을 받으려면 카카오 연결이 필요해요. "알림·설정" 화면에서 연결할 수 있습니다.
        </div>
      )}

      {keywords.length === 0 ? (
        <div className="rounded-xl border border-cream-400 bg-cream-100 p-8 text-center text-sm text-ink-400">
          등록된 키워드가 없습니다.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => {
            const alertOn = alertKeywords.includes(kw.toLowerCase());
            return (
              <span key={kw} className="flex items-center gap-1.5 rounded-full border border-clay-400 bg-cream-50 py-1.5 pl-3 pr-2 text-sm">
                <button onClick={() => onSearchKeyword(kw)} className="text-clay-600 hover:underline">
                  {kw}
                </button>
                <button
                  onClick={() => toggleAlert(kw)}
                  title={alertOn ? '신규공고 알림 켜짐' : '신규공고 알림 꺼짐'}
                  className={alertOn ? 'text-amber-600' : 'text-ink-300 hover:text-ink-600'}
                >
                  {alertOn ? '🔔' : '🔕'}
                </button>
                <button onClick={() => removeKeyword(kw)} className="text-ink-300 hover:text-amber-800" title="삭제">
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
