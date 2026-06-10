# /hayamise-pwd

ツールキットサイトのパスワードを安全に変更し、再デプロイする。

## 目的

`public/toolkit/index.html` の CORRECT_HASH を新パスワードのSHA-256に
差し替え、ハッシュ生成→置換→再デプロイまでを安全に実行する。

## 前提

- hayamise-firebase/ で実行
- 現在のパスワードを把握している（変更後の混乱を防ぐため）

## 実行手順

1. 新パスワード確認
   - 勝貴くんから新パスワードをヒアリング
   - 強度チェック（8文字以上、推測されにくいか）
   - メモした場所も確認（自分で忘れない仕組み）

2. SHA-256ハッシュ生成
   - PowerShellで：
     ```
     $pwd = "新パスワード"
     $hasher = [System.Security.Cryptography.SHA256]::Create()
     $bytes = [System.Text.Encoding]::UTF8.GetBytes($pwd)
     $hash = [System.BitConverter]::ToString($hasher.ComputeHash($bytes)).Replace("-","").ToLower()
     Write-Output $hash
     ```
   - または Python:
     ```
     python -c "import hashlib; print(hashlib.sha256('新パスワード'.encode()).hexdigest())"
     ```

3. ファイル更新
   - public/toolkit/index.html の CORRECT_HASH を新ハッシュに置換

4. 再デプロイ
   ```
   firebase deploy --only hosting:toolkit
   ```

5. 動作確認
   - 新パスワードで通過できるか
   - 旧パスワードが通らないことを確認（シークレットウィンドウで）

## 報告ルール

- 変更前後のハッシュ値（パスワード本体は記録しない）
- デプロイ完了URL
- 営業代行への通知文案（必要なら）

## 関連コマンド

- /hayamise-deploy（通常デプロイ）
- /security-check（パスワード強度・全体セキュリティ点検）
