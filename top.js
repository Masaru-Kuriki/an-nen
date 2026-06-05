(() => {
  const grid = document.getElementById('cardGrid');
  const DB = window.annenDB;

  function formatDate(iso) {
    if (!iso) return '未プレイ';
    const d = new Date(iso);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${m}/${day}`;
  }

  function computeRanks(rankings) {
    // rankings: { player_id: max_consecutive_correct }
    // 連続正解数の降順で順位を付ける、同点は同順位
    const entries = Object.entries(rankings).filter(([_, v]) => v > 0);
    entries.sort((a, b) => b[1] - a[1]);
    const rankMap = {};
    let prevValue = null;
    let prevRank = 0;
    entries.forEach(([id, value], idx) => {
      const rank = value === prevValue ? prevRank : idx + 1;
      rankMap[id] = rank;
      prevValue = value;
      prevRank = rank;
    });
    return rankMap;
  }

  function renderCard(player, rankMap, totalScores) {
    const rank = rankMap[player.id];
    const score = totalScores[player.id] || 0;
    const card = document.createElement('a');
    card.className = 'player-card';
    card.href = `level.html?player=${encodeURIComponent(player.id)}`;
    card.innerHTML = `
      <button class="card-edit" type="button" aria-label="名前を編集">✎</button>
      <div class="card-name"></div>
      <div class="card-meta">
        <div class="card-last">最終: ${formatDate(player.last_played_at)}</div>
        <div class="card-rank">${rank ? rank + '位' : '—'}</div>
        <div class="card-score">${score.toLocaleString()}点</div>
      </div>
    `;
    card.querySelector('.card-name').textContent = player.name;

    const editBtn = card.querySelector('.card-edit');
    editBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newName = prompt('新しい名前を入力してください', player.name);
      if (!newName || newName.trim() === '') return;
      try {
        await DB.updatePlayerName(player.id, newName.trim());
        await load();
      } catch (err) {
        alert('名前の更新に失敗しました');
      }
    });

    return card;
  }

  function renderAddCard() {
    const btn = document.createElement('button');
    btn.className = 'player-card player-card--add';
    btn.type = 'button';
    btn.innerHTML = `
      <span class="card-add-icon">+</span>
      <div class="card-add-label">追加</div>
    `;
    btn.addEventListener('click', async () => {
      const name = prompt('プレイヤーの名前を入力してください');
      if (!name || name.trim() === '') return;
      try {
        await DB.createPlayer(name.trim());
        await load();
      } catch (err) {
        alert('プレイヤーの作成に失敗しました');
      }
    });
    return btn;
  }

  async function load() {
    grid.innerHTML = '<div class="card-loading">読み込み中...</div>';
    try {
      const [players, rankings, totalScores] = await Promise.all([
        DB.listPlayers(),
        DB.getRankings(),
        DB.getTotalScores(),
      ]);
      const rankMap = computeRanks(rankings);
      grid.innerHTML = '';
      for (const p of players) {
        grid.appendChild(renderCard(p, rankMap, totalScores));
      }
      grid.appendChild(renderAddCard());
    } catch (err) {
      console.error(err);
      grid.innerHTML = '<div class="card-loading">読み込みに失敗しました</div>';
    }
  }

  load();
})();
