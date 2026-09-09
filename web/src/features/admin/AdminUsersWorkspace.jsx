import { useEffect, useState } from 'react';
import { listPendingUsers, approveUser, rejectUser, resetUserPassword } from '../../api/client';

const STATUS_LABEL = {
  pending: { text: '승인 대기', tone: 'bg-amber-100 text-amber-800' },
  approved: { text: '승인됨', tone: 'bg-sage-100 text-sage-600' },
  rejected: { text: '거절됨', tone: 'bg-cream-200 text-ink-400' },
};

export default function AdminUsersWorkspace() {
  const [users, setUsers] = useState(null);
  const [busyEmail, setBusyEmail] = useState(null);
  const [issuedPasswords, setIssuedPasswords] = useState({}); // email -> 방금 발급한 임시 비밀번호(한 번만 표시)

  function load() {
    listPendingUsers().then((res) => setUsers(res.users));
  }

  useEffect(load, []);

  async function handleDecide(email, status) {
    setBusyEmail(email);
    try {
      if (status === 'approved') await approveUser(email);
      else await rejectUser(email);
      load();
    } finally {
      setBusyEmail(null);
    }
  }

  // 비밀번호를 잊은 사용자 — 메일 발송 없이 임시 비밀번호를 발급해 관리자가 직접 전달한다
  async function handleResetPassword(email) {
    setBusyEmail(email);
    try {
      const { newPassword } = await resetUserPassword(email);
      setIssuedPasswords((prev) => ({ ...prev, [email]: newPassword }));
    } finally {
      setBusyEmail(null);
    }
  }

  if (!users) {
    return <div className="rounded-xl border border-cream-400 bg-cream-100 p-8 text-center text-sm text-ink-400">불러오는 중…</div>;
  }

  const pending = users.filter((u) => u.status === 'pending');
  const decided = users.filter((u) => u.status !== 'pending');

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-xl border border-cream-400 bg-cream-100 p-4">
        <h2 className="mb-2 text-sm font-medium text-ink-800">
          가입 승인 대기 <span className="text-ink-400">({pending.length}건)</span>
        </h2>
        {pending.length === 0 ? (
          <p className="text-xs text-ink-300">대기 중인 가입 신청이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-cream-400">
            {pending.map((u) => (
              <li key={u.email} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink-800">
                    {u.name} <span className="font-normal text-ink-400">· {u.team}</span>
                  </div>
                  <div className="truncate text-[12px] text-ink-400">{u.email}</div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => handleDecide(u.email, 'rejected')}
                    disabled={busyEmail === u.email}
                    className="rounded-md border border-cream-400 px-2.5 py-1.5 text-xs text-ink-600 disabled:opacity-50"
                  >
                    거절
                  </button>
                  <button
                    onClick={() => handleDecide(u.email, 'approved')}
                    disabled={busyEmail === u.email}
                    className="rounded-md bg-clay-400 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    승인
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-cream-400 bg-cream-100 p-4">
        <h2 className="mb-2 text-sm font-medium text-ink-800">
          전체 회원 <span className="text-ink-400">({decided.length}건)</span>
        </h2>
        {decided.length === 0 ? (
          <p className="text-xs text-ink-300">처리된 회원이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-cream-400">
            {decided.map((u) => (
              <li key={u.email} className="py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-ink-800">
                      {u.name} <span className="text-ink-400">· {u.team}</span>
                    </div>
                    <div className="truncate text-[12px] text-ink-400">{u.email}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${STATUS_LABEL[u.status]?.tone}`}>
                      {STATUS_LABEL[u.status]?.text}
                    </span>
                    {u.status === 'approved' && (
                      <button
                        onClick={() => handleResetPassword(u.email)}
                        disabled={busyEmail === u.email}
                        className="rounded-md border border-cream-400 px-2 py-1 text-[11px] text-ink-600 disabled:opacity-50"
                      >
                        비밀번호 재설정
                      </button>
                    )}
                  </div>
                </div>
                {issuedPasswords[u.email] && (
                  <p className="mt-1.5 rounded-md bg-sage-100 px-2.5 py-1.5 text-[12px] text-sage-600">
                    임시 비밀번호: <span className="font-mono font-medium">{issuedPasswords[u.email]}</span>
                    {' — '}본인에게 직접 전달해주세요. (이 화면을 벗어나면 다시 볼 수 없습니다)
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
