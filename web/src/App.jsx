import { useEffect, useState } from 'react';
import logo from './assets/logo-horizontal.png';
import DashboardWorkspace from './features/dashboard/DashboardWorkspace';
import SearchWorkspace from './features/search/SearchWorkspace';
import DetailPanel from './features/detail/DetailPanel';
import CompetitorWorkspace from './features/competitor/CompetitorWorkspace';
import MallWorkspace from './features/mall/MallWorkspace';
import KeywordWorkspace from './features/keyword/KeywordWorkspace';
import SavedWorkspace from './features/saved/SavedWorkspace';
import MySettingsWorkspace from './features/mysettings/MySettingsWorkspace';
import MobileBottomNav from './components/MobileBottomNav';
import { checkHealth } from './api/client';
import { AuthProvider } from './lib/authContext';

// 대메뉴는 3개로만 유지 — 통합검색(기본화면)·대시보드(키워드·경쟁사·쇼핑몰·저장내역·평가분석을
// 메뉴 카드로 모음)·내설정(내 업체+알림·설정을 한 화면에 묶음). 나머지 화면은 대시보드의
// 메뉴 카드를 통해서만 진입 — 상단 nav에는 안 보이지만 view 키 자체는 그대로 살아있다.
const NAV_TABS = [
  { key: 'search', label: '통합검색' },
  { key: 'dashboard', label: '대시보드' },
  { key: 'mysettings', label: '내설정' },
];

// 대시보드 메뉴 카드로 진입한 화면(키워드·경쟁사 등)에 있을 때도 상단·하단 nav는 "대시보드"를
// 활성 표시해야 자기가 어느 대메뉴 아래에 있는지 알 수 있다 — PC 상단 nav와 모바일 하단 탭 공용
const TAB_GROUP_MAP = {
  search: 'search',
  dashboard: 'dashboard',
  keyword: 'dashboard',
  competitor: 'dashboard',
  mall: 'dashboard',
  saved: 'dashboard',
  evaluation: 'dashboard',
  mysettings: 'mysettings',
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
  const activeGroup = TAB_GROUP_MAP[view] || 'search';

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
                activeGroup === tab.key ? 'bg-clay-100 font-medium text-clay-600' : 'text-ink-300 hover:text-ink-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6">
        {view === 'search' && <SearchWorkspace onOpenDetail={setSelectedItem} prefill={searchPrefill} />}
        {view === 'dashboard' && <DashboardWorkspace onOpenDetail={setSelectedItem} onNavigate={setView} />}
        {view === 'mysettings' && <MySettingsWorkspace />}
        {view === 'competitor' && <CompetitorWorkspace onOpenDetail={setSelectedItem} />}
        {view === 'mall' && <MallWorkspace />}
        {view === 'keyword' && <KeywordWorkspace onSearchKeyword={handleSearchKeyword} />}
        {view === 'saved' && <SavedWorkspace onOpenDetail={setSelectedItem} />}
        {view === 'evaluation' && <Placeholder label="평가분석 (5단계, 보류)" />}
      </main>

      {selectedItem && <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />}

      <MobileBottomNav active={activeGroup} onSelect={setView} />
    </div>
  );
}
