# hwp-convert (Cloud Run)

DTL-009(대기업 참여제한 자동판정)에서 HWP(구형 바이너리) 첨부파일만 처리하는 변환기.
PDF·HWPX는 `functions/`가 직접 처리하므로 이 서비스로 오지 않는다.

## 로컬 빌드·테스트 (Docker 필요 — 이 환경엔 Docker가 없어 미검증)

```bash
docker build -t hwp-convert .
docker run -p 8080:8080 hwp-convert
curl -X POST --data-binary @sample.hwp http://localhost:8080
```

## Cloud Run 배포

```bash
gcloud run deploy hwp-convert \
  --source . \
  --region asia-northeast3 \
  --no-allow-unauthenticated \
  --memory 1Gi \
  --timeout 60
```

- `--no-allow-unauthenticated` 권장: 이 서비스는 `functions/`만 호출해야 하므로 공개 엔드포인트로 열지 않는다.
  functions 쪽에서 서비스 계정 ID 토큰을 붙여 호출하도록 구성 필요 (Cloud Run 서비스 간 인증).
- 배포 후 나온 URL을 `functions`의 `CLOUD_RUN_HWP_CONVERT_URL` 환경변수로 설정한다.

## 확인 필요 (배포 후)

- 실제 HWP 샘플 여러 개로 텍스트 추출 품질 확인 — LibreOffice의 HWP 가져오기 필터가
  완벽하지 않아 표·특수 개체가 있는 문서는 텍스트 누락 가능성 있음 (기획서 9장 참고)
- 콜드 스타트 시간(첫 요청 5~10초 예상) 실측
