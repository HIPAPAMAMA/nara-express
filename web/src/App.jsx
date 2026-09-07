import { useEffect, useState } from 'react';
import logo from './assets/logo-horizontal.png';
import SearchWorkspace from './features/search/SearchWorkspace';
import DetailPanel from './features/detail/DetailPanel';
import CompetitorWorkspace from './features/competitor/CompetitorWorkspace';
import MyCompanyWorkspace from './features/mycompany/MyCompanyWorkspace';
import MallWorkspace from './features/mall/MallWorkspace';
import KeywordWorkspace from './features/keyword/KeywordWorkspace';
import SavedWorkspace from './features/saved/SavedWorkspace';
import SettingsWorkspace from './features/settings/SettingsWorkspace';
import MobileBottomNav from './components/MobileBottomNav';
import MobileMoreSheet from './components/MobileMoreSheet';
import { checkHealth } from './api/client';
import { AuthProvider } from './lib/authContext';

// 자주 쓰는 화면(검색·키워드·경쟁사·쇼핑몰·저장내역)을 앞에, 한 번 설정하고 마는 화면
// (내 업체·알림·설정)과 아직 미구현인 평가분석은 뒤로 — 모바일 더보기 시트 우선순위와 맞춤
const NAV_TABS = [
  { key: 'search', label: '통합검색' },
  { key: 'keyword', label: '관심 키워드' },
  { key: 'competitor', label: '경쟁사' },
  { key: 'mall', label: '쇼핑몰 상품검색' },
  { key: 'saved', label: '저장내역' },
  { key: 'company', label: '내 업체' },
  { key: 'settings', label: '알림·설정' },
  { key: 'evaluation', label: '평가분석' },
];

// 모바일 하단 탭엔 5자리뿐이라 나머지는 '더보기' 시트로 — 탭 하이라이트도 그쪽으로 맞춘다
const MOBILE_KEY_MAP = {
  search: 'search',
  competitor: 'competitor',
  keyword: 'keyword',
  saved: 'saved',
  company: 'more',
  mall: 'more',
  settings: 'more',
  evaluation: 'more',
};

function Placeholder({ label }) {
  return (
    <div className="rounded-xl border border-cream-400 bg-cream-100 p-10 text-center text-sm text-ink-400">
      {label} 화면은 준비 중입니다 (기획서 8장 단계별 개발 범위 참고).
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const [health, setHealth] = useState('checking');
  const [view, setView] = useState('search');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchPrefill, setSearchPrefill] = useState(null); // KWD-002: 키워드 클릭 → 검색 실행
  const [moreOpen, setMoreOpen] = useState(false);

  function handleMobileNavSelect(key) {
    if (key === 'more') setMoreOpen(true);
    else setView(key);
  }

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
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-2.5">
          <img src={logo} alt="NARA express" className="h-14 w-auto" />
          <span
            title="공공데이터포털 나라장터 낙찰정보서비스(getScsbidListSttusServc) 연결 상태"
            className={`flex items-center gap-1.5 text-xs ${health === 'ok' ? 'text-sage-600' : 'text-amber-600'}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${health === 'ok' ? 'bg-sage-600' : 'bg-amber-600'}`} />
            {health === 'checking' ? 'API 확인 중' : health === 'ok' ? 'API 정상' : 'API 응답 지연'}
          </span>
        </div>
        <nav className="mx-auto hidden max-w-[1600px] gap-1 overflow-x-auto px-4 pb-2 text-xs md:flex">
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

      <main className="mx-auto max-w-[1600px] px-4 py-6">
        {view === 'search' && <SearchWorkspace onOpenDetail={setSelectedItem} prefill={searchPrefill} />}
        {view === 'competitor' && <CompetitorWorkspace onOpenDetail={setSelectedItem} />}
        {view === 'company' && <MyCompanyWorkspace />}
        {view === 'mall' && <MallWorkspace />}
        {view === 'keyword' && <KeywordWorkspace onSearchKeyword={handleSearchKeyword} />}
        {view === 'saved' && <SavedWorkspace onOpenDetail={setSelectedItem} />}
        {view === 'evaluation' && <Placeholder label="평가분석 (5단계, 보류)" />}
        {view === 'settings' && <SettingsWorkspace />}
      </main>

      {selectedItem && <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />}

      <MobileBottomNav active={MOBILE_KEY_MAP[view] || 'search'} onSelect={handleMobileNavSelect} />
      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} onSelect={setView} />
    </div>
  );
}
