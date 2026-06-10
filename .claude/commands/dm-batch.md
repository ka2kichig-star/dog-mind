# /dm-batch ⭐️

リードCSVを読み込み、業種別・パーソナライズされたDM文面を一括生成する。

## 目的

`data/final_leads_top.csv` を読み込み、各店舗向けにInstagram DM文面を
Anthropic API（Claude）で生成、`data/final_leads_with_dm.csv` に出力。

## 前提

- /lead-loop または /lead-export 実行済み
- .env に ANTHROPIC_API_KEY 設定済み
- hayamise-leads/ 配下で実行

## 守るべき文面ルール

- 営業臭を抑える、相手のお店を褒めることから始める
- 押し付けがましくしない
- ゴールは「無料相談」（いきなり契約は求めない）
- 200文字以内、改行を効果的に
- 絵文字は1-2個まで
- 「初期費用0円・月¥2,200〜」のフックは必ず入れる
- 業種別に話し口を変える（美容室/飲食/整体など）

## 実行手順

1. 入力確認
   - data/final_leads_top.csv の件数表示
   - 営業対象（60点以上）のみが対象か再確認

2. コスト見積もり
   - 件数 × $0.003 程度（Claude Sonnetの場合）
   - 大量生成時は分割確認

3. 実行
   ```
   python 05_generate_dm.py
   ```

4. 品質チェック
   - サンプル3件を目視確認
   - 文面に違和感ないか
   - パーソナライズ要素（店名・業種）が正しく入っているか

5. CSV出力確認
   - data/final_leads_with_dm.csv が生成されている
   - DM文面カラムが全件埋まっている

## 報告ルール

- 生成件数 + 推定コスト（$）
- サンプル3件をブロックで提示
- 違和感ある文面があれば指摘
- 次は手動送信 or /partner-brief で代行発注

## 関連コマンド

- /lead-loop（前提・リード生成）
- /partner-brief（代行に渡す場合）
- /threads-post（生成DMを参考にThreads投稿化も可能）
