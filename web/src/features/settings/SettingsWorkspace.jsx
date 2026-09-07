import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { fetchAlerts, setNotifyEnabled, disconnectKakao, logoutKakao, toggleTrackedBid, setCloudKeywords, setCloudSavedItems } from '../../api/client';

// 로컬(localStorage)에 쌓이는 데이터 전부 — SET-003 초기화 대상 (새 화면 생기면 여기도 추가할 것)
const LOCAL_DATA_KEYS = ['myCompany', 'savedItems', 'keywords', 'competitors', 'recentQueries'];

// SC-07 알림·설정: SET-001(수신 on/off)·SET-002(낙찰 알림 목록)·SET-003(데이터 초기화)·SET-004(카카오 연결)
export default function SettingsWorkspace() {
  const auth = useAuth();
  const [alerts, setAlerts] = useState(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (auth.connected) fetchAlerts().then(setAlerts).catch(() => setAlerts(null));
    else setAlerts(null);
  }, [auth.connected]);

  async function handleToggleNotify() {
    setBusy(true);
    try {
      await setNotifyEnabled(!auth.notifyEnabled);
      auth.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setBusy(true);
    try {
      await disconnectKakao();
      await logoutKakao();
      setConfirmDisconnect(false);
      auth.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveTracked(bidNo) {
    await toggleTrackedBid(bidNo);
    fetchAlerts().then(setAlerts);
  }

  // SET-003: 로컬 저장분 전체 삭제 — 연결돼 있으면 서버(기기 간 이어보기용) 사본도 같이 비워야
  // 다음 로그인 시 병합되면서 되살아나지 않는다. 알림 구독(관심 키워드 알림 on/off 등)은 별개라
  // 여기서 안 건드림 — 그건 "카카오 연결 해제"의 역할.
  async function handleResetData() {
    setBusy(true);
    try {
      for (const key of LOCAL_DATA_KEYS) localStorage.removeItem(key);
      if (auth.connected) {
        await Promise.all([setCloudKeywords([]), setCloudSavedItems([])]);
      }
      setConfirmReset(false);
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  if (auth.status === 'checking') {
    return <div className="rounded-xl border border-cream-400 bg-cream-100 p-8 text-center text-sm text-ink-400">확인 중…</div>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="rounded-xl border border-cream-400 bg-cream-100 p-4">
        <h2 className="mb-1 text-sm font-medium text-ink-800">알림·설정</h2>
        <p className="mb-4 text-xs text-ink-400">
          관심 키워드 신규공고, 추적 중인 공고의 낙찰 발표를 카카오톡 "나에게 보내기"로 알려드립니다. 하루 한 번 확인해서 보내드려요.
        </p>

        {!auth.connected ? (
          <a
            href="/api/auth/kakao/login"
            className="block w-full rounded-lg bg-[#FEE500] py-2.5 text-center text-sm font-medium text-[#191919]"
          >
            카카오 로그인으로 알림 연결
          </a>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between rounded-lg bg-cream-50 px-3 py-2 text-sm">
              <span className="text-ink-800">{auth.nickname}님 연결됨</span>
              <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[11px] font-medium text-sage-600">연결됨</span>
            </div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-ink-600">알림 전체 수신</span>
              <button
                onClick={handleToggleNotify}
                disabled={busy}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  auth.notifyEnabled ? 'bg-clay-400 text-white' : 'border border-cream-400 text-ink-400'
                }`}
              >
                {auth.notifyEnabled ? '켜짐' : '꺼짐'}
              </button>
            </div>
            {confirmDisconnect ? (
              <button
                onClick={handleDisconnect}
                disabled={busy}
                className="w-full rounded-lg border border-amber-600 bg-amber-100 py-2 text-xs font-medium text-amber-800"
              >
                정말 연결 해제할까요? (구독 전부 삭제됨)
              </button>
            ) : (
              <button
                onClick={() => setConfirmDisconnect(true)}
                className="w-full rounded-lg border border-cream-400 py-2 text-xs text-ink-600"
              >
                카카오 연결 해제
              </button>
            )}
          </div>
        )}
      </div>

      {auth.connected && (
        <div className="rounded-xl border border-cream-400 bg-cream-100 p-4">
          <h3 className="mb-2 text-sm font-medium text-ink-800">
            관심 키워드 알림 <span className="text-ink-400">({alerts?.keywords.length ?? 0}개)</span>
          </h3>
          {!alerts || alerts.keywords.length === 0 ? (
            <p className="text-[12px] text-ink-300">관심 키워드 화면에서 벨 아이콘을 눌러 알림을 켤 수 있습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {alerts.keywords.map((kw) => (
                <span key={kw} className="rounded-full bg-cream-200 px-2.5 py-1 text-xs text-ink-600">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {auth.connected && (
        <div className="rounded-xl border border-cream-400 bg-cream-100 p-4">
          <h3 className="mb-2 text-sm font-medium text-ink-800">
            낙찰 알림 등록 목록 <span className="text-ink-400">({alerts?.trackedBids.length ?? 0}건)</span>
          </h3>
          {!alerts || alerts.trackedBids.length === 0 ? (
            <p className="text-[12px] text-ink-300">공고 상세에서 "낙찰 알림 등록"을 누르면 여기 쌓입니다.</p>
          ) : (
            <ul className="space-y-1">
              {alerts.trackedBids.map((bidNo) => (
                <li key={bidNo} className="flex items-center justify-between rounded bg-cream-200 px-2.5 py-1.5 text-xs text-ink-600">
                  {bidNo}
                  <button onClick={() => handleRemoveTracked(bidNo)} className="text-ink-300 hover:text-amber-800">
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-xl border border-cream-400 bg-cream-100 p-4">
        <h3 className="mb-1 text-sm font-medium text-ink-800">데이터 초기화</h3>
        <p className="mb-3 text-xs text-ink-400">
          내 업체 정보·관심 키워드·경쟁사 목록·저장내역·최근 검색조건을 이 기기에서 전부 지웁니다
          {auth.connected && ' (카카오로 동기화된 키워드·저장내역도 함께 비워집니다)'}. 카카오 연결 자체는 그대로 유지돼요.
        </p>
        {confirmReset ? (
          <button
            onClick={handleResetData}
            disabled={busy}
            className="w-full rounded-lg border border-amber-600 bg-amber-100 py-2 text-xs font-medium text-amber-800"
          >
            정말 초기화할까요? (되돌릴 수 없음)
          </button>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full rounded-lg border border-cream-400 py-2 text-xs text-ink-600"
          >
            데이터 초기화
          </button>
        )}
      </div>
    </div>
  );
}
