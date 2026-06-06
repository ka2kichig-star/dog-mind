# /deploy-check
Cloud Runデプロイ前の確認チェックを実施してpushするコマンド。

## 対象プロジェクト
わんにゃん翻訳機（Cloud Run / Firebase Hosting構成）

## 実行手順

### Step 0: 状態引き継ぎ
- `AGENT_CONTEXT.md` を読んで現在の状態を把握
- `git status` で未コミットの変更を確認
- 確認前に「現在の状態：〇〇」を報告する

### Step 1: デプロイ前チェックリスト（全項目報告）
- [ ] 環境変数（`.env`）に不足・ミスがないか
- [ ] `package.json` のビルドスクリプトが正常か
- [ ] Stripe APIキーが本番用になっているか
- [ ] Firebase プロジェクトIDが正しいか（`dog-mind`）
- [ ] Cloud Run のメモリ・CPU設定が適切か
- [ ] Webhookエンドポイントが本番URLになっているか

### Step 2: ビルドテスト
```bash
npm run build
```
エラーがあれば修正して再実行。

### Step 3: Push & デプロイ
```bash
git add .
git commit -m "deploy: [デプロイ内容の説明]"
git push origin main
```

### Step 4: 完了報告
- チェック結果サマリー
- デプロイ後に確認すべき動作
