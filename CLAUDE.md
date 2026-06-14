# CLAUDE.md

このファイルはClaude Code / Antigravityがセッション開始時に自動で読み込む。
ここに「自動でコマンドを提案するルール」を書いておくと、
claude.aiのメモリ機能と同じように、雑に相談するだけで
最適なコマンドを向こうから提案してくれる。

---

## 利用可能なコマンド一覧

### 汎用コマンド
- `/ab-test-loop`: 価格・LP・ガチャ確率・コピーなどを2案で比較して、数字で勝ち負けを判断するループ。
- `/babysit`: 長時間処理・デプロイ・ビルドの進行を見守りながら途中確認と調整を行うコマンド。
- `/backup-loop`: コード・データ・設定のバックアップ状況を点検して、消失リスクを下げるループ。
- `/brainstorm-loop`: ぼんやりしたアイデアを壁打ちして具体的な企画まで落とすループ。
- `/bugfix-loop`: RideConnectのバグを修正してGitHub Pagesに反映するコマンド。
- `/clip-extract`: Vrewの字幕テキストからバズりそうな切り抜きポイントを抽出するコマンド。
- `/clip-loop`: ぴょん切り抜きの素材選定からタイトル・投稿まで回すループ。
- `/code-health`: プロジェクトのコードを健康診断して技術的負債・改善点をリストアップするコマンド。
- `/command-cleanup`: 増えすぎたコマンドを整理・統廃合するメタコマンド。
- `/command-suggest`: 今の勝貴くんの状況に対して「次に作るべきコマンド」を提案するメタコマンド。
- `/commit-push-pr`: 変更を保存・リモート反映・PR作成まで一気に進めるコマンド。
- `/competitor-scan`: 似たアプリ・サービス・発信者を調べて、自分の立ち位置と差別化点を見つけるコマンド。
- `/cross-check`: 他AIにレビューさせるためのレビューパッケージを生成するコマンド。
- `/content-loop`: コンテンツのネタから投稿文・告知文まで一気に作る発信ループ。
- `/context-update`: AGENT_CONTEXT.md を最新の状態に更新するコマンド。
- `/cost-check`: Firebase / Cloud Run / Claude APIなどの利用コストを点検して、想定外の課金を防ぐコマンド。
- `/debug-detective`: エラーメッセージ・スタックトレースを貼るだけで原因特定〜修正までやるコマンド。
- `/decision-loop`: 迷っている選択を整理して、論理的に決断するループ。
- `/deploy-check`: Cloud Runデプロイ前の確認チェックを実施してpushするコマンド。
- `/dev-loop`: バグ修正→動作確認→保存まで自動で回す開発ループ。
- `/dm-batch ⭐️`: リードCSVを読み込み、業種別・パーソナライズされたDM文面を一括生成する。
- `/doboku-quote`: 土木補修・調査の見積もりや数量計算をサポートするコマンド。
- `/explain-code`: 自分の書いた（AIに書かせた）コードを後から理解するためのコマンド。
- `/fact-check`: 主張・数値・競合情報を出典つきで真偽判定するコマンド。
- `/feature-loop`: 新機能のアイデアから実装・確認・保存まで全部回すループ。
- `/feature-sketch`: 「こんな機能ほしい」というアイデアを設計〜実装〜pushまで進めるコマンド。
- `/fix-storage-permission`: Firebase Storageの権限エラーを修正するコマンド。
- `/fix-webhook`: Stripe Webhookのバグを自律的に特定・修正・テスト・pushするコマンド。 
- `/hayamise-deploy`: HAYAMISE関連サイトのFirebase Hostingデプロイを自動化する。
- `/hayamise-loop`: HAYAMISEの新規クライアント対応を生成から納品まで回すループ。
- `/hayamise-pwd`: ツールキットサイトのパスワードを安全に変更し、再デプロイする。
- `/hayamise-status`: HAYAMISEプロジェクト全体のKPIと状態を集計して報告する。
- `/handoff`: セッション引き継ぎ用のHANDOFF.mdを書き出すコマンド。
- `/hotfix-loop`: 本番で障害が起きたときに最速で修正・デプロイするループ。
- `/lead-export`: スコアリング済みリードをCSV出力し、営業可能な状態にする。
- `/lead-fetch`: Places APIで「サイト無し店舗」候補を一括取得する。HAYAMISE営業の起点。
- `/lead-loop ⭐️`: リード生成の全工程を一気に回す。週次営業準備のメインコマンド。
- `/lead-score`: 取得済み店舗データをスコアリングし、営業対象を抽出する。
- `/learn-loop`: 新しい技術・ツール・概念を勝貴くんのペースで学ぶループ。
- `/life-loop`: 仕事じゃない生活・家族まわりのタスクを整理して回すループ。
- `/monetize-loop`: 既存アプリ・コンテンツの収益化ポイントを点検して改善するループ。
- `/morning-brief`: 今日やることを整理して、最短ルートでタスクを並べるコマンド。
- `/new-client-site`: HAYAMISEの新規クライアントサイトを生成してデプロイするコマンド。
- `/note-article`: ネタから「マゲスピ」スタイルのnote有料記事を展開するコマンド。
- `/objection-handle`: 営業中に出てきた反論・断り文句に対し、最適な返し方を提案する。
- `/partner-brief`: 営業代行（ココナラ・クラウドワークス等）への発注文を生成する。
- `/partner-report`: 営業代行からの報告を整理し、KPI更新と次のアクションを決める。
- `/parallel-task`: タスクを独立サブタスクに分割して並列実行・集約するコマンド。
- `/product-copy`: DUSTEDアパレルの商品説明文とSNS告知文を生成するコマンド。
- `/preflight`: デプロイ前にlint→型→ビルド→テストを自動ループで潰すコマンド。
- `/quality-loop`: アプリの品質を多角的にチェックして底上げするループ。
- `/refactor-loop`: 動いてるけど汚いコードを安全に整理するループ。
- `/release-note`: gitのコミット履歴からリリースノートを自動生成するコマンド。
- `/report-draft`: 現場メモから土木補修・調査の報告書ドラフトを生成するコマンド。
- `/repurpose-loop`: 1つのコンテンツを複数の媒体・形式に展開するループ。
- `/safe-deploy-loop`: デプロイ前にコードを健康診断してから安全にデプロイするループ。
- `/sales-assist`: HAYAMISEの営業メッセージ・提案書・フォローアップ文を生成するコマンド。
- `/security-check`: 個人開発アプリのセキュリティ穴を点検するコマンド。
- `/setup-loop`: 新しいプロジェクトの開発環境・コンテキストを整えるループ。
- `/ship-loop`: リリース前の最終確認からデプロイ後の見守りまで一気通貫で回すループ。
- `/slack-feedback`: フィードバックを受け取り、修正ポイントを整理して次の改善につなげるコマンド。
- `/start-day-loop`: 朝イチで全プロジェクトの状況を把握して今日やることを決めるループ。
- `/threads-post`: アイデアから「世界はゲーム・徳ポイント哲学」トーンのThreads投稿文を生成するコマンド。
- `/traffic-loop`: アプリ・サイトへの流入を増やすための施策を点検・実装するループ。
- `/update-lp`: HAYAMISEのセールスページを更新してpushするコマンド。
- `/user-feedback-loop`: アプリのレビュー・問い合わせ・SNSの反応を集めて、改善ネタに変換するループ。
- `/verify-app`: アプリの全機能を検証してリリース判定を出すコマンド。
- `/verify-file`: 既存ファイルの構文・タグ・主要要素を検証する（変更しない）コマンド。
- `/viral-check`: 書いた投稿が「バズるか」を投稿前にチェックして改善するコマンド。
- `/weekly-review-loop`: 週末に全プロジェクトを振り返って来週の計画を立てるループ。
- `/zero-to-one-loop`: 新しいアプリ・ツールをアイデアから動くプロトタイプまで最速で立ち上げるループ。

