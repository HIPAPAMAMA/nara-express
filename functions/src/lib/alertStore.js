// 카카오 알림(KWD-003·RES-018) 저장소 — jobStore.js와 같은 kv-vs-메모리 폴백 패턴이지만
// TTL 없는 영구 데이터라 별도 모듈로 분리했다. kv.keys('*') 스캔은 쓰지 않고 전부
// sadd/smembers로 인덱싱한다(사용자 수·키워드 수가 늘어도 크론이 스캔 없이 순회 가능).

let kv = null;
if (process.env.KV_REST_API_URL) {
  // eslint-disable-next-line global-require
  kv = require('@vercel/kv').kv;
}

// 로컬 개발 전용 메모리 폴백 — Redis의 hash/set을 아주 단순하게 흉내만 낸다
const memHash = new Map(); // key -> {field: value}
const memSet = new Map(); // key -> Set

async function hset(key, obj) {
  if (kv) return kv.hset(key, obj);
  const cur = memHash.get(key) || {};
  memHash.set(key, { ...cur, ...obj });
}
async function hgetall(key) {
  if (kv) return (await kv.hgetall(key)) || null;
  return memHash.get(key) || null;
}
async function hdel(key) {
  if (kv) return kv.del(key);
  memHash.delete(key);
}
async function sadd(key, member) {
  if (kv) return kv.sadd(key, member);
  if (!memSet.has(key)) memSet.set(key, new Set());
  memSet.get(key).add(member);
}
async function srem(key, member) {
  if (kv) return kv.srem(key, member);
  memSet.get(key)?.delete(member);
}
async function smembers(key) {
  if (kv) return (await kv.smembers(key)) || [];
  return [...(memSet.get(key) || [])];
}
async function sismember(key, member) {
  if (kv) return Boolean(await kv.sismember(key, member));
  return memSet.get(key)?.has(member) ?? false;
}

// ── 카카오 사용자 ──────────────────────────────────────────────
function userKey(uid) {
  return `kakao:user:${uid}`;
}

async function saveUser(uid, fields) {
  await hset(userKey(uid), fields);
  await sadd('kakao:users', uid);
}
async function getUser(uid) {
  return hgetall(userKey(uid));
}
async function allUserIds() {
  return smembers('kakao:users');
}
async function deleteUser(uid) {
  await hdel(userKey(uid));
  await srem('kakao:users', uid);
  const keywords = await smembers(`kakao:kw:${uid}`);
  for (const kw of keywords) await removeKeywordAlert(uid, kw);
  const bids = await smembers(`kakao:bid:${uid}`);
  for (const bidNo of bids) await removeTrackedBid(uid, bidNo);
}

// ── KWD-003: 키워드 알림 구독 (사용자↔키워드 양방향 인덱스) ──────
async function addKeywordAlert(uid, keyword) {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return;
  await sadd(`kakao:kw:${uid}`, kw);
  await sadd(`kakao:kwidx:${kw}`, uid);
  await sadd('kakao:keywords', kw);
}
async function removeKeywordAlert(uid, keyword) {
  const kw = keyword.trim().toLowerCase();
  await srem(`kakao:kw:${uid}`, kw);
  await srem(`kakao:kwidx:${kw}`, uid);
  const remaining = await smembers(`kakao:kwidx:${kw}`);
  if (remaining.length === 0) await srem('kakao:keywords', kw);
}
async function myKeywordAlerts(uid) {
  return smembers(`kakao:kw:${uid}`);
}
async function keywordSubscribers(keyword) {
  return smembers(`kakao:kwidx:${keyword}`);
}
async function allActiveKeywords() {
  return smembers('kakao:keywords');
}

// ── RES-018: 낙찰 추적 (사용자↔공고번호 양방향 인덱스) ───────────
async function addTrackedBid(uid, bidNo) {
  await sadd(`kakao:bid:${uid}`, bidNo);
  await sadd(`kakao:bididx:${bidNo}`, uid);
  await sadd('kakao:bids', bidNo);
}
async function removeTrackedBid(uid, bidNo) {
  await srem(`kakao:bid:${uid}`, bidNo);
  await srem(`kakao:bididx:${bidNo}`, uid);
  const remaining = await smembers(`kakao:bididx:${bidNo}`);
  if (remaining.length === 0) await srem('kakao:bids', bidNo);
}
async function myTrackedBids(uid) {
  return smembers(`kakao:bid:${uid}`);
}
async function bidSubscribers(bidNo) {
  return smembers(`kakao:bididx:${bidNo}`);
}
async function allTrackedBids() {
  return smembers('kakao:bids');
}

// ── SET-006: 발송 이력(중복 방지) ────────────────────────────────
async function isSent(uid, sentKey) {
  return sismember(`kakao:sent:${uid}`, sentKey);
}
async function markSent(uid, sentKey) {
  await sadd(`kakao:sent:${uid}`, sentKey);
}

module.exports = {
  saveUser,
  getUser,
  allUserIds,
  deleteUser,
  addKeywordAlert,
  removeKeywordAlert,
  myKeywordAlerts,
  keywordSubscribers,
  allActiveKeywords,
  addTrackedBid,
  removeTrackedBid,
  myTrackedBids,
  bidSubscribers,
  allTrackedBids,
  isSent,
  markSent,
};
