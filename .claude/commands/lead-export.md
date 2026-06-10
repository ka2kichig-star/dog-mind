# /lead-export

スコアリング済みリードをCSV出力し、営業可能な状態にする。

## 目的

`data/enriched_leads.json` から、スプレッドシートで開けるCSVを生成。

## 前提

- /lead-score 実行済み
- 望ましくは /lead-enrich（03_enrich.py）も実行済み

## 実行手順

1. enrichment確認
   - data/enriched_leads.json なければ `python 03_enrich.py` 先に実行

2. CSV出力
   ```
   python 04_export.py
   ```

3. 出力ファイル確認
   - data/final_leads.csv（全件）
   - data/final_leads_top.csv（営業対象のみ）
   - UTF-8 BOM付き出力で文字化けないか確認

4. オプション
   - スプレッドシートにアップロード手順案内（勝貴くん希望時）

## 報告ルール

- 出力ファイルパス + 件数
- トップ10件を表形式で報告
- Excel開封時の注意点
- 次は /dm-batch または手動営業開始

## 関連コマンド

- /lead-score（前提）
- /dm-batch（次・DM生成まで）
- /partner-brief（営業代行に渡す場合）
