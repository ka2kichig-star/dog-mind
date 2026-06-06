# /commit-push-pr
変更を保存・リモート反映・PR作成まで一気に進めるコマンド。

## 実行手順

### Step 0: 状態引き継ぎ
- `AGENT_CONTEXT.md` を読んで現在の状態を把握
- `git status` で変更ファイルを確認
- 「現在の状態：〇〇」を報告してから進む

### Step 1: 変更内容の確認・報告
```bash
git diff --stat
git status
```
変更ファイルを箇条書きで報告：
```
変更: src/auth.ts（signInWithRedirect対応）
変更: functions/src/webhook.ts（checkout.session.completed追加）
新規: src/components/DiagnosisHistory.tsx
削除: src/utils/old-helper.ts
```

### Step 2: コミットメッセージ自動生成
変更内容から最適なprefixを選んでメッセージを生成：
- `feat:` 新機能
- `fix:` バグ修正
- `refactor:` リファクタリング
- `style:` UI変更
- `docs:` ドキュメント
- `deploy:` デプロイ設定
- `chore:` 雑務・設定変更

```bash
git add .
git commit -m "[自動生成メッセージ]"
```

### Step 3: Push
```bash
git push origin main
```

### Step 4: PR作成
GitHub CLIが使える場合：
```bash
gh pr create \
  --title "[変更内容の要約]" \
  --body "## 変更内容\n[詳細]\n\n## テスト済み\n- [ ] ローカル確認\n- [ ] 本番確認"
```
使えない場合はPRテキストをコピペ用で出力。

### Step 5: 完了報告
- コミットハッシュ
- pushブランチ・PR URL
- AGENT_CONTEXT.mdの更新事項
