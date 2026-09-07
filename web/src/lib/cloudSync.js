// 카카오 연결 시 로컬(localStorage)과 서버(KV) 데이터를 합쳐 기기 간 이어보기를 지원한다.
// 비연결 상태에서 쌓인 로컬 데이터를 잃지 않도록 합집합으로 병합한 뒤 양쪽에 다시 반영한다.
// 주의: 삭제는 즉시 서버로도 반영되지만(각 화면의 toggle이 setCloud*를 바로 호출), 오프라인이던
// 다른 기기가 나중에 합류하면 그 기기의 옛 로컬 목록이 부활할 수 있다 — v1은 이 정도로 충분하다고 판단.
import { getCloudKeywords, setCloudKeywords, getCloudSavedItems, setCloudSavedItems } from '../api/client';
import { loadSavedItems, setSavedItemsCloudSync } from './savedItems';

const KEYWORDS_KEY = 'keywords';
const SAVED_KEY = 'savedItems';

function loadLocalKeywords() {
  try {
    return JSON.parse(localStorage.getItem(KEYWORDS_KEY) || '[]');
  } catch {
    return [];
  }
}

export async function syncOnConnect() {
  const [kwRes, savedRes] = await Promise.all([getCloudKeywords(), getCloudSavedItems()]);
  const mergedKeywords = Array.from(new Set([...(kwRes.keywords || []), ...loadLocalKeywords()]));
  const savedMap = new Map();
  for (const it of [...(savedRes.items || []), ...loadSavedItems()]) savedMap.set(it.id, it);
  const mergedSaved = [...savedMap.values()];

  localStorage.setItem(KEYWORDS_KEY, JSON.stringify(mergedKeywords));
  localStorage.setItem(SAVED_KEY, JSON.stringify(mergedSaved));
  setSavedItemsCloudSync(true);

  await Promise.all([setCloudKeywords(mergedKeywords), setCloudSavedItems(mergedSaved)]);
  window.dispatchEvent(new Event('nra:cloudsync'));
}

export function disableCloudSync() {
  setSavedItemsCloudSync(false);
}
