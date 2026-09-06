const STORAGE_KEY = 'savedItems';

export function loadSavedItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function isItemSaved(id) {
  return loadSavedItems().some((it) => it.id === id);
}

// SAV-001: 공고 저장/해제
export function toggleSavedItem(item) {
  const list = loadSavedItems();
  const idx = list.findIndex((it) => it.id === item.id);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.unshift({ ...item, savedAt: new Date().toISOString() });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return idx < 0; // true면 방금 저장됨, false면 방금 해제됨
}
