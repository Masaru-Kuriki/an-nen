// Supabase クライアント + DB 操作のラッパー
// 事前に supabase-js を CDN で読み込んでおくこと（HTML側）
(() => {
  const SUPABASE_URL = 'https://vhgxginmkifsdilhcbom.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZ3hnaW5ta2lmc2RpbGhjYm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NDQ5NjIsImV4cCI6MjA5NTUyMDk2Mn0.opD6K5BVvTKmlZRkTiIJFhHkGdXS79CHQRJbp81ISRI';

  // window.supabase は CDN で createClient を提供
  if (!window.supabase || !window.supabase.createClient) {
    console.error('Supabase SDK が読み込まれていません');
    return;
  }
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.annenSupabase = client;

  window.annenDB = {
    async listPlayers() {
      const { data, error } = await client
        .from('annen_players')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) { console.error(error); return []; }
      return data || [];
    },

    async getPlayer(id) {
      const { data, error } = await client
        .from('annen_players')
        .select('*')
        .eq('id', id)
        .single();
      if (error) { console.error(error); return null; }
      return data;
    },

    async createPlayer(name) {
      const { data, error } = await client
        .from('annen_players')
        .insert({ name })
        .select()
        .single();
      if (error) { console.error(error); throw error; }
      return data;
    },

    async updatePlayerName(id, name) {
      const { error } = await client
        .from('annen_players')
        .update({ name })
        .eq('id', id);
      if (error) { console.error(error); throw error; }
    },

    async touchLastPlayed(id) {
      const { error } = await client
        .from('annen_players')
        .update({ last_played_at: new Date().toISOString() })
        .eq('id', id);
      if (error) console.error(error);
    },

    async saveScore(payload) {
      // payload: { player_id, level, correct_count, total_questions, consecutive_correct, cleared }
      const { error } = await client
        .from('annen_scores')
        .insert(payload);
      if (error) console.error(error);
    },

    // ランキング = 各プレイヤーの Lv3 最高連続正解数
    async getRankings() {
      const { data, error } = await client
        .from('annen_scores')
        .select('player_id, consecutive_correct')
        .eq('level', 3);
      if (error) { console.error(error); return {}; }
      const map = {};
      for (const row of data || []) {
        const cur = map[row.player_id] || 0;
        if (row.consecutive_correct > cur) map[row.player_id] = row.consecutive_correct;
      }
      return map;
    },

    // 累計正解数（スコア表示用）
    async getTotalScores() {
      const { data, error } = await client
        .from('annen_scores')
        .select('player_id, correct_count');
      if (error) { console.error(error); return {}; }
      const map = {};
      for (const row of data || []) {
        map[row.player_id] = (map[row.player_id] || 0) + row.correct_count;
      }
      return map;
    },
  };
})();
