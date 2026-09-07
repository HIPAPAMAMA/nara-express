import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMe } from '../api/client';

const AuthContext = createContext(null);

// SET-004: 카카오 로그인 상태를 어디서든 확인할 수 있게 — App.jsx의 checkHealth() useEffect와 같은 패턴
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ status: 'checking', connected: false, nickname: null, notifyEnabled: true });

  const refresh = useCallback(() => {
    getMe()
      .then((res) =>
        setAuth({
          status: 'ready',
          connected: res.connected,
          nickname: res.nickname || null,
          notifyEnabled: res.notifyEnabled !== false,
        })
      )
      .catch(() => setAuth({ status: 'ready', connected: false, nickname: null, notifyEnabled: true }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <AuthContext.Provider value={{ ...auth, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있습니다.');
  return ctx;
}
