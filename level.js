(() => {
  const params = new URLSearchParams(window.location.search);
  const playerId = params.get('player');
  const nameEl = document.getElementById('currentPlayerName');

  // プレイヤー名を取得して表示
  if (playerId && window.annenDB) {
    window.annenDB.getPlayer(playerId).then(p => {
      if (p) nameEl.textContent = p.name;
      else { nameEl.textContent = '不明'; }
    });
  } else {
    nameEl.textContent = '未選択';
  }

  // レベルボタン押下で play.html へ
  const buttons = document.querySelectorAll('.level-card');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const level = btn.dataset.level;
      const url = playerId
        ? `play.html?level=${level}&player=${encodeURIComponent(playerId)}`
        : `play.html?level=${level}`;
      window.location.href = url;
    });
  });
})();