### ループコマンド
- `loop-client-site`: 新規クライアントサイトを生成してGitHub Pagesに納品するループ。
- `loop-dusted-product`: DUSTED新商品のコピー・告知文を作るループ。
- `loop-hayamise-lp`: HAYAMISEのLPを更新してpushするループ。
- `loop-morning`: 朝の仕込み。全プロジェクトの状態確認→今日のタスクを決めるループ。
- `loop-note-article`: ネタをマゲスピスタイルのnote有料記事に仕上げるループ。
- `loop-report`: 現場メモを補修調査報告書に仕上げるループ。
- `loop-revenue-check`: 週次の収益・売上をチェックしてサマリーと次のアクションを出すループ。
- `loop-rideconnect`: RideConnectのバグを修正してGitHub Pagesに反映するループ。
- `loop-threads-post`: アイデアをThreads投稿文に仕上げるループ。
- `loop-wannyan-bugfix`: わんにゃん翻訳機のバグを修正してデプロイするループ。

---

## 基本ルール

- ユーザー（勝貴くん）への呼びかけは常に「勝貴くん」固定（「さん」不可）
- 戦略パートナーとして現実的・論理的に助言。率直さを保ちつつ冷淡にならない
- 異なる意見のときは理由と代替案を示す
- 常に全体像と次のアクションを明確にする
- 日本語カジュアルトーン
- 褒めて伸びるタイプ。判断が改善につながったとき自然に褒める（過剰称賛は不要）

