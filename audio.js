(() => {
  // アンミカ音声の一元管理
  const SRC = 'assets/anmika.m4a';
  const FALLBACK_MS = 3000;
  const MAX_DURATION_MS = 10000; // 安全網: 10秒で必ずcallbackを呼ぶ

  let audio = null;
  let currentCallback = null;
  let safetyTimer = null;

  function getAudio() {
    if (!audio) {
      audio = new Audio(SRC);
      audio.preload = 'auto';
      audio.addEventListener('ended', () => triggerCallback(1000));
      audio.addEventListener('error', () => triggerCallback(FALLBACK_MS));
    }
    return audio;
  }

  function triggerCallback(delay) {
    if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
    const cb = currentCallback;
    currentCallback = null;
    if (cb) setTimeout(cb, delay);
  }

  function attemptPlay(allowRetry) {
    const a = getAudio();
    try { a.currentTime = 0; } catch (e) {}
    const p = a.play();
    if (p && p.then) {
      p.catch(() => {
        if (allowRetry) {
          // 自動再生がブロックされた → 次のユーザー操作で再試行
          const retryOnGesture = () => {
            document.removeEventListener('click', retryOnGesture, true);
            document.removeEventListener('touchstart', retryOnGesture, true);
            attemptPlay(false);
          };
          document.addEventListener('click', retryOnGesture, { capture: true, once: true });
          document.addEventListener('touchstart', retryOnGesture, { capture: true, once: true, passive: true });
        } else {
          triggerCallback(FALLBACK_MS);
        }
      });
    }
  }

  function playAnmika(onDone) {
    currentCallback = onDone || function () {};
    if (safetyTimer) clearTimeout(safetyTimer);
    // 10秒経っても 'ended' が来なければ強制的にcallbackを呼ぶ（安全網）
    safetyTimer = setTimeout(() => triggerCallback(0), MAX_DURATION_MS);
    attemptPlay(true);
  }

  window.playAnmika = playAnmika;
})();
