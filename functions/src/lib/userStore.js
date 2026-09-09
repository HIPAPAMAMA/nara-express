// 앱 계정(가입 승인제) 저장소 — alertStore.js와 같은 kv-vs-메모리 폴백 패턴, TTL 없는 영구 데이터.
const crypto = require('node:crypto');

let kv = null;
if (process.env.KV_REST_API_URL) {
  // eslint-disable-next-line global-require
  kv = require('@vercel/kv').kv;
}

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
async function sadd(key, member) {
  if (kv) return kv.sadd(key, member);
  if (!memSet.has(key)) memSet.set(key, new Set());
  memSet.get(key).add(member);
}
async function smembers(key) {
  if (kv) return (await kv.smembers(key)) || [];
  return [...(memSet.get(key) || [])];
}

function userKey(email) {
  return `app:user:${email.toLowerCase()}`;
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

async function createUser({ email, name, team, password, status }) {
  const normalizedEmail = email.toLowerCase();
  const passwordSalt = crypto.randomBytes(16).toString('hex');
  await hset(userKey(normalizedEmail), {
    email: normalizedEmail,
    name,
    team,
    passwordSalt,
    passwordHash: hashPassword(password, passwordSalt),
    status, // 'pending' | 'approved' | 'rejected'
    requestedAt: new Date().toISOString(),
  });
  await sadd('app:users', normalizedEmail);
}

async function getUser(email) {
  return hgetall(userKey(email.toLowerCase()));
}

async function allUserEmails() {
  return smembers('app:users');
}

async function setStatus(email, status) {
  await hset(userKey(email), { status, decidedAt: new Date().toISOString() });
}

// 비밀번호를 잊었을 때 메일 발송 없이 관리자가 직접 재설정 — 가입 승인과 같은 신뢰 모델
// (관리자가 사람을 알아보고 처리) 그대로 재사용, 새 비밀번호는 응답으로 한 번만 돌려준다.
async function setPassword(email, newPassword) {
  const passwordSalt = crypto.randomBytes(16).toString('hex');
  await hset(userKey(email), { passwordSalt, passwordHash: hashPassword(newPassword, passwordSalt) });
}

// 타이밍 공격 방지를 위해 길이가 달라도 항상 같은 시간이 걸리는 비교 대신,
// scrypt 해시(고정 64바이트)라 timingSafeEqual로 충분하다.
function verifyPassword(user, password) {
  if (!user?.passwordHash || !user?.passwordSalt) return false;
  const hash = hashPassword(password, user.passwordSalt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(user.passwordHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { createUser, getUser, allUserEmails, setStatus, setPassword, verifyPassword };
