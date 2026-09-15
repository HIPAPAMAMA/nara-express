import { useEffect, useState } from 'react';
import logo from './assets/logo-horizontal.png';
import DashboardWorkspace from './features/dashboard/DashboardWorkspace';
import SearchWorkspace from './features/search/SearchWorkspace';
import DetailPanel from './features/detail/DetailPanel';
import CompetitorWorkspace from './features/competitor/CompetitorWorkspace';
import MyCompanyWorkspace from './features/mycompany/MyCompanyWorkspace';
import MallWorkspace from './features/mall/MallWorkspace';
import KeywordWorkspace from './features/keyword/KeywordWorkspace';
import SavedWorkspace from './features/saved/SavedWorkspace';
import SettingsWorkspace from './features/settings/SettingsWorkspace';
import MobileBottomNav from './components/MobileBottomNav';
import { checkHealth } from './api/client';
import { AuthProvider } from './lib/authContext';

// 대메뉴는 3개(통합검색·대시보드·내설정)뿐이지만, 대시보드·내설정 밑에는 실제 화면이 여러 개
// 묶여 있어서 카드로 숨겨두면 잘 안 보인다는 피드백으로 "소분류 탭"을 항상 노출하는 2단 구조로
// 바꿨다(2026-09-08) — 대메뉴 밑에 소분류 탭 줄이 하나 더 뜨는 방식, PC·모바일 공통.
const NAV_TABS = [
  { group: 'search', defaultView: 'search', label: '통합검색' },
  { group: 'dashboard', defaultView: 'dashboard', label: '대시보드' },
  { group: 'mysettings', defaultView: 'company', label: '내설정' },
];

// 대메뉴 그룹 판정 — 소분류 화면(키워드·경쟁사 등)에 있을 때도 상단 대메뉴·하단 탭이 어느 그룹
// 소속인지 표시해야 한다
const TAB_GROUP_MAP = {
  search: 'search',
  dashboard: 'dashboard',
  keyword: 'dashboard',
  competitor: 'dashboard',
  mall: 'dashboard',
  saved: 'dashboard',
  evaluation: 'dashboard',
  company: 'mysettings',
  settings: 'mysettings',
};

// 대메뉴별 소분류 탭 — 대시보드·내설정을 누르면 이 줄이 추가로 뜬다
const SUB_NAV = {
  dashboard: [
    { key: 'dashboard', label: '요약' },
    { key: 'keyword', label: '관심 키워드' },
    { key: 'competitor', label: '경쟁사' },
    { key: 'mall', label: '쇼핑몰 상품검색' },
    { key: 'saved', label: '저장내역' },
    { key: 'evaluation', label: '평가분석' },
  ],
  mysettings: [
    { key: 'company', label: '내 업체' },
    { key: 'settings', label: '알림·설정' },
  ],
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
              key={tab.group}
              onClick={() => setView(tab.defaultView)}
              className={`shrink-0 rounded-full px-3 py-1 font-medium ${
                activeGroup === tab.group ? 'bg-clay-400 text-white' : 'text-ink-400 hover:bg-cream-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        {SUB_NAV[activeGroup] && (
          <nav className="mx-auto flex max-w-[1600px] gap-1 overflow-x-auto px-4 pb-2 text-xs">
            {SUB_NAV[activeGroup].map((item) => (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={`shrink-0 rounded-full px-3 py-1 ${
                  view === item.key ? 'bg-clay-100 font-medium text-clay-600' : 'text-ink-300 hover:text-ink-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6">
        {view === 'search' && <SearchWorkspace onOpenDetail={setSelectedItem} prefill={searchPrefill} />}
        {view === 'dashboard' && <DashboardWorkspace onOpenDetail={setSelectedItem} onNavigate={setView} onSearchBid={handleSearchKeyword} />}
        {view === 'company' && <MyCompanyWorkspace />}
        {view === 'settings' && <SettingsWorkspace />}
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
