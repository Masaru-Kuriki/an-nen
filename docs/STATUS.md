# STATUS

## 現在フェーズ
**v1.2 リリース完了 → 身内10人配布中（Supabase連携あり）**

## 直近の変更
- 2026-06-03: プロジェクト作成・要件定義完了
- 2026-06-04: v1 実装完了 + デプロイ
- 2026-06-05: **v1.2 プレイヤー管理 + ランキング 実装完了**
  - Supabase連携（OTETSUDAIプロジェクトに相乗り）
  - テーブル: `annen_players` / `annen_scores`
  - TOP画面動的レンダリング（追加・編集・最終遊戯日・順位・累計得点）
  - URLパラメータで `?player=ID` 持ち回り
  - プレイ終了時のスコア記録
  - 音声処理修正（unlock競合解消・10秒安全タイマー追加）

## 全画面構成
- `index.html` (TOP): プレイヤー一覧 + 追加 + 編集
- `level.html`: レベル選択（あそぶ人表示）
- `play.html`: 100マスゲーム
- `result.html`: クリア/ゲームオーバー + もう一回/やめる

## ファイル
- HTML: `index.html` / `level.html` / `play.html` / `result.html`
- JS: `top.js` / `level.js` / `play.js` / `result.js` / `click.js` / `audio.js` / `supabase.js`
- データ: `data/colors.json` / `data/colors.js` (100色)
- アセット: `assets/{normal_top,tease,happy,sad,clear,gameover,title,favicon}.png` + `anmika.m4a`

## カット仕様（意図的にスコープ外）
- **コレクション「見つけた色図鑑」**: 当てるのほぼ無理なゲーム性のため不要と判断
- ~~プレイヤー管理~~ → v1.2で実装済み
- ~~Supabase連携~~ → v1.2で実装済み

## 配布
- URL: https://masaru-kuriki.github.io/an-nen/
- リポジトリ: https://github.com/Masaru-Kuriki/an-nen
- zip: `~/Projects/reports/AN-NEN/2026-06-04/deploy/annen.zip`（自サーバーアップ用）
- Supabase: OTETSUDAIプロジェクトに相乗り（`https://vhgxginmkifsdilhcbom.supabase.co`）

## 次のチャットへの引き継ぎ手順

新しいチャットを開始したら、以下の順で読むこと。

1. `CLAUDE.md`（プロジェクト概要・ユーザー情報）
2. `REQUIREMENTS.md`（要件定義 全体像）
3. `docs/decisions/001-deployment-and-character.md`（アンミカキャラ採用と配布範囲の経緯／※法的リスク認識済み、再警告不要）
4. `docs/STATUS.md`（このファイル：現在地と次のステップ）
5. `docs/TASKS.md`（残タスク一覧）

これだけで完全に引き継げる。会話履歴は不要。

## 今後の検討事項（やるかどうか未定）

- 「もう一回」ボタンを画面遷移なしのモーダル化（音声制約完全回避したい場合）
- 画像追加圧縮
- 利用規約・プライバシーポリシー（身内配布で当面不要）
