# 🐶🐱 わんにゃん翻訳機 — プロダクションリリースドキュメント

AIがあなたの愛犬・愛猫の気持ちを代弁するエンターテインメントWebアプリケーションです。  
写真解析、行動診断、チャット会話、そしてペットとの思い出を残す「虹の橋」メモリアル機能を備えています。

---

## 🌟 主な機能

1. 📷 **写真で診断**
   - ペットの写真から表情や姿勢をAI（Claude）が解析し、現在の感情状態を数値化して代弁します。
2. 🐾 **行動で診断**
   - 鳴き声や仕草などの行動パターンを選択し、心理状態や飼い主へのメッセージを解説します。
3. 💬 **ペットと会話（チャット）**
   - ペットの名前や種別、性格に合わせたキャラクターで双方向チャットが楽しめます。
4. 🌈 **虹の橋メモリアルモード**
   - 旅立ったペットとの思い出（アルバム、命日、誕生日）を記録し、AIを介して寄り添う会話が可能です。
5. 💳 **Stripe 決済**
   - 初回無料枠（またはお試し枠）終了後、都度払い（Stripe）および月額サブスクリプション（Stripe）に対応。
6. 📱 **PWA (Progressive Web App) 対応**
   - ホーム画面への追加、オフライン時の警告バナー表示、キャッシュファーストのサービスワーカーを備えています。

---

## 📂 ディレクトリ構成

```
.
├── public/                 # フロントエンド静的アセット（Firebase Hosting 対象）
│   ├── index.html          # メインアプリケーション画面
│   ├── lp.html             # ランディングページ（LP）
│   ├── cancel.html         # 月額プランの解約ページ
│   ├── contact.html        # お問い合わせフォーム
│   ├── terms.html          # 利用規約（特定商取引法に基づく表記を含む）
│   ├── privacy.html        # プライバシーポリシー
│   ├── maintenance.html    # メンテナンス画面
│   ├── manifest.json       # PWA マニフェストファイル
│   ├── sw.js               # キャッシュ制御用サービスワーカー
│   ├── firebase-messaging-sw.js # Firebase Cloud Messaging用SW
│   └── (画像・アイコン類)
│
├── functions/              # Firebase Cloud Functions (Node.js 20 / Backend logic)
│   ├── index.js            # API・Webhook エンドポイント群
│   └── package.json
│
├── firestore.rules         # Firestore セキュリティルール
├── storage.rules           # Firebase Cloud Storage セキュリティルール
├── firebase.json           # Firebase 設定ファイル
└── .firebaserc             # Firebase プロジェクト設定
```

---

## 🛠 技術スタック

- **フロントエンド**: Vanilla HTML, CSS, JavaScript (ES6+ / Fetch API)
- **バックエンド**: Firebase Functions (Node.js 20)
- **認証**: Firebase Auth (Google認証)
- **データベース**: Cloud Firestore
- **ストレージ**: Firebase Cloud Storage (写真の一時保存)
- **AIエンジン**: Claude 3.5 Sonnet (Anthropic API)
- **決済連携**: Stripe SDK
- **ホスティング**: Firebase Hosting

---

## 🔑 環境変数・シークレットの設定

バックエンド（Cloud Functions）の稼働には以下のAPIキー等の設定が必須です。  
Firebase Secret Manager に設定してください：

```bash
# Anthropic Claude APIキー
firebase functions:secrets:set ANTHROPIC_API_KEY

# Stripe 接続情報
firebase functions:secrets:set STRIPE_SECRET_KEY
```

---

## 🚀 デプロイ手順

### 1. バックエンド (Firebase Functions)
関数をビルドし、環境構築を行ったうえでデプロイします。

```bash
# functions ディレクトリへ移動してインストール
cd functions
npm install

# デプロイ実行 (Firestoreルール・Storageルール・Functions)
cd ..
firebase deploy
```

### 2. Stripe Webhook の設定
StripeダッシュボードのWebhook設定で以下のエンドポイントを追加し、送信イベントに `checkout.session.completed` を選択してください：
```
https://asia-northeast1-wanwan-translator.cloudfunctions.net/stripeWebhook
```

---

## 🌐 Firebase Hosting へのデプロイ案内

詳細な手順については [FIREBASE_GUIDE.md](file:///c:/Users/ka2ki/OneDrive/アングラ/わんわん翻訳機/FIREBASE_GUIDE.md) を参照してください。

---

## 📝 開発時の注意点

- **コンソール出力の禁止**: 本番デプロイにあたり、デバッグ目的の `console.log` は全ファイルから削除されています。動作ログ等はFunctions側の例外キャッチ等に委ねています。
- **オフライン警告**: インターネット未接続を検知すると画面上部に `#offline-banner` が自動的に表示されます。
- **WebView制御**: Instagram、LINE、Threads等のアプリ内ブラウザ（WebView）から起動された場合、Safari等の外部通常ブラウザへの誘導モーダルを強制表示して動作不良を防止する仕組みが含まれています。
