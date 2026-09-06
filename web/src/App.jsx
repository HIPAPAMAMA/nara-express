import { useEffect, useState } from 'react';
import logo from './assets/logo-horizontal.png';
import SearchWorkspace from './features/search/SearchWorkspace';
import DetailPanel from './features/detail/DetailPanel';
import CompetitorWorkspace from './features/competitor/CompetitorWorkspace';
import MyCompanyWorkspace from './features/mycompany/MyCompanyWorkspace';
import MallWorkspace from './features/mall/MallWorkspace';
import KeywordWorkspace from './features/keyword/KeywordWorkspace';
import SavedWorkspace from './features/saved/SavedWorkspace';
import MobileBottomNav from './components/MobileBottomNav';
import { checkHealth } from './api/client';

const NAV_TABS = [
  { key: 'search', label: '통합검색' },
  { key: 'evaluation', label: '평가분석' },
  { key: 'company', label: '내 업체' },
  { key: 'keyword', label: '관심 키워드' },
  { key: 'competitor', label: '경쟁사' },
  { key: 'mall', label: '쇼핑몰 상품검색' },
  { key: 'saved', label: '저장내역' },
  { key: 'settings', label: '알림·설정' },
];

const MOBILE_KEY_MAP = { search: 'search', competitor: 'competitor', keyword: 'keyword', saved: 'saved', settings: 'settings' };

function Placeholder({ label }) {
  return (
    <div className="rounded-xl border border-cream-400 bg-cream-100 p-10 text-center text-sm text-ink-400">
      {label} 화면은 준비 중입니다 (기획서 8장 단계별 개발 범위 참고).
    </div>
  );
}

export default function App() {
  const [health, setHealth] = useState('checking');
  const [view, setView] = useState('search');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchPrefill, setSearchPrefill] = useState(null); // KWD-002: 키워드 클릭 → 검색 실행

  function handleSearchKeyword(keyword) {
    setSearchPrefill({ keyword, requestedAt: Date.now() });
    setView('search');
  }

  useEffect(() => {
    checkHealth()
      .then(() => setHealth('ok'))
      .catch(() => setHealth('down'));
  }, []);

  return (
    <div className="min-h-screen bg-cream-200 pb-14 md:pb-0">
      <header className="border-b border-cream-400 bg-cream-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
          <img src={logo} alt="NARA express" className="h-7 w-auto" />
          <span className={`flex items-center gap-1.5 text-xs ${health === 'ok' ? 'text-sage-600' : 'text-amber-600'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${health === 'ok' ? 'bg-sage-600' : 'bg-amber-600'}`} />
            {health === 'checking' ? 'API 확인 중' : health === 'ok' ? 'API 정상' : 'API 응답 지연'}
          </span>
        </div>
        <nav className="mx-auto hidden max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-xs md:flex">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`shrink-0 rounded-full px-3 py-1 ${
                view === tab.key ? 'bg-clay-100 font-medium text-clay-600' : 'text-ink-300 hover:text-ink-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {view === 'search' && <SearchWorkspace onOpenDetail={setSelectedItem} prefill={searchPrefill} />}
        {view === 'competitor' && <CompetitorWorkspace onOpenDetail={setSelectedItem} />}
        {view === 'company' && <MyCompanyWorkspace />}
        {view === 'mall' && <MallWorkspace />}
        {view === 'keyword' && <KeywordWorkspace onSearchKeyword={handleSearchKeyword} />}
        {view === 'saved' && <SavedWorkspace onOpenDetail={setSelectedItem} />}
        {view === 'evaluation' && <Placeholder label="평가분석 (5단계, 보류)" />}
        {view === 'settings' && <Placeholder label="알림·설정" />}
      </main>

      {selectedItem && <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />}

      <MobileBottomNav active={MOBILE_KEY_MAP[view] || 'search'} onSelect={setView} />
    </div>
  );
}
