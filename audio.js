(() => {
  // アンミカ音声の一元管理 + iOS自動再生制約のアンロック
  const SRC = 'assets/anmika.m4a';
  const FALLBACK_MS = 3000;

  let audio = null;
  let unlocked = false;
  let currentCallback = null;

  function getAudio() {
    if (!audio) {
      audio = new Audio(SRC);
      audio.preload = 'auto';
      audio.addEventListener('ended', () => {
        const cb = currentCallback;
        currentCallback = null;
        if (cb) setTimeout(cb, 1000);
      });
      audio.addEventListener('error', () => {
        const cb = currentCallback;
        currentCallback = null;
        if (cb) setTimeout(cb, FALLBACK_MS);
      });
    }
    return audio;
  }

  // 最初のユーザー操作（click/touchstart）で「音声アンロック」を試みる
  function unlockAudio() {
    if (unlocked) return;
    const a = getAudio();
    const prevMuted = a.muted;
    const prevVolume = a.volume;
    a.muted = true;
    a.volume = 0;
    const p = a.play();
    const cleanup = () => {
      try { a.pause(); } catch (e) {}
      a.currentTime = 0;
      a.muted = prevMuted;
      a.volume = prevVolume;
      unlocked = true;
    };
    if (p && p.then) {
      p.then(cleanup).catch(() => {
        a.muted = prevMuted;
        a.volume = prevVolume;
      });
    } else {
      cleanup();
    }
  }

  // 音声を再生（callbackは終了+1秒後、失敗時は3秒後）
  // 自動再生が弾かれた場合、次のユーザー操作で再試行する
  function playAnmika(onDone) {
    currentCallback = onDone || function () {};
    attemptPlay(true);
  }

  function attemptPlay(allowRetry) {
    const a = getAudio();
    try { a.currentTime = 0; } catch (e) {}
    const p = a.play();
    if (p && p.then) {
      p.catch(() => {
        if (allowRetry) {
          // 自動再生ブロック → 次のユーザー操作で再試行
          const retryOnGesture = () => {
            document.removeEventListener('click', retryOnGesture, true);
            document.removeEventListener('touchstart', retryOnGesture, true);
            attemptPlay(false);
          };
          document.addEventListener('click', retryOnGesture, { capture: true, once: true });
          document.addEventListener('touchstart', retryOnGesture, { capture: true, once: true, passive: true });
        } else {
          // 再試行も失敗 → フォールバック
          const cb = currentCallback;
          currentCallback = null;
          if (cb) setTimeout(cb, FALLBACK_MS);
        }
      });
    }
  }

  window.playAnmika = playAnmika;

  // ユーザー操作のキャプチャ（あらゆるタップ・クリックでアンロック試行）
  document.addEventListener('click', unlockAudio, { capture: true });
  document.addEventListener('touchstart', unlockAudio, { capture: true, passive: true });
})();
