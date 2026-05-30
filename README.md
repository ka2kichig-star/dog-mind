# 🐶 わんわん翻訳機

AIがあなたの愛犬の気持ちを代弁するWebアプリです。

## 機能

- 📷 **写真で診断** — 愛犬の写真から気持ちを分析
- 🐾 **行動で診断** — 鳴き声・行動パターンから感情を診断
- 💬 **愛犬と会話** — AIが愛犬になりきってチャット

## 料金

- 1日1回：**無料**（日付が変わったらリセット）
- 当日2回目以降：**100円**（PayPay決済）

## 技術スタック

- フロントエンド: Vanilla HTML/CSS/JS
- バックエンド: Firebase Functions (Node.js 20)
- 認証: Firebase Auth (Google)
- DB: Firestore
- AI: Claude API (claude-3-5-sonnet)
- 決済: PayPay for Developers
- ホスティング: Firebase Hosting

## 環境変数の設定

```bash
# Firebase Secret Manager に設定
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase functions:secrets:set PAYPAY_API_KEY
firebase functions:secrets:set PAYPAY_API_SECRET
firebase functions:secrets:set PAYPAY_MERCHANT_ID
firebase functions:secrets:set STRIPE_SECRET_KEY
```

## デプロイ

```bash
cd functions && npm install
firebase deploy
```

## PayPay Webhook URL

デプロイ後、以下のURLをPayPay Developerコンソールに設定してください：

```
https://asia-northeast1-wanwan-translator.cloudfunctions.net/payPayWebhook
```

## Stripe Webhook URL

デプロイ後、以下のURLをStripeダッシュボードのWebhookエンドポイントに設定してください：

```
https://asia-northeast1-wanwan-translator.cloudfunctions.net/stripeWebhook
```

イベントは `checkout.session.completed` を選択してください。
