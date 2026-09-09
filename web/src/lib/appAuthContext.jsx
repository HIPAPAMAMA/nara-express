import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getAppMe, logoutAccount } from '../api/client';

const AppAuthContext = createContext(null);

// 앱 전체 접근 게이트용 로그인 상태 — 카카오 알림 연결(authContext.jsx)과는 별개의 계정 시스템.
export function AppAuthProvider({ children }) {
  const [auth, setAuth] = useState({ status: 'checking', loggedIn: false, name: null, email: null, team: null, isAdmin: false });

  const refresh = useCallback(() => {
    getAppMe()
      .then((res) =>
        setAuth({
          status: 'ready',
          loggedIn: res.loggedIn,
          name: res.name || null,
          email: res.email || null,
          team: res.team || null,
          isAdmin: Boolean(res.isAdmin),
        })
      )
      .catch(() => setAuth({ status: 'ready', loggedIn: false, name: null, email: null, team: null, isAdmin: false }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function logout() {
    await logoutAccount();
    refresh();
  }

  return <AppAuthContext.Provider value={{ ...auth, refresh, logout }}>{children}</AppAuthContext.Provider>;
}

export function useAppAuth() {
  const ctx = useContext(AppAuthContext);
  if (!ctx) throw new Error('useAppAuth는 AppAuthProvider 안에서만 쓸 수 있습니다.');
  return ctx;
}
