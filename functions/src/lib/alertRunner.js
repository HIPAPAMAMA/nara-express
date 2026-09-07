// KWD-003·RES-018 — 하루 1회(Vercel Cron) 실행되는 알림 배치.
// 정부 API 호출량이 사용자·키워드 수와 무관하게 일정하도록, 사용자별/키워드별로 따로
// 조회하지 않고 날짜범위 1회 조회(입찰공고 1회 + 낙찰결과 1회) 후 전체 구독자에 대해
// 클라이언트에서 매칭한다.
const { search } = require('./naraClient');
const { normalizeItem } = require('./normalize');
const { matchesKeyword } = require('./searchJob');
const kakao = require('./kakaoClient');
const alertStore = require('./alertStore');

const APP_URL = process.env.APP_URL || 'https://nara-express.vercel.app';
const WINDOW_DAYS = 2; // 크론 실행 시각 오차 대비 버퍼 — 중복은 SET-006 발송 이력으로 걸러짐

function pad(n) {
  return String(n).padStart(2, '0');
}
function ymd(date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

// 액세스 토큰이 곧 만료되면 미리 갱신한다. 카카오는 리프레시 토큰 만료가 1개월 미만일
// 때만 새 리프레시 토큰을 내려주므로, 없으면 기존 값을 그대로 유지해야 한다.
async function ensureFreshToken(uid, user) {
  const now = Date.now();
  if (user.accessExpiresAt && now < Number(user.accessExpiresAt) - 10 * 60 * 1000) {
    return user.accessToken;
  }
  const refreshed = await kakao.refreshAccessToken(user.refreshToken);
  const patch = { accessToken: refreshed.accessToken, accessExpiresAt: refreshed.accessExpiresAt };
  if (refreshed.refreshExpiresAt) {
    patch.refreshToken = refreshed.refreshToken;
    patch.refreshExpiresAt = refreshed.refreshExpiresAt;
  }
  await alertStore.saveUser(uid, patch);
  return refreshed.accessToken;
}

async function notifyUser(uid, { text, webUrl }) {
  const user = await alertStore.getUser(uid);
  if (!user || user.notifyEnabled === false || user.needsReconnect) return false;
  try {
    const accessToken = await ensureFreshToken(uid, user);
    await kakao.sendSelfMessage(accessToken, { text, webUrl });
    return true;
  } catch (e) {
    if (e.kakaoError === 'invalid_grant') await alertStore.saveUser(uid, { needsReconnect: true });
    throw e;
  }
}

async function runDailyAlerts() {
  const to = new Date();
  const from = new Date(to.getTime() - WINDOW_DAYS * 86400000);
  const fromStr = ymd(from);
  const toStr = ymd(to);

  const result = { keywordNotified: 0, bidNotified: 0, errors: [] };

  // KWD-003: 관심 키워드 신규공고
  const activeKeywords = await alertStore.allActiveKeywords();
  if (activeKeywords.length > 0) {
    const { items: rawItems } = await search('bid', 'all', { from: fromStr, to: toStr });
    const items = rawItems.map(normalizeItem);
    for (const kw of activeKeywords) {
      const matched = items.filter((it) => matchesKeyword(it, { keyword: kw }));
      if (matched.length === 0) continue;
      const subscribers = await alertStore.keywordSubscribers(kw);
      for (const uid of subscribers) {
        for (const item of matched) {
          const sentKey = `bid:${item.id}`;
          // eslint-disable-next-line no-await-in-loop
          if (await alertStore.isSent(uid, sentKey)) continue;
          try {
            // eslint-disable-next-line no-await-in-loop
            const sent = await notifyUser(uid, {
              text: `[관심 키워드 "${kw}"] 새 공고: ${item.title}`,
              webUrl: item.sourceUrl || APP_URL,
            });
            if (sent) {
              // eslint-disable-next-line no-await-in-loop
              await alertStore.markSent(uid, sentKey);
              result.keywordNotified += 1;
            }
          } catch (e) {
            result.errors.push({ uid, sentKey, message: e.message });
          }
        }
      }
    }
  }

  // RES-018: 추적 중인 공고의 낙찰 결과 발표
  const trackedBids = await alertStore.allTrackedBids();
  if (trackedBids.length > 0) {
    const { items: rawAwardItems } = await search('award', 'all', { from: fromStr, to: toStr });
    const awardItems = rawAwardItems.map(normalizeItem);
    for (const bidNo of trackedBids) {
      const matched = awardItems.filter((it) => it.bidNo === bidNo);
      if (matched.length === 0) continue;
      const subscribers = await alertStore.bidSubscribers(bidNo);
      for (const uid of subscribers) {
        for (const item of matched) {
          const sentKey = `award:${item.id}`;
          // eslint-disable-next-line no-await-in-loop
          if (await alertStore.isSent(uid, sentKey)) continue;
          try {
            // eslint-disable-next-line no-await-in-loop
            const sent = await notifyUser(uid, {
              text: `[낙찰 알림] 등록하신 공고의 낙찰 결과가 발표됐어요: ${item.title} (낙찰자: ${item.winner?.name || '정보없음'})`,
              webUrl: item.sourceUrl || APP_URL,
            });
            if (sent) {
              // eslint-disable-next-line no-await-in-loop
              await alertStore.markSent(uid, sentKey);
              // eslint-disable-next-line no-await-in-loop
              await alertStore.removeTrackedBid(uid, bidNo); // 해소됐으니 추적목록에서 제거
              result.bidNotified += 1;
            }
          } catch (e) {
            result.errors.push({ uid, sentKey, message: e.message });
          }
        }
      }
    }
  }

  return result;
}

module.exports = { runDailyAlerts };
