import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 핀치줌·더블탭줌 차단 — iOS Safari(최신 버전)는 viewport meta의 user-scalable=no와
// CSS touch-action을 접근성 정책상 무시하고 제스처 자체는 그대로 통과시키는 경우가 있어,
// 제스처 이벤트를 직접 막아야 확실히 먹힌다.
document.addEventListener('gesturestart', (e) => e.preventDefault()); // Safari 전용 핀치 시작 이벤트
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length > 1) e.preventDefault(); // 두 손가락 이상이면 핀치줌으로 간주
  },
  { passive: false }
);
let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault(); // 더블탭줌 방지
    lastTouchEnd = now;
  },
  { passive: false }
);

// PWA "홈 화면에 추가" 설치 조건 충족용 — 오프라인 캐싱은 안 함(sw.js 참고)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
