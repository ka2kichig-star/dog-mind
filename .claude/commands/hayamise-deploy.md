# /hayamise-deploy

HAYAMISE関連サイトのFirebase Hostingデプロイを自動化する。

## 目的

メインサイト（hayamise）+ ツールキット（hayamise-toolkit）の
2サイト構成を、エラーなくデプロイし、両URLを報告する。

## 前提

- hayamise-firebase/ で実行
- firebase login 済み
- .firebaserc が実プロジェクトIDに書き換え済み
- firebase target:apply 済み

## 実行手順

1. 状態確認
   - 現在のディレクトリが hayamise-firebase か確認
   - firebase.json / .firebaserc の整合性チェック
   - public/ 配下のファイル一覧確認

2. ローカルプレビュー（オプション）
   ```
   firebase emulators:start --only hosting
   ```
   勝貴くんが確認OK出したら次へ

3. デプロイ実行
   ```
   firebase deploy --only hosting
   ```

4. 結果検証
   - 2サイト分のURLが返ってきたか
   - エラーログなし
   - 各URLにブラウザでアクセスして動作確認案内

5. セキュリティ確認
   - ツールキット側がパスワードゲートで保護されているか
   - X-Robots-Tag が noindex になっているか

## 報告ルール

- デプロイされた2つのHosting URL
- 変更ファイル一覧（git diff相当）
- デプロイ所要時間
- 動作確認手順案内
- パスワード変更が必要なら /hayamise-pwd を提案

## 関連コマンド

- /hayamise-pwd（PW変更）
- /verify-app（動作確認）
- /security-check（PW強度・noindex統合点検）
- /deploy-check（デプロイ前点検）
