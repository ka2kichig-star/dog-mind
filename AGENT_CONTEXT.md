# 🤖 AGENT_CONTEXT.md — わんにゃん翻訳機 開発コンテキスト (最新版)

本ドキュメントは、「わんにゃん翻訳機」の現在の実装状態、技術スタック、ファイル構成、設計ルール、Firestore構成、および開発ルールを完全に反映した最新の開発コンテキストです。
次のセッションを担当するAIエージェントが、迷うことなく即座に機能追加やデバッグ作業を開始できるように、具体的なコード構造や規則を含めて詳細にまとめています。

---

## 1. プロジェクト概要
- **アプリ名**: わんにゃん翻訳機（ワークスペース/リポジトリ名は `わんわん翻訳機`）
- **サービス説明**: AI（Claude）が愛犬・愛猫の気持ちを代弁するエンターテインメントWebアプリケーション。写真からの感情診断、仕草に基づいた行動診断、双方向チャット機能、および旅立ったペットとの思い出を記録する「虹の橋」メモリアル機能を備えています。
- **ターゲットユーザー**: 犬や猫の飼い主、ペットとの絆を深めたい人、およびペットロスで悲しみを抱え、思い出を振り返りたい飼い主。
- **公開URL**:
  - **Firebase Hosting (メイン本番URL)**: `https://wanwan-translator.web.app` (または `https://wanwan-translator.firebaseapp.com`)
  - **Netlify**: Netlify Drop 経由でフロントエンド（`public/` フォルダ内の静的ファイル）をデプロイ可能です。
- **開発ステータス**: プロクションリリース済み。本番運用を行いつつ、WebView対策やUI微調整等のメンテナンスを継続中。

---

## 2. 技術スタック
- **フロントエンド構成**: Vanilla HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+ / Fetch API)。
  - ビルド不要のシングルページアプリケーション (SPA) 構造です。
- **Firebase構成 (プロジェクトID: `wanwan-translator`)**:
  - **Firebase Auth**: Googleアカウント認証を使用。履歴や虹の橋データのユーザー同期に使用します。
  - **Cloud Firestore**: アプリのデータ管理（ユーザー情報、診断履歴、虹の橋ペット情報、チャット履歴、お問い合わせ等）。
  - **Cloud Storage**: 写真診断の履歴用画像および虹の橋メモリアル画像のアップロード・保管用。
  - **Firebase Cloud Messaging (FCM)**: 命日や誕生日のプッシュ通知配信用。
  - **Firebase Hosting**: フロントエンドの静的ファイル配信。
- **外部CDN・ライブラリ一覧**:
  - **Firebase Web SDK v10.7.0**: CDN経由で `app`, `auth`, `firestore`, `storage`, `messaging` をインポート。
  - **Google Fonts**: `Zen Maru Gothic` (ウェイト: 400, 500, 700, 900) を使用。
  - **Stripe SDK**: サブスクリプションおよび都度払いのクレジットカード決済用。
  - **Claude API (Anthropic SDK)**: `functions/` 内で `@anthropic-ai/sdk` (Node.js) を介し、`model: "claude-sonnet-4-5"` を使用。
  - **Nodemailer / SMTP**: お問い合わせ新規作成時の自動メール送信。
- **PWA (Progressive Web App) 対応状況**: 対応済み。
  - **マニフェスト**: `public/manifest.json` による portrait 縦固定、スタンドアロン表示 (`standalone`)、テーマカラー設定。
  - **サービスワーカー (PWAキャッシュ)**: `public/sw.js` によるキャッシュファースト制御。HTML、画像、アセットのキャッシュ、およびオフライン時の `#offline-banner` 表示。
  - **FCMプッシュ通知**: `public/firebase-messaging-sw.js` によるバックグラウンドプッシュ通知の受信対応。

---

## 3. ファイル構成
ワークスペースの主要ファイルの配置と役割は以下の通りです。

