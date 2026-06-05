(() => {
  const COLORS = window.COLORS || [];

  // ===== DOM =====
  const board = document.getElementById('board');
  const questChip = document.getElementById('questChip');
  const questName = document.getElementById('questName');
  const qCurrentEl = document.getElementById('qCurrent');
  const qTotalEl = document.getElementById('qTotal');
  const livesEl = document.getElementById('lives');
  const teaseOverlay = document.getElementById('teaseOverlay');
  const correctOverlay = document.getElementById('correctOverlay');
  const correctLine = document.getElementById('correctLine');
  const missOverlay = document.getElementById('missOverlay');

  // ===== 設定 =====
  const TEASE_DELAY_MS = 5000;
  const RESULT_FALLBACK_MS = 3000;
  const ANSWER_REVEAL_MS = 2000;
  const INITIAL_LIVES = 3;

  // レベル別問題数
  const LEVEL_QUESTIONS = { 1: 5, 2: 10, 3: 100 };

  // アンミカの全セリフは「白って200色あんねん」一本
  const VOICE = 'assets/anmika.m4a';
  const LINE_TEXT = '白って200色あんねん';

  // ===== URLパラメータからレベル・プレイヤー取得 =====
  const params = new URLSearchParams(window.location.search);
  const level = parseInt(params.get('level') || '1', 10);
  const playerId = params.get('player') || '';
  const totalQuestions = LEVEL_QUESTIONS[level] || 5;

  // ===== ゲーム状態 =====
  let currentQuestion = 1; // 1-based
  let lives = INITIAL_LIVES;
  let teaseTimer = null;
  let teaseShown = false;
  let busy = false;
  let answerTile = null;
  let currentStreak = 0;     // 現在の連続正解数
  let maxStreak = 0;         // この回の最高連続正解数

  // プレイ開始時に last_played_at 更新
  if (playerId && window.annenDB) {
    window.annenDB.touchLastPlayed(playerId);
  }

  // ===== UI更新 =====
  function renderProgress() {
    qCurrentEl.textContent = String(currentQuestion);
    qTotalEl.textContent = String(totalQuestions);
  }

  function renderLives() {
    const items = livesEl.querySelectorAll('.play-life');
    items.forEach((el, i) => {
      el.classList.toggle('play-life--lost', i >= lives);
    });
    livesEl.setAttribute('aria-label', `ライフ${lives}`);
  }

  // ===== ユーティリティ =====
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function playVoiceUntilEnd(_src, onDone) {
    // 共通アンミカ音声は audio.js の window.playAnmika に集約
    if (window.playAnmika) {
      window.playAnmika(onDone);
    } else {
      setTimeout(onDone, RESULT_FALLBACK_MS);
    }
  }

  // ===== 長考演出 =====
  function startTeaseTimer() {
    clearTimeout(teaseTimer);
    if (teaseShown) return;
    teaseTimer = setTimeout(showTease, TEASE_DELAY_MS);
  }

  function showTease() {
    if (teaseShown || busy) return;
    teaseShown = true;
    teaseOverlay.hidden = false;
    // 長考も「白って200色あんねん」音声を流す（終了+1秒で閉じる）
    playVoiceUntilEnd(VOICE, () => { teaseOverlay.hidden = true; });
  }

  // ===== 正解演出 =====
  function showCorrect() {
    busy = true;
    clearTimeout(teaseTimer);
    teaseOverlay.hidden = true;

    correctLine.textContent = LINE_TEXT;
    correctOverlay.hidden = false;

    playVoiceUntilEnd(VOICE, () => {
      correctOverlay.hidden = true;
      busy = false;
      correctCount++;
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
      advanceQuestion();
    });
  }

  // ===== ミス演出 =====
  function showMiss() {
    busy = true;
    clearTimeout(teaseTimer);
    teaseOverlay.hidden = true;

    missOverlay.hidden = false;

    playVoiceUntilEnd(VOICE, () => {
      missOverlay.hidden = true;
      // 演出が閉じた後、正解マスに赤枠表示 → 一定時間後に処理続行
      answerTile.el.classList.add('tile--answer-highlight');
      setTimeout(() => {
        answerTile.el.classList.remove('tile--answer-highlight');
        busy = false;
        currentStreak = 0; // ミスで連続正解リセット
        loseLife();
      }, ANSWER_REVEAL_MS);
    });
  }

  // ===== ゲーム進行 =====
  let correctCount = 0;

  function advanceQuestion() {
    if (currentQuestion >= totalQuestions) {
      gameClear();
      return;
    }
    currentQuestion++;
    renderProgress();
    setupQuestion();
  }

  function loseLife() {
    lives--;
    renderLives();
    if (lives <= 0) {
      gameOver();
      return;
    }
    advanceQuestion();
  }

  function saveSessionAndNavigate(type, livesOverride) {
    const savedLives = livesOverride !== undefined ? livesOverride : lives;
    if (playerId && window.annenDB) {
      window.annenDB.saveScore({
        player_id: playerId,
        level: level,
        correct_count: correctCount,
        total_questions: totalQuestions,
        consecutive_correct: maxStreak,
        cleared: type === 'clear',
      });
    }
    const qs = new URLSearchParams({
      type,
      level: String(level),
      correct: String(correctCount),
      total: String(totalQuestions),
      lives: String(savedLives),
    });
    if (playerId) qs.set('player', playerId);
    window.location.href = `result.html?${qs.toString()}`;
  }

  function gameClear() {
    saveSessionAndNavigate('clear');
  }

  function gameOver() {
    saveSessionAndNavigate('gameover', 0);
  }

  // ===== 問題セットアップ =====
  function setupQuestion() {
    board.innerHTML = '';

    let tilesData;
    if (COLORS.length >= 100) {
      tilesData = shuffle(COLORS).slice(0, 100);
    } else {
      const shuffled = shuffle(COLORS);
      tilesData = Array.from({ length: 100 }, (_, i) => shuffled[i % shuffled.length]);
    }

    const tiles = tilesData.map((c, i) => {
      const el = document.createElement('button');
      el.className = 'tile';
      el.style.backgroundColor = c.hex;
      el.dataset.index = String(i);
      el.dataset.hex = c.hex;
      el.dataset.name = c.name;
      el.addEventListener('click', () => onTileClick(el, c));
      board.appendChild(el);
      return { el, color: c };
    });

    const ansIdx = Math.floor(Math.random() * tiles.length);
    answerTile = tiles[ansIdx];
    questChip.style.backgroundColor = answerTile.color.hex;
    questName.textContent = answerTile.color.name;

    teaseShown = false;
    startTeaseTimer();
  }

  function onTileClick(el, color) {
    if (busy) return;
    clearTimeout(teaseTimer);
    if (el === answerTile.el) {
      showCorrect();
    } else {
      showMiss();
    }
  }

  // ===== 起動 =====
  renderProgress();
  renderLives();
  setupQuestion();
})();
