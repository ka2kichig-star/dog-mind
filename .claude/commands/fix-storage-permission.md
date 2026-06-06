# /fix-storage-permission
Firebase Storageの権限エラーを修正するコマンド。

## 対象プロジェクト
わんにゃん翻訳機（虹の橋モード・Storage画像アップロード関連）

## 実行手順

### Step 0: 状態引き継ぎ
- `AGENT_CONTEXT.md` を読んで現在の状態を把握
- エラーメッセージを確認（コンソールログ / Firebaseログ）
- 調査前に「現在の状態：〇〇」を報告する

### Step 1: 調査（報告してから進む）
以下を調査して結果を箇条書きで報告：
1. `storage.rules` の現在のルールを確認
2. アップロード処理のコード（パス・認証トークンの渡し方）を確認
3. Firebase AuthのUIDが正しく渡されているか確認
4. CORS設定の確認（必要であれば）

### Step 2: 修正
- 権限ルールまたはアップロードコードを修正
- 修正したファイルを箇条書きで報告

### Step 3: デプロイ & Push
```bash
firebase deploy --only storage
git add .
git commit -m "fix: Firebase Storage permission [修正内容]"
git push origin main
```

### Step 4: 完了報告
- 修正内容サマリー
- テスト方法の提示
