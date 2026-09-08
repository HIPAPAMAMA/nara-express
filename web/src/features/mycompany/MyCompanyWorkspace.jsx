import { useState } from 'react';
import { fetchCompanyByBizno } from '../../api/client';

const STORAGE_KEY = 'myCompany';
const ENTRPRS_DIVS = ['대기업', '중견기업', '중소기업', '소기업', '소상공인'];
const INTEREST_TAGS = ['정보시스템 유지관리', '정보시스템 구축', '정보연계', '시스템 통합', '클라우드', '보안', '데이터', '컨설팅', '감리'];

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || defaultProfile();
  } catch {
    return defaultProfile();
  }
}
function defaultProfile() {
  return {
    bizNo: '',
    corpNm: '',
    hqRegion: '',
    entrprsDiv: '',
    mainIndustry: '',
    qualifications: [],
    performances: [],
    interestTags: [],
  };
}
function saveProfile(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

// MYC-006: 완성도 — 핵심 필드 채움 비율
function completeness(p) {
  const fields = [p.corpNm, p.hqRegion, p.entrprsDiv, p.mainIndustry];
  const filled = fields.filter(Boolean).length + (p.qualifications.length > 0 ? 1 : 0);
  return Math.round((filled / (fields.length + 1)) * 100);
}

export default function MyCompanyWorkspace() {
  const [profile, setProfile] = useState(loadProfile);
  const [biznoInput, setBiznoInput] = useState('');
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFillError, setAutoFillError] = useState(null);
  const [qualInput, setQualInput] = useState('');
  const [perfInput, setPerfInput] = useState('');
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  function update(patch) {
    setProfile((p) => ({ ...p, ...patch }));
    setDirty(true);
  }

  function handleSave() {
    saveProfile(profile);
    setDirty(false);
    setSavedAt(new Date());
  }

  // MYC-001
  async function handleAutoFill() {
    if (!biznoInput) return;
    setAutoFilling(true);
    setAutoFillError(null);
    try {
      const info = await fetchCompanyByBizno(biznoInput);
      update({ bizNo: info.bizNo, corpNm: info.corpNm, hqRegion: info.hqRegion || '' });
    } catch (e) {
      setAutoFillError(e.message);
    } finally {
      setAutoFilling(false);
    }
  }

  function addQualification() {
    if (!qualInput.trim()) return;
    update({ qualifications: [...profile.qualifications, qualInput.trim()] });
    setQualInput('');
  }
  function removeQualification(i) {
    update({ qualifications: profile.qualifications.filter((_, idx) => idx !== i) });
  }
  function addPerformance() {
    if (!perfInput.trim()) return;
    update({ performances: [...profile.performances, perfInput.trim()] });
    setPerfInput('');
  }
  function removePerformance(i) {
    update({ performances: profile.performances.filter((_, idx) => idx !== i) });
  }
  function toggleTag(tag) {
    const has = profile.interestTags.includes(tag);
    update({ interestTags: has ? profile.interestTags.filter((t) => t !== tag) : [...profile.interestTags, tag] });
  }

  return (
    <div className="mx-auto max-w-2xl lg:max-w-4xl">
      <div className="rounded-xl border border-cream-400 bg-cream-100 p-5">
        <h2 className="mb-1 text-base font-medium text-ink-800">내 업체</h2>
        <p className="mb-4 text-xs text-ink-400">등록한 업체정보로 공고 적합도를 판정합니다. 입력을 마치면 아래 저장하기 버튼을 눌러주세요.</p>

        {/* MYC-001 */}
        <div className="mb-4 flex gap-2">
          <input
            value={biznoInput}
            onChange={(e) => setBiznoInput(e.target.value)}
            placeholder="사업자등록번호 (숫자만)"
            className="min-w-0 flex-1 rounded-md border border-cream-400 px-3 py-2 text-sm"
          />
          <button
            onClick={handleAutoFill}
            disabled={autoFilling}
            className="rounded-md bg-clay-400 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {autoFilling ? '조회 중…' : '내 업체 정보 자동 입력'}
          </button>
        </div>
        {autoFillError && <p className="mb-4 text-xs text-amber-800">{autoFillError}</p>}

        <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-2">
        <div>
        {/* MYC-006 완성도 */}
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-ink-400">
            <span>업체정보 완성도</span>
            <span>{completeness(profile)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-cream-400">
            <div className="h-full bg-clay-400" style={{ width: `${completeness(profile)}%` }} />
          </div>
        </div>

        {/* MYC-002 */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <label className="col-span-2 text-xs text-ink-400">
            업체명
            <input
              value={profile.corpNm}
              onChange={(e) => update({ corpNm: e.target.value })}
              className="mt-0.5 w-full rounded-md border border-cream-400 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-ink-400">
            사업자등록번호
            <input
              value={profile.bizNo}
              onChange={(e) => update({ bizNo: e.target.value })}
              className="mt-0.5 w-full rounded-md border border-cream-400 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-ink-400">
            본점 소재지
            <input
              value={profile.hqRegion}
              onChange={(e) => update({ hqRegion: e.target.value })}
              className="mt-0.5 w-full rounded-md border border-cream-400 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-ink-400">
            기업구분
            <select
              value={profile.entrprsDiv}
              onChange={(e) => update({ entrprsDiv: e.target.value })}
              className="mt-0.5 w-full rounded-md border border-cream-400 px-2 py-1.5 text-sm"
            >
              <option value="">선택하세요</option>
              {ENTRPRS_DIVS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-ink-400">
            주요 업종
            <input
              value={profile.mainIndustry}
              onChange={(e) => update({ mainIndustry: e.target.value })}
              placeholder="예: 소프트웨어 개발"
              className="mt-0.5 w-full rounded-md border border-cream-400 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        </div>

        <div>
        {/* MYC-003 보유자격 */}
        <div className="mb-4">
          <div className="mb-1 text-xs font-medium text-ink-600">보유자격</div>
          <div className="mb-1.5 flex gap-2">
            <input
              value={qualInput}
              onChange={(e) => setQualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
              placeholder="자격·면허·등록 입력 후 추가"
              className="min-w-0 flex-1 rounded-md border border-cream-400 px-2 py-1.5 text-sm"
            />
            <button onClick={addQualification} className="rounded-md border border-cream-400 px-3 py-1.5 text-xs text-ink-600">
              추가
            </button>
          </div>
          {profile.qualifications.length === 0 ? (
            <p className="text-[12px] text-ink-300">등록된 보유자격이 없습니다. 면허·등록 정보를 넣으면 판정이 정확해집니다.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {profile.qualifications.map((q, i) => (
                <span key={i} className="flex items-center gap-1 rounded-full bg-cream-200 px-2.5 py-1 text-xs text-ink-600">
                  {q}
                  <button onClick={() => removeQualification(i)} className="text-ink-300 hover:text-amber-800">
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* MYC-004 수행실적 */}
        <div className="mb-4">
          <div className="mb-1 text-xs font-medium text-ink-600">수행실적</div>
          <div className="mb-1.5 flex gap-2">
            <input
              value={perfInput}
              onChange={(e) => setPerfInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPerformance())}
              placeholder="직접 입력"
              className="min-w-0 flex-1 rounded-md border border-cream-400 px-2 py-1.5 text-sm"
            />
            <button onClick={addPerformance} className="rounded-md border border-cream-400 px-3 py-1.5 text-xs text-ink-600">
              추가
            </button>
          </div>
          {profile.performances.length === 0 ? (
            <p className="text-[12px] text-ink-300">등록된 수행실적이 없습니다.</p>
          ) : (
            <ul className="space-y-1">
              {profile.performances.map((p, i) => (
                <li key={i} className="flex items-center justify-between rounded bg-cream-200 px-2.5 py-1 text-xs text-ink-600">
                  {p}
                  <button onClick={() => removePerformance(i)} className="text-ink-300 hover:text-amber-800">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* MYC-005 관심분야 */}
        <div>
          <div className="mb-1.5 text-xs font-medium text-ink-600">관심분야</div>
          <div className="flex flex-wrap gap-1.5">
            {INTEREST_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-2.5 py-1 text-xs ${
                  profile.interestTags.includes(tag) ? 'bg-clay-100 text-clay-600 font-medium' : 'border border-cream-400 text-ink-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        </div>
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-cream-400 pt-4">
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="rounded-md bg-clay-400 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            저장하기
          </button>
          {dirty ? (
            <span className="text-xs text-amber-800">저장하지 않은 변경사항이 있습니다.</span>
          ) : (
            savedAt && (
              <span className="text-xs text-ink-300">
                {savedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}에 저장됨
              </span>
            )
          )}
        </div>
      </div>

      <p className="mt-3 text-[12px] text-ink-300">
        공고 적합도 판정(MYC-007)은 통합검색 결과와 연동해 3단계 후반에 추가됩니다. 최종 확인은 항상 원문에서 하세요.
      </p>
    </div>
  );
}
