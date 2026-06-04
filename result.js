(() => {
  const overlay = document.getElementById('resultOverlay');
  const line = document.getElementById('resultLine');
  const mascot = document.getElementById('resultMascot');
  const titleEl = document.getElementById('resultTitle');
  const scoreEl = document.getElementById('resultScore');
  const actions = document.getElementById('resultActions');
  const btnRetry = document.getElementById('btnRetry');
  const btnQuit = document.getElementById('btnQuit');

  const RESULT_FALLBACK_MS = 3000;

  const params = new URLSearchParams(window.location.search);
  const type = params.get('type') === 'gameover' ? 'gameover' : 'clear';
  const level = parseInt(params.get('level') || '1', 10);
  const correct = parseInt(params.get('correct') || '0', 10);
  const total = parseInt(params.get('total') || '0', 10);
  const lives = parseInt(params.get('lives') || '0', 10);

  // 表示振り分け（セリフは全演出共通「白って200色あんねん」）
  if (type === 'clear') {
    titleEl.textContent = 'クリア！';
    titleEl.classList.add('result-title--clear');
    scoreEl.innerHTML = `全${total}問正解！ ライフ残 <span class="score-hearts">♥</span>×${lives}`;
    overlay.classList.add('result-overlay--clear');
    mascot.src = 'assets/clear.png';
  } else {
    titleEl.textContent = 'ゲームオーバー';
    titleEl.classList.add('result-title--gameover');
    scoreEl.textContent = `${correct}問正解 / ${total}問`;
    overlay.classList.add('result-overlay--gameover');
    mascot.src = 'assets/gameover.png';
  }
  line.textContent = '白って200色あんねん';

  // アンミカは「白って200色あんねん」一本（音声未配置時は3秒固定）
  const VOICE = 'assets/anmika.m4a';

  function revealActions() {
    overlay.classList.add('is-fading-out');
    setTimeout(() => {
      overlay.hidden = true;
      actions.setAttribute('aria-hidden', 'false');
      actions.classList.add('is-show');
    }, 600); // overlay fadeoutと同期
  }

  let closed = false;
  function finish() {
    if (closed) return;
    closed = true;
    revealActions();
  }

  const audio = new Audio(VOICE);
  audio.addEventListener('ended', () => setTimeout(finish, 1000));
  audio.addEventListener('error', () => setTimeout(finish, RESULT_FALLBACK_MS));
  audio.play().catch(() => setTimeout(finish, RESULT_FALLBACK_MS));

  // ボタン挙動
  btnRetry.addEventListener('click', () => {
    window.location.href = `play.html?level=${level}`;
  });
  btnQuit.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
})();
