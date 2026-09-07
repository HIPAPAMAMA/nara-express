// 관심 키워드·저장내역을 카카오 로그인 사용자 기준으로 저장 — alertStore.js와 같은
// kv-vs-메모리 폴백 패턴이지만, 단순 목록이라 hash/set 대신 통짜 JSON 배열 하나를 값으로 쓴다.
// 기기 간 이어보기(로그인한 브라우저마다 같은 목록을 보는 것)가 목적이라 알림 구독(alertStore)과는 별개다.

let kv = null;
if (process.env.KV_REST_API_URL) {
  // eslint-disable-next-line global-require
  kv = require('@vercel/kv').kv;
}

const mem = new Map(); // key -> array

async function getList(key) {
  if (kv) return (await kv.get(key)) || [];
  return mem.get(key) || [];
}
async function setList(key, list) {
  if (kv) return kv.set(key, list);
  mem.set(key, list);
}
async function del(key) {
  if (kv) return kv.del(key);
  mem.delete(key);
}

function keywordsKey(uid) {
  return `kakao:keywordlist:${uid}`;
}
function savedKey(uid) {
  return `kakao:saveditems:${uid}`;
}

async function getKeywords(uid) {
  return getList(keywordsKey(uid));
}
async function setKeywords(uid, list) {
  await setList(keywordsKey(uid), list);
}
async function getSavedItems(uid) {
  return getList(savedKey(uid));
}
async function setSavedItems(uid, list) {
  await setList(savedKey(uid), list);
}
async function deleteUserData(uid) {
  await del(keywordsKey(uid));
  await del(savedKey(uid));
}

module.exports = { getKeywords, setKeywords, getSavedItems, setSavedItems, deleteUserData };
