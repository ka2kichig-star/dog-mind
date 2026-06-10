# /lead-fetch

Places APIで「サイト無し店舗」候補を一括取得する。HAYAMISE営業の起点。

## 目的

Google Places API (New) を使って、対象エリア×業種の店舗データを取得し
`data/raw_places.json` に保存する。

## 前提

- セッション冒頭で AGENT_CONTEXT.md を読んで現状把握
- `config.py` の SEARCH_AREA / TARGET_TYPES が今回対象か必ず確認
- `.env` に GOOGLE_PLACES_API_KEY 設定済み
- `hayamise-leads/` 配下で実行

## 実行手順

1. 状態確認
   - config.py の現在設定を読み上げ
   - data/raw_places.json があれば上書き確認

2. コスト見積もり
   - 業種数 × 最大3ページ で推定リクエスト数
   - Google Cloud 無料クレジット内か確認

3. 実行
   ```
   python 01_fetch_places.py
   ```

4. 検証
   - 取得件数が想定範囲か
   - エラーログ確認
   - 重複除去後の件数報告

## 報告ルール

- 業種ごとの取得件数を箇条書き
- 合計・重複除去後の件数
- 推定コスト
- 次は /lead-score を提案

## 関連コマンド

- /lead-score（次に実行）
- /lead-loop（全工程一気に）
- /cost-check（API使用量点検）
