// MYC-007: 공고 적합도 판정 — 구조화된 제한 필드(indstrytyLmtYn 등) 기반.
// 정밀 매칭이 아니라 "제한 플래그가 있다/없다"만 알려주는 참고용 판정이다 — 원문 확인은 항상 필요.

function loadMyCompany() {
  try {
    return JSON.parse(localStorage.getItem('myCompany') || 'null');
  } catch {
    return null;
  }
}

export function assessEligibility(item, restrictionCheckOverride) {
  const myCompany = loadMyCompany();
  const restrictionCheck = restrictionCheckOverride ?? item.restrictionCheck;

  if (!item.eligibility) {
    return { status: 'unknown', reasons: ['이 데이터 유형(낙찰결과·사전규격)에는 제한 관련 필드가 없습니다.'], myCompany };
  }
  if (!myCompany?.corpNm) {
    return { status: 'no_profile', reasons: ['내 업체 정보를 먼저 등록하면 판정을 볼 수 있습니다.'], myCompany };
  }

  const e = item.eligibility;
  const reasons = [];

  if (e.indstrytyLmtYn === 'Y') reasons.push('업종제한 있음 — 등록업종 일치 여부는 원문에서 직접 확인');
  if (e.prdctClsfcLmtYn === 'Y') reasons.push('물품분류제한 있음');
  if (e.cmmnSpldmdCorpRgnLmtYn === 'Y') reasons.push('공동수급 지역제한 있음');
  if (e.rgnLmtBidLocplcJdgmBssNm) {
    const myRegionPrefix = myCompany.hqRegion?.slice(0, 2); // "부산광역시" → "부산" 식 대략 비교
    const likelyMatch = myRegionPrefix && e.rgnLmtBidLocplcJdgmBssNm.includes(myRegionPrefix);
    reasons.push(
      `지역제한 기준: ${e.rgnLmtBidLocplcJdgmBssNm}${myCompany.hqRegion ? (likelyMatch ? ' (내 소재지와 대략 일치)' : ' (내 소재지와 다를 수 있음)') : ''}`
    );
  }

  // DTL-009(대기업 참여제한) 판정 결과가 있으면 합산 — 내 업체가 대기업일 때만 의미 있음
  if (myCompany.entrprsDiv === '대기업' && restrictionCheck) {
    if (restrictionCheck.status === 'restricted') {
      reasons.push(`대기업 참여제한 문구 발견: "${restrictionCheck.excerpt}" (${restrictionCheck.matchedFile})`);
    } else if (restrictionCheck.status === 'needs_review') {
      reasons.push('대기업 참여제한 여부 확인 필요 (일부 첨부파일을 읽지 못함)');
    }
  }

  return { status: reasons.length > 0 ? 'has_restriction' : 'no_restriction', reasons, myCompany };
}
