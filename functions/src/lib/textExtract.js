const AdmZip = require('adm-zip');
const { XMLParser } = require('fast-xml-parser');

function extFromName(name) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name || '');
  return m ? m[1].toLowerCase() : null;
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`첨부파일 다운로드 실패 (HTTP ${res.status})`);
    err.httpStatus = res.status;
    throw err;
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function extractPdfText(buffer) {
  // pdf-parse v2 API: class 기반 (v1의 함수형 API와 다름 — package.json에 ^2.4.5로 고정해둘 것)
  const { PDFParse } = require('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text || '';
  } finally {
    await parser.destroy();
  }
}

// HWPX(신형, 2010 이후 규격)는 ZIP 컨테이너 안에 Contents/section*.xml 이 들어있는 구조.
function extractHwpxText(buffer) {
  const zip = new AdmZip(buffer);
  const entries = zip
    .getEntries()
    .filter((e) => /^Contents\/section\d+\.xml$/i.test(e.entryName))
    .sort((a, b) => a.entryName.localeCompare(b.entryName));

  const parser = new XMLParser({ ignoreAttributes: true, textNodeName: '#text' });
  let out = '';

  function walk(node) {
    if (node == null) return;
    if (typeof node === 'string' || typeof node === 'number') {
      out += node + ' ';
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === 'object') {
      for (const key of Object.keys(node)) {
        if (key === '#text') out += node[key] + ' ';
        else walk(node[key]);
      }
    }
  }

  for (const entry of entries) {
    try {
      const xml = entry.getData().toString('utf8');
      const json = parser.parse(xml);
      walk(json);
    } catch {
      // 개별 section 파싱 실패는 건너뛴다 — 다른 section에서 매칭될 수 있음
    }
  }
  return out;
}

// HWP(구형, 바이너리)는 Cloud Run(LibreOffice headless) 변환기가 필요하다.
// CLOUD_RUN_HWP_CONVERT_URL이 설정되지 않았으면 처리 불가로 명확히 표시한다 (조용히 무시하지 않는다).
// TODO(배포 시): services/hwp-convert를 --no-allow-unauthenticated로 배포했다면, 아래 fetch에
// Google ID 토큰(Authorization: Bearer ...)을 붙여야 한다 (google-auth-library의
// GoogleAuth#getIdTokenClient 사용 권장). 지금은 인증 없는 호출로만 구현돼 있다 — 미검증.
async function extractHwpText(buffer) {
  const convertUrl = process.env.CLOUD_RUN_HWP_CONVERT_URL;
  if (!convertUrl) {
    const err = new Error('구형 HWP 파일은 지원하지 않습니다.');
    err.unsupported = true;
    throw err;
  }
  const res = await fetch(convertUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/octet-stream' },
    body: buffer,
  });
  if (!res.ok) {
    const err = new Error(`HWP 변환 실패 (HTTP ${res.status})`);
    throw err;
  }
  const json = await res.json();
  return json.text || '';
}

/** 첨부파일 하나를 다운로드해 텍스트로 변환한다. 실패 시 { error } 를 반환(throw하지 않음). */
async function extractAttachmentText({ name, url }) {
  const ext = extFromName(name);
  try {
    const buffer = await downloadBuffer(url);
    if (ext === 'pdf') return { text: await extractPdfText(buffer) };
    if (ext === 'hwpx') return { text: extractHwpxText(buffer) };
    if (ext === 'hwp') return { text: await extractHwpText(buffer) };
    return { error: `지원하지 않는 파일 형식(.${ext || '?'})`, unsupported: true };
  } catch (e) {
    return { error: e.message, unsupported: Boolean(e.unsupported) };
  }
}

module.exports = { extFromName, extractAttachmentText };
