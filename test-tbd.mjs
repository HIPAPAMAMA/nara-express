// T-1, T-2, T-4, T-7 실측 스크립트 (나라장터 낙찰정보서비스 기준)
// T-6은 사전규격정보서비스 엔드포인트 별도 확인 필요 (하단 스텁 참고)
//
// 실행 방법:
//   1) Node.js 18 이상 필요 (내장 fetch 사용, 별도 설치 불필요)
//   2) 터미널에서:
//        export NARA_SERVICE_KEY="공공데이터포털에서 발급받은 인증키(Decoding 값)"
//        node test-tbd.mjs
//
// 주의: 서비스키는 코드에 직접 적지 말고 반드시 환경변수로 넘길 것.

const SERVICE_KEY = process.env.NARA_SERVICE_KEY;
if (!SERVICE_KEY) {
  console.error("환경변수 NARA_SERVICE_KEY가 없습니다. export NARA_SERVICE_KEY=... 먼저 실행하세요.");
  process.exit(1);
}

// ⚠️ 확인 필요: 아래 BASE/오퍼레이션명은 조달청 나라장터 API의 일반적으로 알려진 규칙을 따른 것입니다.
// 실행 전, 공공데이터포털 로그인 > 마이페이지 > 활용신청 상세 > "상세기능" 탭에서
// 실제 오퍼레이션명·파라미터명이 아래와 일치하는지 반드시 대조하세요. 다르면 이 값만 바꾸면 됩니다.
const BASE = "https://apis.data.go.kr/1230000/as/ScsbidInfoService";
const OPERATION = "getScsbidListSttusServc"; // 낙찰정보 - 용역 기준

async function callApi(params) {
  const url = new URL(`${BASE}/${OPERATION}`);
  url.searchParams.set("serviceKey", SERVICE_KEY);
  url.searchParams.set("type", "json");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { httpStatus: res.status, raw: text.slice(0, 300), parsed: null };
  }
  return { httpStatus: res.status, raw: null, parsed: json };
}

function pad(n) { return String(n).padStart(2, "0"); }
function fmtDate(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

async function testT1_chunkSize() {
  console.log("\n=== T-1. 청크 단위(날짜범위 상한) 확인 ===");
  const today = new Date();
  const dayRanges = [15, 30, 45, 60, 90, 180, 365];
  for (const days of dayRanges) {
    const end = fmtDate(today);
    const start = fmtDate(new Date(today.getTime() - days * 86400000));
    try {
      const { httpStatus, parsed, raw } = await callApi({
        inqryDiv: "1",
        inqryBgnDt: start + "0000",
        inqryEndDt: end + "2359",
        numOfRows: "1",
        pageNo: "1",
      });
      const code = parsed?.response?.header?.resultCode ?? "?";
      const msg = parsed?.response?.header?.resultMsg ?? raw ?? "?";
      console.log(`${days}일 범위 → HTTP ${httpStatus}, resultCode=${code}, msg=${msg}`);
      if (code !== "00" && code !== "0") {
        console.log(`  → ${days}일 근처에서 에러 발생. 이 값 직전이 청크 상한일 가능성 높음.`);
        break;
      }
    } catch (e) {
      console.log(`${days}일 범위 → 요청 실패: ${e.message}`);
      break;
    }
    await new Promise((r) => setTimeout(r, 300)); // 초당 호출 제한 대비
  }
}

async function testT2_maxRows() {
  console.log("\n=== T-2. 페이지당 최대 건수(numOfRows) 확인 ===");
  const today = new Date();
  const start = fmtDate(new Date(today.getTime() - 30 * 86400000));
  const end = fmtDate(today);
  for (const rows of [10, 100, 500, 1000, 9999]) {
    try {
      const { httpStatus, parsed } = await callApi({
        inqryDiv: "1",
        inqryBgnDt: start + "0000",
        inqryEndDt: end + "2359",
        numOfRows: String(rows),
        pageNo: "1",
      });
      const code = parsed?.response?.header?.resultCode ?? "?";
      const totalCount = parsed?.response?.body?.totalCount ?? "?";
      const items = parsed?.response?.body?.items;
      const itemCount = Array.isArray(items) ? items.length : (items ? 1 : 0);
      const echoedRows = parsed?.response?.body?.numOfRows ?? "?";
      console.log(`요청 numOfRows=${rows} → HTTP ${httpStatus}, resultCode=${code}, 실제 반환=${itemCount}건, totalCount=${totalCount}, 응답 numOfRows=${echoedRows}`);
    } catch (e) {
      console.log(`numOfRows=${rows} → 요청 실패: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
}

async function testT4_T7_fields() {
  console.log("\n=== T-4 (기초금액 필드) / T-7 (유찰 구분 필드) 확인 ===");
  const today = new Date();
  const start = fmtDate(new Date(today.getTime() - 30 * 86400000));
  const end = fmtDate(today);
  try {
    const { parsed } = await callApi({
      inqryDiv: "1",
      inqryBgnDt: start + "0000",
      inqryEndDt: end + "2359",
      numOfRows: "5",
      pageNo: "1",
    });
    const items = parsed?.response?.body?.items;
    const first = Array.isArray(items) ? items[0] : items;
    if (!first) {
      console.log("최근 30일 내 반환된 항목이 없습니다. 기간을 늘려 재실행 필요.");
      return;
    }
    console.log("응답 항목의 전체 필드 목록 (이 중에서 기초금액/유찰 관련 필드를 직접 찾아보세요):");
    console.log(Object.keys(first).join(", "));
    console.log("\n항목 전체 내용:");
    console.log(JSON.stringify(first, null, 2));
  } catch (e) {
    console.log(`요청 실패: ${e.message}`);
  }
}

async function testT6_attachmentUrl() {
  console.log("\n=== T-6. 첨부파일 URL 직접 접근 가능 여부 ===");
  console.log("⚠️ 사전규격정보서비스는 BASE/오퍼레이션명이 다릅니다.");
  console.log("포털 '상세기능' 탭에서 정확한 오퍼레이션명을 확인한 뒤,");
  console.log("응답에서 첨부파일 URL 필드를 찾아 아래처럼 직접 fetch해서 상태코드만 확인하면 됩니다:");
  console.log(`
  const res = await fetch(첨부파일URL);
  console.log(res.status); // 200이면 직접 접근 가능, 302/401 등이면 별도 인증 필요
  `);
}

(async () => {
  await testT1_chunkSize();
  await testT2_maxRows();
  await testT4_T7_fields();
  await testT6_attachmentUrl();
  console.log("\n완료. 결과를 캡처해서 종합기획서.md의 9장 TBD 표에 반영하면 됩니다.");
})();
