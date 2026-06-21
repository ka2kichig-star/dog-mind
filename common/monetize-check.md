# わんにゃん翻訳機 — APIコスト点検ログ

## 目的

`headroom-ai` による Claude API トークン圧縮レイヤー導入後のコスト変化を追跡し、削減効果を定量的に評価する。

---

## 現在のスタック

| 項目 | 内容 |
|---|---|
| AIモデル | `claude-sonnet-4-5` |
| 圧縮ライブラリ | `headroom-ai@0.22.4` |
| SDK | `@anthropic-ai/sdk@0.105.0` |
| 圧縮対象 | `claudeProxy` — `messages` 配列 |

---

## headroom-ai 導入前のベースライン

> 導入前コミット: `cbdbac0` (chore: before headroom)

| 指標 | 推定値 |
|---|---|
| 平均 input tokens / リクエスト | 未計測（ログ出力なし） |
| Claude Sonnet 4.5 input 単価 | $3.00 / 1M tokens |
| Claude Sonnet 4.5 output 単価 | $15.00 / 1M tokens |

---

## headroom-ai 導入後の計測方法

Functionsのログに以下のフォーマットで出力されます：

```
[headroom] before=XXX tokens, after=YYY tokens, reduction=ZZ.Z%
```

### ログの確認コマンド

```bash
firebase functions:log --only claudeProxy | grep "headroom"
```

---

## コスト変化レポート

> ✏️ 導入後に実績データで更新してください

| 日付 | before (avg tokens) | after (avg tokens) | 削減率 | 月間リクエスト数 | 月間コスト削減額 (試算) |
|---|---|---|---|---|---|
| 2026-06-22 (導入直後) | — | — | — | — | — |
| （次回更新） | | | | | |

### 試算式

```
月間コスト削減額 ($) = 削減トークン数 × リクエスト数 × $3.00 / 1,000,000
```

---

## 注意事項

- `headroom-ai` はトークン圧縮に内部的に小規模な LLM を使用する場合があります。圧縮コスト自体も把握してください。
- 圧縮失敗時は `[headroom] compress skipped:` ログが出力され、元の messages がそのまま送信されます（フォールバック動作）。
- 画像 (base64) を含むリクエストは圧縮効果が限定的です。テキストのみのリクエスト（行動診断・チャット）で高い削減率が期待できます。

---

## 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-06-22 | `headroom-ai@0.22.4` + `@anthropic-ai/sdk@0.105.0` を導入。`claudeProxy` の Claude APIコール前に圧縮レイヤーを追加。 |