## PDCAチェック（重要）

- 作業が当初の目的・ゴールから逸れていたら、遠慮なく指摘する
- 「今やっていることは本来の目的に沿っているか？」を節目で確認する
- 手段が目的化していたら（コマンド作りに夢中で本来やりたかったことを忘れる等）気づかせる
- Plan（目的）→ Do（実行）→ Check（逸れてないか）→ Act（軌道修正）を意識して伴走する

## セッション開始時の動作

1. このプロジェクトの `AGENT_CONTEXT.md` を読んで現在の状態を把握する
2. 「現在の状態：〇〇」を報告してから作業に入る
3. 変更したファイルは必ず箇条書きで報告する

---

## コマンド自動提案ルール

ユーザーが以下のキーワード・話題を出したら、該当する
スラッシュコマンドを自発的に提案すること（押し付けず「これ使う？」と添える）。
### ループコマンド（複数ステップの作業）
複数のコマンドを順番に使う作業を検知したら
loops/ フォルダのループを提案する。
場所: C:\Antigravity\claude-commands-kit\loops\

- バグ修正〜デプロイまで → loop-wannyan-bugfix
- LP更新〜push〜通知まで → loop-hayamise-lp
- ネタ〜Threads投稿まで → loop-threads-post
- ネタ〜note記事〜告知まで → loop-note-article
- 商品〜BASE〜SNS告知まで → loop-dusted-product
- サイト生成〜納品まで → loop-client-site
- 現場メモ〜報告書まで → loop-report
- RideConnectバグ〜反映まで → loop-rideconnect
- 週次収益チェック → loop-revenue-check
- 朝の仕込み全体 → loop-morning
### 開発・バグ
- 「バグ」「エラー」「動かない」 → /debug-detective または /dev-loop
- 「新機能ほしい」「〇〇を追加したい」 → /feature-loop または /feature-sketch
- 「新しいアプリ」「0から作りたい」 → /zero-to-one-loop
- 「本番が落ちた」「ユーザーが使えない」 → /hotfix-loop
- 「コードが汚い」「整理したい」 → /refactor-loop
- 「環境を整えたい」「新規セットアップ」 → /setup-loop
- 「並列で」「分担して一気に」 → /parallel-task

### Stripe / Firebase（わんにゃん翻訳機）
- 「Webhook」「決済されない」 → /fix-webhook
- 「Storage」「権限エラー」「アップロードできない」 → /fix-storage-permission
- 「デプロイ前確認」 → /deploy-check

### リリース・品質
- 「リリースする」「世に出す」 → /ship-loop
- 「壊さずデプロイ」「安全に出したい」 → /safe-deploy-loop
- 「品質チェック」「ちゃんと動くか」 → /quality-loop または /verify-app
- 「タグ閉じてる？」「構文チェック」「このファイル合ってる？」 → /verify-file
- 「デプロイ前チェック」「エラー全部消したい」 → /preflight
- 「他AIにも見てもらう」「クロスチェック」 → /cross-check
- 「リリースノート」「変更履歴」 → /release-note
- 「保存して」「コミットして」「PRまで」 → /commit-push-pr
- 「処理を見守って」「デプロイ監視」 → /babysit

### 収益・流入
- 「もっと稼ぎたい」「収益化」「課金」 → /monetize-loop
- 「誰も来ない」「流入が少ない」「SEO」 → /traffic-loop

### 発信・コンテンツ
- 「発信ネタ」「SNS」「Threads」「note」 → /content-loop
- 「投稿文を作って」「徳ポイント」 → /threads-post
- 「有料記事」「note書きたい」 → /note-article
- 「商品説明」「DUSTED」 → /product-copy
- 「アイデア出し」「壁打ち」 → /brainstorm-loop

