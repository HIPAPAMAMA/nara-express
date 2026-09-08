import { useState } from 'react';
import MyCompanyWorkspace from '../mycompany/MyCompanyWorkspace';
import SettingsWorkspace from '../settings/SettingsWorkspace';

const TABS = [
  { key: 'company', label: '내 업체' },
  { key: 'settings', label: '알림·설정' },
];

// 내설정 — 내 업체(MYC)와 알림·설정(SET)을 한 대메뉴로 묶음(2026-09-08 재구성).
// 둘 다 "한 번 등록·설정하고 마는" 성격이 같아서 대메뉴 3개(통합검색·대시보드·내설정) 구조로 정리.
export default function MySettingsWorkspace() {
  const [tab, setTab] = useState('company');

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex gap-2 rounded-lg border border-cream-400 bg-cream-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md py-2 text-sm font-medium ${
              tab === t.key ? 'bg-clay-400 text-white' : 'text-ink-600 hover:bg-cream-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'company' && <MyCompanyWorkspace />}
      {tab === 'settings' && <SettingsWorkspace />}
    </div>
  );
}
