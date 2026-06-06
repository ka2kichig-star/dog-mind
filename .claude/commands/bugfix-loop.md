# /bugfix-loop
RideConnectのバグを修正してGitHub Pagesに反映するコマンド。

## 対象プロジェクト
RideConnect（ka2kichig-star.github.io/rideconnect / Vanilla JS + Leaflet.js + Firebase）

## 実行手順

### Step 0: 状態引き継ぎ
- `AGENT_CONTEXT.md` を読んで現在の状態・既知バグを把握
- `git status` と `git log --oneline -5` で直近の変更を確認
- 調査前に「現在の状態：〇〇」を報告する

### Step 1: バグ調査（報告してから進む）
以下を調査して結果を箇条書きで報告：
1. エラーの再現条件を特定
2. 該当コードファイルと行番号を特定
3. Firebase認証・Leaflet.js・SNS内蔵ブラウザのどれに関連するか判定

### Step 2: 修正
- バグを修正
- 修正したファイルを箇条書きで報告

### Step 3: Push（GitHub Pages自動反映）
```bash
git add .
git commit -m "fix: [バグの内容]"
git push origin main
```

### Step 4: 完了報告
- 修正内容サマリー
- GitHub Pages反映URL
- 次に確認すべき動作
