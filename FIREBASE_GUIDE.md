# 🔥 Firebase Hosting デプロイ ＆ OGP 確認ガイド

本ガイドは、「わんにゃん翻訳機」の静的フロントエンド（`public/` ディレクトリ）を Firebase Hosting にデプロイし、本番公開する際の手順およびOGP（SNSシェア時の見え方）の検証項目をまとめたものです。

---

## 🛠 1. Firebase CLI によるデプロイ手順

### 1-1. Firebase CLI のインストール
Node.js がインストールされている環境で、以下のコマンドを実行します（未インストールの場合）：
```bash
npm install -g firebase-tools
```

### 1-2. ログインと認証
ブラウザが起動し、Google アカウントへの認証を行います：
```bash
firebase login
```

### 1-3. デプロイ実行 (ホスティングのみ)
検証が完了し、本番環境に公開する場合は以下のコマンドを実行します：
```bash
firebase deploy --only hosting
```
- 本番用の公開URL：`https://wanwan-translator.web.app`

---

## 📸 2. OGP ＆ メタデータ検証チェックリスト

本番公開後、各種SNS（LINE, Instagram, Facebook, Twitter/X, Threads）で正しくサムネイル画像やタイトルが表示されるか確認するためのチェックリストです。

### 2-1. 推奨画像サイズ
- **OGP画像サイズ**: `1200 x 630` ピクセル (アスペクト比 `1.91:1`)
- **ファイル形式**: `JPEG` または `PNG` (ファイル名は `public/ogp_image.jpg` 等)

### 2-2. HTMLメタタグ検証リスト
各HTMLファイル（`index.html` / `lp.html`）の `<head>` にて以下が正確に指定されているか確認します：
- [ ] `<title>` が正しく設定されているか（文字数は30〜35文字程度が推奨）
- [ ] `<meta name="description">` が各ページの概要を表しているか（文字数は80〜120文字程度が推奨）
- [ ] `<meta name="keywords">` に主要キーワード10個がカンマ区切りで登録されているか
- [ ] `<meta property="og:url">` が `https://wanwan-translator.web.app` を指しているか
- [ ] `<meta property="og:image">` に OGP 画像の絶対パス（例：`https://wanwan-translator.web.app/ogp_image.jpg`）が設定されているか

### 2-3. SNSシェアデバッガーによるキャッシュクリア
- **LINE**: [LINE URL Content-Shared (Page Share) Debugger](https://poker.line.me/) にログインし、URLを入力して `Clear Cache` を実行します。
- **Facebook / Instagram / Threads**: [Sharing Debugger - Facebook for Developers](https://developers.facebook.com/tools/debug/) にてURLを入力し、`Scrape Again` を実行します。
