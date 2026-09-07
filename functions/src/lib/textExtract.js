const path = require('node:path');
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

// HWP(구형, 바이너리)는 @ohah/hwpjs(Rust 기반 네이티브 파서, napi-rs)로 직접 텍스트를 뽑는다.
// Cloud Run(LibreOffice headless) 변환기 없이 서버리스 함수 안에서 바로 처리 가능 — 예전엔
// Cloud Run이 필요해서 보류했었는데, 실제 나라장터 공고문 hwp로 테스트해보니 이 방식으로 충분했다.
// 패키지의 exports 맵이 서브패스를 막아놔서 일반 require('@ohah/hwpjs')는 조건에 따라
// browser.js(wasm)로 잘못 풀릴 수 있다 — 패키지 루트를 찾아 dist/index.js를 절대경로로 직접 require.
function loadHwpjs() {
  const pkgDir = path.dirname(require.resolve('@ohah/hwpjs/package.json'));
  return require(path.join(pkgDir, 'dist', 'index.js'));
}

function extractHwpText(buffer) {
  const { toMarkdown } = loadHwpjs();
  const { markdown } = toMarkdown(buffer, {});
  return markdown || '';
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
