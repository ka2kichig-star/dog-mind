# /lead-loop ⭐️

リード生成の全工程を一気に回す。週次営業準備のメインコマンド。

## 目的

config確認 → fetch → score → enrich → export → サマリ報告 を自動化。
これ1つで「今週の営業リスト」が完成する。

## 前提

- hayamise-leads/ で実行
- .env にAPIキー設定済み
- AGENT_CONTEXT.md に対象エリア・業種を記録

## 実行手順

1. 状況把握
   - AGENT_CONTEXT.md 読む
   - 前回 final_leads_top.csv の生成日確認
   - 過去リストとの重複営業回避

2. 設定確認
   - config.py の SEARCH_AREA / TARGET_TYPES 表示
   - 「この設定で進めて良い？」と勝貴くんに確認

3. コスト見積もり
   - 業種数 × 60件 × $0.025 程度を提示
   - 無料クレジット内か確認

4. 逐次実行
   ```
   python 01_fetch_places.py
   python 02_score_leads.py
   python 03_enrich.py
   python 04_export.py
   ```
   エラー発生時は止まって相談

5. 結果サマリ
   - 🎯営業対象 / △二次候補 / ✗除外 の件数
   - 業種別内訳
   - スコア上位10件リスト
   - 推定APIコスト

6. 次アクション提案
   - DM文面まで → /dm-batch
   - 営業代行 → /partner-brief
   - 自分で確認 → CSV開く

## 報告ルール

- 変更/生成ファイルを箇条書き
- AGENT_CONTEXT.md に実行記録追記（日付・件数・対象エリア）
- 異常値（取得0件など）は即報告

## 関連コマンド

- /dm-batch（次・DM生成）
- /partner-brief（営業代行発注）
- /weekly-review-loop（週次KPIレビュー）
- /cost-check（API使用量点検）
