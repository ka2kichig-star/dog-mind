# /fix-webhook
Stripe Webhookのバグを自律的に特定・修正・テスト・pushするコマンド。

## 対象プロジェクト
わんにゃん翻訳機（Firebase / Cloud Run / Stripe / Firestore構成）

## 実行手順

### Step 0: 状態引き継ぎ
- `AGENT_CONTEXT.md` を読んで現在の既知バグ・進行状況を把握
- `git log --oneline -10` で直近の変更を確認
- 「現在の状態：〇〇」を報告してから調査に入る

### Step 1: 症状の特定（報告してから進む）
以下を調査して箇条書きで報告：
1. Webhookハンドラのエンドポイントを特定（`/webhook`）
2. 受信しているイベント種別を確認（`checkout.session.completed` / `customer.subscription.deleted` など）
3. `stripe.webhooks.constructEvent()` の署名検証が通っているか
4. Firestoreへの書き込みが成功しているか（`isPremium` フラグなど）
5. Cloud Runのログで直近エラーを確認

### Step 2: 根本原因の特定
症状から以下のどれかに絞り込んで報告：
- [ ] Webhookシークレットの不一致
- [ ] イベント種別のハンドリング漏れ
- [ ] Firestoreの書き込みパスのミス
- [ ] Cloud RunのCORS・認証ブロック
- [ ] その他（具体的に記述）

### Step 3: 修正
- バグを修正
- 修正したファイルを箇条書きで報告：
  ```
  変更: functions/src/webhook.ts（署名検証ロジック修正）
  変更: functions/src/index.ts（イベントハンドラ追加）
  ```

### Step 4: ローカルテスト（可能であれば）
```bash
stripe listen --forward-to localhost:5001/[project]/us-central1/webhook
stripe trigger checkout.session.completed
```

### Step 5: Push
```bash
git add .
git commit -m "fix: Stripe Webhook [具体的な修正内容]"
git push origin main
```

### Step 6: 完了報告
- 修正内容サマリー
- 本番で確認すべき動作
- AGENT_CONTEXT.mdの更新事項
