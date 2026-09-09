import { useState } from 'react';
import logo from '../../assets/logo-horizontal.png';
import { signup, loginAccount } from '../../api/client';

const ALLOWED_DOMAIN = '@lghv.net';

export default function AuthGate({ onLoggedIn }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', team: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [signupDone, setSignupDone] = useState(false);

  function update(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function switchMode(next) {
    setMode(next);
    setError(null);
    setSignupDone(false);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await loginAccount({ email: form.email, password: form.password });
      onLoggedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signup(form);
      setSignupDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-200 px-4">
      <div className="w-full max-w-sm rounded-xl border border-cream-400 bg-cream-100 p-6">
        <img src={logo} alt="NARA express" className="mx-auto mb-4 h-10 w-auto" />

        <div className="mb-4 flex rounded-lg bg-cream-200 p-1 text-sm">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 rounded-md py-1.5 font-medium ${mode === 'login' ? 'bg-cream-50 text-ink-800' : 'text-ink-400'}`}
          >
            로그인
          </button>
          <button
            onClick={() => switchMode('signup')}
            className={`flex-1 rounded-md py-1.5 font-medium ${mode === 'signup' ? 'bg-cream-50 text-ink-800' : 'text-ink-400'}`}
          >
            가입 신청
          </button>
        </div>

        {mode === 'signup' && signupDone ? (
          <div className="rounded-lg bg-sage-100 p-4 text-center text-sm text-sage-600">
            가입 신청이 접수됐습니다. 관리자 승인 후 로그인할 수 있어요.
          </div>
        ) : mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-2.5">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="회사 이메일 (예: sangil_nam@lghv.net)"
              className="w-full rounded-md border border-cream-400 px-3 py-2 text-sm"
            />
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => update({ password: e.target.value })}
              placeholder="비밀번호"
              className="w-full rounded-md border border-cream-400 px-3 py-2 text-sm"
            />
            {error && <p className="text-xs text-amber-800">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-clay-400 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? '확인 중…' : '로그인'}
            </button>
            <p className="text-center text-[11px] text-ink-300">비밀번호를 잊으셨다면 관리자에게 문의해주세요.</p>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-2.5">
            <input
              required
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="이름"
              className="w-full rounded-md border border-cream-400 px-3 py-2 text-sm"
            />
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update({ email: e.target.value })}
              placeholder={`회사 이메일 (예: sangil_nam${ALLOWED_DOMAIN})`}
              className="w-full rounded-md border border-cream-400 px-3 py-2 text-sm"
            />
            <input
              required
              value={form.team}
              onChange={(e) => update({ team: e.target.value })}
              placeholder="소속팀 (예: 수도권미디어국)"
              className="w-full rounded-md border border-cream-400 px-3 py-2 text-sm"
            />
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => update({ password: e.target.value })}
              placeholder="비밀번호 (8자 이상)"
              className="w-full rounded-md border border-cream-400 px-3 py-2 text-sm"
            />
            {error && <p className="text-xs text-amber-800">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-clay-400 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? '신청 중…' : '가입 신청'}
            </button>
            <p className="text-center text-[11px] text-ink-300">신청 후 관리자 승인이 필요합니다.</p>
          </form>
        )}
      </div>
    </div>
  );
}
