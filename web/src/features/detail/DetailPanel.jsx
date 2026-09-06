import { useMemo, useState } from 'react';
import { formatAmount, formatDateTime } from '../../lib/format';
import { checkRestriction } from '../../api/client';
import { assessEligibility } from '../../lib/eligibility';

const STATUS_LABEL = {
  restricted: { label: '제한있음', tone: 'bg-amber-100 text-amber-800' },
  clear: { label: '제한없음', tone: 'bg-sage-100 text-sage-600' },
  needs_review: { label: '확인필요', tone: 'bg-ink-100 text-ink-600' },
};

const FIT_LABEL = {
  has_restriction: { label: '제한 있음', tone: 'bg-amber-100 text-amber-800' },
  no_restriction: { label: '제한 없어 보임', tone: 'bg-sage-100 text-sage-600' },
  unknown: { label: '정보 없음', tone: 'bg-ink-100 text-ink-400' },
  no_profile: { label: '내 업체 미등록', tone: 'bg-ink-100 text-ink-400' },
};

export default function DetailPanel({ item, onClose }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const fitness = useMemo(() => assessEligibility(item, result), [item, result]);

  async function runCheck() {
    setChecking(true);
    setResult(null);
    try {
      const r = await checkRestriction(item.attachments);
      setResult(r);
    } catch (e) {
      setResult({ status: 'needs_review', note: e.message });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-800/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-cream-50 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-base font-medium text-ink-800">{item.title}</h2>
          <button onClick={onClose} className="shrink-0 text-ink-400">
            ✕
          </button>
        </div>

        {/* DTL-001 입찰진행정보 */}
        <div className="mb-4 grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-cream-100 p-3 text-xs">
          <div className="text-ink-400">공고일</div>
          <div className="text-ink-800">{formatDateTime(item.postedAt)}</div>
          <div className="text-ink-400">제안서마감</div>
          <div className="text-ink-800">{formatDateTime(item.proposalDeadline)}</div>
          <div className="text-ink-400">입찰마감</div>
          <div className="text-ink-800">{formatDateTime(item.bidDeadline)}</div>
          <div className="text-ink-400">개찰일</div>
          <div className="text-ink-800">{formatDateTime(item.openingAt)}</div>
          <div className="text-ink-400">추정가격</div>
          <div className="tabular-nums text-ink-800">{formatAmount(item.estimatedPrice)}</div>
        </div>

        {/* MYC-007 공고 적합도 판정 */}
        <div className="mb-4 rounded-lg border border-cream-400 p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-ink-600">공고 적합도 (참고용)</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${FIT_LABEL[fitness.status].tone}`}>
              {FIT_LABEL[fitness.status].label}
            </span>
          </div>
          {fitness.reasons.length > 0 && (
            <ul className="list-inside list-disc space-y-0.5 text-[11px] text-ink-600">
              {fitness.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
          <p className="mt-1 text-[11px] text-ink-300">구조화된 필드 기반 참고 정보입니다. 최종 확인은 원문에서 하세요.</p>
        </div>

        {/* DTL-009·010 대기업 참여제한 확인 */}
        <div className="mb-4 rounded-lg border border-cream-400 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-ink-600">대기업 참여제한 확인</span>
            {result && (
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_LABEL[result.status]?.tone}`}>
                {STATUS_LABEL[result.status]?.label}
              </span>
            )}
          </div>
          {!result && (
            <button
              onClick={runCheck}
              disabled={checking || item.attachments.length === 0}
              className="rounded-md bg-clay-400 px-3 py-1.5 text-xs text-white disabled:opacity-50"
            >
              {checking ? '확인 중… (파일 다운로드·분석)' : '확인하기'}
            </button>
          )}
          {result && (
            <div className="text-[11px] text-ink-600">
              {result.excerpt && <p className="mb-1 rounded bg-amber-50 p-1.5 italic">"…{result.excerpt}…" ({result.matchedFile})</p>}
              {result.note && <p className="text-ink-400">{result.note}</p>}
              <p className="mt-1 text-ink-300">최종 확인은 반드시 원문에서 하세요. 키워드 매칭 기준이라 완벽하지 않습니다.</p>
            </div>
          )}
          {item.attachments.length === 0 && !result && <p className="mt-1 text-[11px] text-ink-300">첨부파일이 없습니다.</p>}
        </div>

        {/* DTL-003 첨부파일 목록 */}
        <div className="mb-4">
          <div className="mb-1.5 text-xs font-medium text-ink-600">첨부파일 ({item.attachments.length})</div>
          <ul className="space-y-1">
            {item.attachments.map((a, i) => (
              <li key={i}>
                <a href={a.url} target="_blank" rel="noreferrer" className="text-xs text-clay-600 underline">
                  {a.name}
                </a>
              </li>
            ))}
            {item.attachments.length === 0 && <li className="text-xs text-ink-300">공개된 첨부파일이 없습니다.</li>}
          </ul>
        </div>

        {/* DTL-006 액션 4종 */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => navigator.clipboard?.writeText(item.bidNo)}
            className="rounded-md border border-cream-400 px-2.5 py-1.5 text-ink-600"
          >
            공고번호 복사
          </button>
          {item.sourceUrl && (
            <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="rounded-md border border-cream-400 px-2.5 py-1.5 text-ink-600">
              나라장터 원문 열기
            </a>
          )}
          <span className="rounded-md border border-cream-400 px-2.5 py-1.5 text-ink-300" title="3단계 예정">
            낙찰결과 조회
          </span>
          <span className="rounded-md border border-cream-400 px-2.5 py-1.5 text-ink-300" title="3단계 예정">
            제안·규격서 저장
          </span>
        </div>
      </div>
    </div>
  );
}