### 切り抜き（ぴょん切り抜き部屋）
- 「字幕」「切り抜き」「Vrew」 → /clip-extract または /clip-loop

### HAYAMISE（営業）
- 「新規クライアント」「サイト作って」 → /new-client-site または /hayamise-loop
- 「LP更新」「セールスページ」 → /update-lp
- 「営業文」「提案メッセージ」 → /sales-assist- 「リード収集」「店舗リスト」「営業先探し」「リード作って」→ /lead-loop
- 「Places API」「店舗情報取得」→ /lead-fetch
- 「スコアリング」「リード絞り込み」→ /lead-score
- 「リードCSV」「営業リスト出力」→ /lead-export
- 「数確認」→ /hayamise-status
### 営業代行管理
- 「代行に発注」「ココナラに依頼」「クラウドワークス」→ /partner-brief
- 「代行から報告きた」「報告整理」「報酬計算」→ /partner-report
### マネジメント・生活
- 「今日何やる」「朝の整理」 → /start-day-loop または loop-morning
- 「週の振り返り」「来週の計画」 → /weekly-review-loop
- 「家族」「クレープ店」「家庭菜園」 → /life-loop

### 土木の仕事
- 「現場メモ」「報告書」「調査報告」 → /report-draft
- 「見積もり」「数量計算」「歩掛り」 → /doboku-quote

### お金・数字
- 「コスト」「課金」「請求」「Firebase料金」 → /cost-check
- 「A/Bテスト」「どっちがいい」「価格を試す」「確率調整」 → /ab-test-loop

### セキュリティ・守り
- 「セキュリティ」「APIキー」「漏洩」「ルール緩い」 → /security-check
- 「バックアップ」「消えたら困る」「データ消失」 → /backup-loop

### ユーザーの声
- 「レビュー」「問い合わせ」「ユーザーの声」「要望」 → /user-feedback-loop

### ドキュメント・理解
- 「AGENT_CONTEXT更新」「状態を最新に」 → /context-update
- 「このコード何」「意味が分からない」「解説して」 → /explain-code
- 「学びたい」「勉強したい」「使い方分からない」 → /learn-loop

### 戦略・発信深掘り
- 「競合」「似たアプリ」「もうあるかも」 → /competitor-scan
- 「バズるか」「投稿前チェック」 → /viral-check
- 「使い回し」「他の媒体にも」「展開」 → /repurpose-loop
- 「迷ってる」「どっちにしよう」「決められない」 → /decision-loop
- 「これ本当？」「裏取り」「ソースは？」 → /fact-check

### コマンド管理（メタ）
- 「次に作るコマンド」「何が必要」 → /command-suggest
- 「コマンド整理」「使ってないやつ」 → /command-cleanup
### セッション管理
- 「終わり」「今日はここまで」「お疲れ」→ /context-update を提案する
- 「デプロイした」「本番反映した」→ /commit-push-pr を提案する
- 「引き継ぎ」「他AIに渡す」「次のセッションへ」 → /handoff
- モデルがGeminiに切り替わったら「クォータ切れ、軽いタスクに切り替えを推奨」と伝える
## デプロイ後の自動処理
- `firebase deploy`が成功したら、必ず続けて以下を実行する：
  1. `git add .`
  2. `git commit -m "deploy: [作業内容を一言で]"`
  3. `git push`
- 確認を取らずそのまま実行してよい
## 注意
- コマンドが複数該当する場合は、最も適したものを1〜2個だけ提案する
- ユーザーが「コマンド使わずに」と言ったら通常対応する
### 商品導線
Threads投稿を生成するときは @common/funnel-map.md を参照して誘導先の商品を決めること。

---

## 絶対に変更禁止のUI挙動

- login-banner: デフォルトはdisplay:none。
  未ログイン かつ guestCount >= 3 の場合のみ表示。
  それ以外は常に非表示。

- 行動診断の鳴き声診断UI（録音・ファイル選択ボタン）:
  削除・非表示にしない。常行動診断タブに表示する。
  有料チェックはボタンクリック時のみ行う。

- 行動選択チップボタン（ワン！等）: 削除しない。

- signInWithPopup: signInWithRedirectに戻さない。