// Cloud Run 서비스: HWP(구형 바이너리) → 텍스트 변환 전용.
// functions/의 DTL-009 파이프라인(src/lib/textExtract.js)이 HWP 파일일 때만 이 서비스를 호출한다.
// PDF·HWPX는 여기로 오지 않는다 (Cloud Functions에서 직접 처리).
//
// ⚠️ 로컬에 Docker가 없어 이 파일은 실행 검증을 하지 못했다. Cloud Run 배포 후 반드시
// 실제 HWP 샘플로 확인할 것 (기획서 9장 관련 리스크 메모 참고).

const express = require('express');
const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const app = express();
app.use(express.raw({ type: '*/*', limit: '30mb' }));

function convertWithLibreOffice(inputPath, outDir) {
  return new Promise((resolve, reject) => {
    execFile(
      'soffice',
      ['--headless', '--norestore', '--convert-to', 'txt:Text', '--outdir', outDir, inputPath],
      { timeout: 60_000 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        resolve(stdout);
      }
    );
  });
}

app.post('/', async (req, res) => {
  if (!req.body || req.body.length === 0) {
    return res.status(400).json({ message: '변환할 HWP 파일 바이너리가 필요합니다.' });
  }

  const id = crypto.randomUUID();
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `hwp-${id}-`));
  const inputPath = path.join(workDir, 'input.hwp');

  try {
    await fs.writeFile(inputPath, req.body);
    await convertWithLibreOffice(inputPath, workDir);
    const text = await fs.readFile(path.join(workDir, 'input.txt'), 'utf8');
    res.json({ text });
  } catch (e) {
    res.status(500).json({ message: `HWP 변환 실패: ${e.message}` });
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
});

app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`hwp-convert listening on ${port}`));
