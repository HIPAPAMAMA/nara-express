// DTL-009 대기업 참여제한 자동 판정
// 원칙(기획서 3.5절): 키워드 매칭은 완벽하지 않으므로 "제한없음"을 100% 확정처럼 노출하지 않는다.
// 항상 "확인필요" 가능성과 원문 링크를 함께 제공한다.

const { extractAttachmentText } = require('./textExtract');

const RELEVANT_NAME_HINTS = ['규격서', '과업지시서', '과업내용서', '제안요청서', '제안서'];
const RESTRICTION_KEYWORDS = [
  '대기업 참여제한',
  '대기업참여제한',
  '대기업의 참여를 제한',
  '대기업인 소프트웨어사업자',
  '소프트웨어사업 대기업 참여',
  '중소기업자간 경쟁제품',
  '중소기업자 간 경쟁제품',
];

const MAX_FILES_PER_CHECK = 5;

function pickRelevantAttachments(attachments) {
  const relevant = attachments.filter((a) =>
    RELEVANT_NAME_HINTS.some((hint) => (a.name || '').includes(hint))
  );
  const pool = relevant.length > 0 ? relevant : attachments;
  return pool.slice(0, MAX_FILES_PER_CHECK);
}

function findMatch(text) {
  for (const kw of RESTRICTION_KEYWORDS) {
    const idx = text.indexOf(kw);
    if (idx !== -1) {
      const start = Math.max(0, idx - 20);
      const end = Math.min(text.length, idx + kw.length + 20);
      return { keyword: kw, excerpt: text.slice(start, end).replace(/\s+/g, ' ').trim() };
    }
  }
  return null;
}

/**
 * attachments: { name, url }[]
 * 반환: { status: 'restricted'|'clear'|'needs_review', matchedFile, excerpt, checkedAt, filesChecked, filesFailed }
 */
async function checkRestriction(attachments) {
  const checkedAt = new Date().toISOString();

  if (!attachments || attachments.length === 0) {
    return {
      status: 'needs_review',
      matchedFile: null,
      excerpt: null,
      note: '첨부파일이 없어 자동 판정할 수 없습니다.',
      checkedAt,
      filesChecked: [],
      filesFailed: [],
    };
  }

  const targets = pickRelevantAttachments(attachments);
  const filesChecked = [];
  const filesFailed = [];

  for (const att of targets) {
    const result = await extractAttachmentText(att);
    if (result.error) {
      filesFailed.push({ name: att.name, reason: result.error, unsupported: Boolean(result.unsupported) });
      continue;
    }
    filesChecked.push(att.name);
    const match = findMatch(result.text);
    if (match) {
      return {
        status: 'restricted',
        matchedFile: att.name,
        excerpt: match.excerpt,
        checkedAt,
        filesChecked,
        filesFailed,
      };
    }
  }

  if (filesFailed.length > 0) {
    // PDF·HWP·HWPX 외의 파일 형식(예: .doc, .xlsx, .zip)만 읽지 못한 경우는 "시스템 오류"가
    // 아니라 "지원 범위 밖"임을 명확히 안내 — hwp는 이제 hwpjs로 지원되니 여기 해당 안 됨
    const allUnsupported = filesFailed.every((f) => f.unsupported);
    const note = allUnsupported
      ? '지원하지 않는 파일 형식입니다(PDF·HWP·HWPX만 자동 판정 지원). 원문에서 직접 확인해주세요.'
      : `${filesFailed.length}개 파일을 읽지 못했습니다. 원문에서 직접 확인하세요.`;
    return {
      status: 'needs_review',
      matchedFile: null,
      excerpt: null,
      note,
      checkedAt,
      filesChecked,
      filesFailed,
    };
  }

  return {
    status: 'clear',
    matchedFile: null,
    excerpt: null,
    note: '키워드 매칭 기준이며 100% 확정이 아닙니다. 원문 확인을 권장합니다.',
    checkedAt,
    filesChecked,
    filesFailed,
  };
}

module.exports = { checkRestriction, RESTRICTION_KEYWORDS };
