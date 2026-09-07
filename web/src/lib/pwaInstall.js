// PWA 설치 프롬프트 — beforeinstallprompt는 앱 로드 초반에 한 번만 오므로 모듈 스코프에서 바로 캡처해둔다.
// iOS Safari는 이 이벤트 자체가 없어서(설치 버튼이 아니라 공유 메뉴로만 가능) 항상 false.
let deferredPrompt = null;
const listeners = new Set();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  listeners.forEach((fn) => fn(true));
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  listeners.forEach((fn) => fn(false));
});

export function isInstallAvailable() {
  return deferredPrompt != null;
}

export function onInstallAvailabilityChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function promptInstall() {
  if (!deferredPrompt) return null;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return choice.outcome; // 'accepted' | 'dismissed'
}

export function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