```
.
├── public/                     # フロントエンド静的アセット (Firebase Hosting / Netlify 対象)
│   ├── index.html              # メインアプリケーション。すべての画面（通常モード・虹の橋モード）、タブUI、およびフロントJSロジックを統合したコアファイル
│   ├── lp.html                 # アプリ紹介のランディングページ
│   ├── cancel.html             # 月額プランのサブスクリプション解約フォーム
│   ├── contact.html            # お問い合わせ入力フォーム（Firestore の contacts コレクションに保存）
│   ├── terms.html              # 利用規約・特定商取引法に基づく表記
│   ├── privacy.html            # プライバシーポリシー
│   ├── maintenance.html        # メンテナンス中表示画面
│   ├── manifest.json           # PWA マニフェスト設定ファイル
│   ├── sw.js                   # フロントエンドアセットキャッシュ制御用サービスワーカー
│   ├── firebase-messaging-sw.js # Firebase Cloud Messaging (FCM) バックグラウンドプッシュ通知用SW
│   └── (アイコン・アセット類)
│
├── functions/                  # Firebase Cloud Functions バックエンド (Node.js 20)
│   ├── index.js                # API / Stripe Webhook / お問い合わせ通知等の全エンドポイントとロジック
│   └── package.json            # バックエンド用依存モジュール（@anthropic-ai/sdk, stripe, nodemailer 等）
│
├── firestore.rules             # Cloud Firestore セキュリティルール
├── storage.rules               # Cloud Storage セキュリティルール
├── firebase.json               # Firebase 全体設定（Hostingリライトルール `/memorial/**` などを定義）
├── .firebaserc                 # Firebase プロジェクトエイリアス指定
├── patch_index.py              # HTMLファイル内のバグ修正・UIパッチ適用自動化スクリプト (Python)
├── patch_index.ps1             # 同パッチ処理の PowerShell 版
└── check_lines.ps1             # デバッグ・ラインカウント確認用スクリプト
```
*※注: `404.html` は Netlify Drop の指定ファイルに挙げられる場合がありますが、現在プロジェクトのファイル構成内には存在しません。*

---

## 4. 実装済み機能一覧

### 4-1. 通常モード（今いる子の診断）
1. **写真で診断 (📷 写真診断タブ)**:
   - クライアント側で画像を `1024x1024 / quality 0.8` にリサイズ・圧縮し、base64形式で送信。
   - バックエンドの `claudeProxy` (`claude-sonnet-4-5`) で写真の表情や姿勢を解析。
   - 感情分析結果（今の気持ち、感情メーター、ペット目線の心の声、アドバイス）を出力。
2. **行動で診断 (🐾 行動診断タブ)**:
   - 犬・猫それぞれの代表的な行動チップス（仕草や鳴き声など）を複数選択し、状況（任意テキスト）を入力して感情や心の声を診断。
3. **ペットと会話 (💬 会話タブ)**:
   - ペットの名前、性別、品種（犬種・猫種）情報を同期し、ペットの性格やキャラクターに合わせた口調で双方向チャットを行う。
4. **診断履歴 (📖 診断履歴タブ)**:
   - Firestoreの `users/{uid}/history` から過去20件の診断データを降順で取得して表示。
   - 過去の診断結果（テキストおよび Storage に保存された画像）をアコーディオン形式で展開可能。

### 4-2. 虹の橋モード（旅立った子への寄り添い）
1. **ペット登録 (🐾 子たちタブ)**:
   - 旅立ったペットのプロフィール（名前、種類（犬/猫/鳥/うさぎ/その他）、生年月日、旅立った日、性格、好きだったもの、思い出エピソード、複数写真）を登録・管理。
2. **思い出のアルバム (📸 アルバムタブ)**:
   - 登録写真をグリッド表示。写真をタップすると「写真代弁モーダル」が開き、その瞬間にあの子が思っていたことをAIが代弁。写真ごとに一言コメントを追加保存可能。
3. **虹の橋との会話 (💌 会話タブ)**:
   - 旅立ったペットの性格や思い出のコンテキストを持たせたAIとチャット会話。過去のメッセージは Firestore に保存され、日付ごとに「日記（過去の会話）」としてグルーピング表示される。
4. **メモリアルページ (🕯 メモリアルタブ)**:
   - 旅立った子のプロフィールや思い出エピソード、写真を美しくレイアウトした記念碑的ページ。
   - SNS等でシェアするための専用URL（`/memorial/{petId}`）の生成およびクリップボードコピー（または `navigator.share`）に対応。
5. **記念日検知**:
   - ログイン時に登録ペットの「誕生日」または「命日」が今日であるかを検知。画面上部にバナーを表示し、プッシュ通知で知らせる。

### 4-3. 決済・クレジット制御機能
- **フリートライアル枠**: Googleログインしたユーザーは、登録後7日間、1日3回まで無料で診断可能。
- **都度払い (チケット制)**: クレジットカード（Stripe）経由で1回80円で診断権（`perUseCredits`）を購入。
- **月額プラン (サブスクリプション)**: 月額480円でクレジットカード（Stripe）経由で加入。月100回まで診断が使い放題になる。
- **Stripe Webhook連携**: 決済完了や継続、解約イベントを受け取り、Firestore のクレジット数やアクティブフラグを即時更新。
- **解約処理**: `cancel.html` から期末の自動解約（サブスクリプション更新無効化）を予約。
- *※注意: 虹の橋モードの機能は完全無料で利用可能です。*

### 4-4. システム管理＆セーフティ
- **メンテナンスモード**: Firestore上の設定変更で、一般ユーザーを強制的に `maintenance.html` にリダイレクト。
- **システムお知らせバナー**: Firestoreから全画面上部に動的に赤色のお知らせメッセージを配信。
- **SNS WebView制限対策**: LINE, Instagram, Threads, Twitter等のアプリ内ブラウザ（Google OAuth制限環境）を検出した際、外部ブラウザへの誘導モーダル（URLコピー機能付き）を強制表示。
- **プライベートモード制限対策**: Safari, Firefoxのプライベートモード、およびChromeのシークレットモードを検知した際、Googleログインやログイン状態の保持ができない制限について警告モーダルを強制表示。
- **アカウント停止 (BAN)**: Firestoreで `isBanned: true` とされたユーザーのアクセス制限および強制ログアウト。


---

## 5. Firestoreコレクション一覧

Firestoreにおける全ドキュメントとフィールドの構成は以下の通りです。

### 1. `users` コレクション
- **パス**: `/users/{uid}`
- **用途**: ユーザーの登録情報、クレジット残高、契約中のサブスクリプション情報の管理。
- **主なフィールド**:
  - `registeredAt` (timestamp): ユーザーの初期登録日時。
  - `lastUsedDate` (string): 最後に診断機能を利用した日付 (`YYYY-MM-DD`)。
  - `todayCount` (number): `lastUsedDate` における診断回数（お試し期間中・月額カウント用）。
  - `usageCount` (number): 累計の利用回数。
  - `perUseCredits` (number): 購入済みの都度払い診断チケットの残り枚数。
  - `monthlyPlanActive` (boolean): 月額サブスクリプションが有効かどうか。
  - `monthlyPlanExpiry` (timestamp): 月額プランの有効期限。
  - `subscriptionStatus` (string): サブスクリプションの状態（`active` / `canceled`）。
  - `subscriptionPlan` (string): 契約プラン名。
  - `stripeSubscriptionId` (string): Stripe側のサブスクリプションID。
  - `stripeSessionId` (string): StripeのチェックアウトセッションID。
  - `monthlyCount` (number): 月内でのサブスク利用回数。
  - `monthlyLimit` (number): 月内の利用上限（デフォルト: 100）。
  - `lastUsedMonth` (string): 最後に利用した月 (`YYYY-MM`)。
  - `monthlyPlanCancelScheduled` (boolean): 期末解約が予約されているか。
  - `cancelAtPeriodEnd` (timestamp): 期末解約が予定されている日時。
  - `isBanned` (boolean): 利用停止（BAN）状態フラグ。

#### 子コレクション: `history`
- **パス**: `/users/{uid}/history/{historyId}`
- **用途**: 写真診断・行動診断の過去ログ保存（最大20件制限で古い順に自動削除）。
- **主なフィールド**:
  - `type` (string): 診断タイプ（`photo` / `behavior`）。
  - `species` (string): ペットの種別（`dog` / `cat`）。
  - `name` (string): ペットの名前。
  - `breed` (string): 品種。
  - `gender` (string): 性別 (`male` / `female`)。
  - `photoUrl` (string): 診断された画像の Cloud Storage URL (写真診断のみ)。
  - `resultText` (string): Claudeの回答テキスト全文。
  - `createdAt` (timestamp): 診断日時。

### 2. `memorials` コレクション
- **パス**: `/memorials/{uid}/pets/{petId}`
- **用途**: 旅立ったペットのプロフィールやアルバム写真、コメントの管理。（全ユーザー読み取り可能）。
- **主なフィールド**:
  - `name` (string): ペットの名前。
  - `type` (string): ペットの種類（`犬`, `猫`, `鳥`, `うさぎ`, `その他`）。
  - `birthday` (string): 生年月日 (`YYYY-MM-DD` 形式)。
  - `passedDate` (string): 旅立った日 (`YYYY-MM-DD` 形式)。
  - `personality` (string): 性格や特徴。
  - `favorites` (string): 好きだったものや行動。
  - `memories` (string): 大切な思い出のエピソード。
  - `photos` (array of string): Storageにアップロードされた画像のダウンロードURLの配列。
  - `photoComments` (map / object): アルバム画像ごとの一言コメント。キーは画像のインデックス（例: `0`, `1`）、値はコメント文字列。
  - `createdAt` (timestamp): 登録日時。

### 3. `memorial_chats` コレクション
- **パス**: `/memorial_chats/{uid}/{petId}/messages/{messageId}`
- **用途**: 虹の橋のペットとのチャット会話履歴。
- **主なフィールド**:
  - `role` (string): 送信者ロール (`user` / `assistant`)。
  - `content` (string): チャット内容メッセージ。
  - `createdAt` (timestamp): メッセージ送信日時。

### 4. `pendingPayments` コレクション
- **パス**: `/pendingPayments/{paymentId}`
- **用途**: 決済処理中のトランザクション一時保持（Functions専用）。

### 5. `fcmTokens` コレクション
- **パス**: `/fcmTokens/{uid}`
- **用途**: ユーザーデバイスの FCM トークン管理（命日や誕生日通知用）。
- **主なフィールド**:
  - `token` (string): FCM登録トークン。
  - `updatedAt` (timestamp): トークン更新日時。

### 6. `stripeEvents` コレクション
- **パス**: `/stripeEvents/{eventId}`
- **用途**: Stripe Webhookから受信したイベント処理ログ。二重処理防止に利用（管理者のみアクセス可）。
- **主なフィールド**:
  - `processedAt` (timestamp): 処理完了日時。
  - `uid` (string): 対象ユーザーのUID。
  - `plan` (string): 決済プラン。
  - `eventType` (string): Stripeのイベントタイプ名。

### 7. `system` コレクション
- **パス**: `/system/config`
- **用途**: アプリ全体のシステム設定フラグ管理（全員閲覧可能、管理者のみ書き込み可能）。
- **主なフィールド**:
  - `maintenanceMode` (boolean): メンテナンスモード有効フラグ。
  - `announcementBannerText` (string): システムお知らせバナーの表示テキスト。

### 8. `contacts` コレクション
- **パス**: `/contacts/{contactId}`
- **用途**: お問い合わせ送信フォームの格納。書き込み後、Cloud Functionsのトリガーで管理者へ通知メールが送信される。
- **主なフィールド**:
  - `name` (string): 送信者の名前。
  - `email` (string): 送信者のメールアドレス。
  - `subject` (string): 件名。
  - `content` (string): お問い合わせ内容。
  - `isRead` (boolean): 既読ステータス。
  - `createdAt` (timestamp): 送信日時。

### 9. `counters` コレクション
- **パス**: `/counters/{counterId}`
- **用途**: アプリの閲覧数等の汎用的なカウンター。

---

## 6. 関数・命名規則

### 6-1. データ操作・通信関数の命名パターン
クライアント側（`index.html`）での操作関数は以下のルールで命名されています：
- **ユーザー関連・認証**:
  - `loginWithGoogle(source)`: Googleポップアップ/リダイレクトによるログイン処理。
  - `logoutWithFirebase()`: Firebaseからのログアウト処理。
  - `refreshUserUI()`: ログインユーザーのクレジット情報やお試し日数を Firestore から再読み込みして画面表示を更新。
- **診断処理（通常モード）**:
  - `checkAndRun(action)`: クレジットチェックを経て、アクション (`analyzePhoto`, `analyzeBehavior`, `startChat`) を実行。
  - `analyzePhoto()`: 写真診断の実行（Claudeプロキシ呼び出しと結果描画、履歴保存）。
  - `analyzeBehavior()`: 行動診断の実行。
  - `startChat()`: 通常チャット会話の初期化。
  - `sendChat()`: 通常チャットメッセージの送信とAI応答取得。
- **虹の橋モード関連**:
  - `loadPets()`: ユーザーが登録したペット一覧の読み込み。
  - `saveMemorial()`: ペット情報の新規登録と画像のStorageアップロード。
  - `renderAlbum(petId)`: 対象ペットの思い出アルバムグリッドとコメントの描画。
  - `openPhotoModal(petId, photoIdx, photoUrl)`: アルバム写真をタップした際のAI代弁とコメントモーダルの表示。
  - `savePhotoComment()`: 代弁写真への一言コメントのFirestore保存。
  - `renderRbChat(petId)`: 虹の橋チャット履歴の読み込みとUI描画。
  - `sendRbChat()`: 虹の橋チャットメッセージの送信とAI応答の取得・保存。
  - `renderMemorial(petId)`: メモリアルページのプロフィール・写真の描画。
- **ユーティリティ**:
  - `todayJST()` / `window.todayJST()`: 日本時間 (JST) での本日日付の取得 (`YYYY-MM-DD`)。
  - `runWithRetry(fn, maxRetries, baseDelay)`: 通信エラー発生時の自動リトライ処理。
  - `escHtml(str)`: HTMLエスケープおよび改行コードの `<br>` 変換。

### 6-2. localStorage キー
現在、診断履歴やペットデータ等のすべての状態情報は Firestore を同期ソースとして利用しているため、**`localStorage` は使用されていません**。

### 6-3. CSS クラス・変数切り替え
種のトグル（犬/猫）やモードトグル（通常/虹の橋）によって `body` タグにクラスを付与し、CSS変数をトグルします。
- `body` (標準/犬モード): オレンジ系統のカラーパレット。
- `body.cat-mode`: ピンク系統のカラーパレット。
- `body.rainbow-mode`: パープル〜ラベンダー系統のカラーパレット、および背景のフローティングパーティクルキャンバス (`#particle-canvas`) の表示。

---

## 7. デザインルール

### 7-1. モード別カラーパレット (CSS変数定義)

| CSS変数名 | 犬モード（通常） | 猫モード (`body.cat-mode`) | 虹の橋モード (`body.rainbow-mode`) |
| :--- | :--- | :--- | :--- |
| `--primary` | `#f4a261` (オレンジ) | `#ff85a1` (ピンク) | `#a084ca` (パープル) |
| `--primary-dark` | `#e07020` | `#f06292` | `#7c5cbf` |
| `--primary-light` | `rgba(244, 162, 97, 0.12)` | `rgba(255, 133, 161, 0.12)` | `rgba(160, 132, 202, 0.12)` |
| `--bg-start` | `#fff8f0` | `#fff0f3` | `#faf4ff` |
| `--bg-end` | `#fef3e2` | `#ffe3e8` | `#fff0fa` |
| `--card-shadow` | `rgba(244, 162, 97, 0.18)` の影 | `rgba(255, 133, 161, 0.18)` の影 | `rgba(160, 132, 202, 0.2)` の影 |
| `--tab-active` | `#f4a261` | `#ff85a1` | `#a084ca` |
| `--btn-bg` | `#f4a261` | `#ff85a1` | `linear-gradient(135deg, #a084ca, #f48fb1)` |
| `--btn-hover` | `#e07020` | `#f06292` | `linear-gradient(135deg, #8b6dbe, #e87ca0)` |
| `--bubble-dog-bg`| `white` | `white` | `#fdf6ff` |
| `--input-focus` | `#f4a261` | `#ff85a1` | `#a084ca` |
| `--result-border` | `#f4a261` | `#ff85a1` | `#a084ca` |
| `--result-bg-start`| `#fff8f0` | `#fff0f3` | `#faf4ff` |
| `--result-bg-end` | `#fff3e8` | `#ffe3e8` | `#fff0fa` |
| `--badge-color` | `#f4a261` | `#ff85a1` | `#a084ca` |
| `--header-color` | `#2d2d2d` | `#2d2d2d` | `#5b3f7e` |
| `--mode-toggle-active-bg`| `#f4a261` | `#ff85a1` | `#a084ca` |

### 7-2. タイポグラフィ
- **主要フォント**: `Zen Maru Gothic`, `Hiragino Kaku Gothic ProN`, `Noto Sans JP`, sans-serif
  - 丸みを帯びた親しみやすいフォントを全体に適用しています。

### 7-3. 共通コンポーネント構造
- **メインカード (`.card`)**: 横幅最大 `480px` の中央配置。スマートフォン表示に最適化。
- **タブバー (`.tabs`)**: 上部にアイコンとラベルを配置。スクロール可能。
- **入力フォーム**: 角丸 `12px`、ボーダー `2px`。フォーカス時に各モードのプライマリカラーで発光。
- **プライマリボタン (`.btn`)**: 角丸 `28px` のピル形状。ホバー時に僅かに浮き上がるアニメーション (`transform: translateY(-2px)`) とシャドウ。

---

## 8. 未実装・今後の予定

### 8-1. Phase 8以降のロードマップ案
- **PayPay決済のフロントエンド完全統合**: バックエンド (`functions/index.js` 等) にはPayPay連携の痕跡があるものの、現状クライアントのUIカード (`#pay-plan-cards`) には Stripe 決済の選択肢のみが表示されています。PayPay都度払いをフロント側に復活させ、スムーズに併用可能にすることが求められています。
- **複数ペットの通常モード保存**: 現在、通常モード（写真診断・行動診断）は単一の入力状態をトグルする形になっており、虹の橋モードのように「今飼っている複数匹のペット」を個別にプロファイル登録して切り替える機能はありません。
- **WebView警告の判定精度向上**: アプリ内ブラウザの判定ロジックについて、新たなSNSアプリ（ThreadsやBluesky等）への対応、およびデバイスごとの外部ブラウザ起動リンク (`safari-` スキーム等) の最適化。

### 8-2. 既知の課題・バグ
- **画像のプレビューアスペクト比**: スマートフォン端末でのカメラ撮影画像のアップロード時、縦横比が崩れたり回転してしまう問題を完全に吸収する `EXIF` 回転情報のハンドリング強化が必要です。
- **決済反映の待機時間**: WebhookからFirestoreへの反映にタイムラグが生じた場合のクライアント側ポーリング処理（現在最大15秒）のロバスト性向上。

---

## 9. 開発ルール

- **console.log の原則禁止**:
  - 本番環境でのエラー漏洩およびパフォーマンス低下を防ぐため、**デバッグ用の `console.log` は原則としてコミット対象のソースコードから削除またはコメントアウト**してください。
- **Firebase ルールと整合したクエリの作成**:
  - Firestoreのセキュリティルールが厳密に設定されているため、ログインしていない状態で `users` や `memorial_chats` コレクションへの直接アクセスを行うと即座にルール違反エラーが発生します。クエリを発行する前に、必ず `window._currentUser` のログイン状態を確認してください。
- **CORS・カスタムヘッダーの取り扱い**:
  - Cloud Functionsをクライアントから呼び出す際は、`Authorization` ヘッダーではなく、カスタムヘッダー `X-Firebase-Auth` に ID トークンを格納して送信します（GCPロードバランサ側のトークン検証競合を回避するため）。
- **3つのデザインモードの検証**:
  - UIやCSSを改修する際は、必ず「犬（標準）」「猫」「虹の橋」の3つの表示モードすべてでレイアウト崩れや配色の矛盾が起きていないかを検証してください。
- **絶対に書き換えてはいけない部分**:
  - クライアント・バックエンド間の **IDトークンのデコード・検証ロジック (`verifyToken`)**。
  - Stripeの **Webhookシグネチャ確認ロジック (`stripe.webhooks.constructEvent`)**。
  - クレジット残高管理の **Firestoreトランザクション処理 (`db.runTransaction`)**。

---

## 10. デプロイ手順

### 10-1. フロントエンドのデプロイ
#### A. Firebase Hosting を使用する場合
プロジェクトルートにて以下のコマンドを実行します：
```bash
# Hostingのみデプロイ
firebase deploy --only hosting
```
- ※ パッチ適用スクリプト (`patch_index.py`等) が用意されている場合は、デプロイ前にスクリプトを実行してHTML内の必要な置換を適用させてください。

#### B. Netlify Drop を使用する場合
1. `public` ディレクトリ内のすべての静的ファイルを zip 等にまとめ、Netlify Dropのダッシュボードにドラッグ＆ドロップしてアップロードします。
2. 必要に応じて Netlify 側の環境変数やリダイレクトルール（`_redirects` ファイルの配置など）を設定します。

### 10-2. バックエンド (Functions) のデプロイ
```bash
# functions ディレクトリで依存モジュールのインストールを確認後
cd functions
npm install
cd ..
firebase deploy --only functions
```
- ※ シークレット（`ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY` 等）が未設定の場合は、事前に `firebase functions:secrets:set SECRET_NAME` で設定が必要です。

### 10-3. セキュリティルールのデプロイ
```bash
# Firestoreのセキュリティルールのみデプロイ
firebase deploy --only firestore:rules

# Storageのセキュリティルールのみデプロイ
firebase deploy --only storage:rules
```
または、Firebase Console の Rules タブに `firestore.rules` / `storage.rules` の中身を直接コピー＆ペーストして公開（パブリッシュ）することも可能です。
