# index.htmlに月額プラン対応の修正を適用するスクリプト
$filePath = "public\index.html"
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

# =====================================
# 修正1: チケットバッジHTMLのID追加
# =====================================
$old1 = @'
  <div id="ticket-badge-card" class="ticket-badge-card" style="display: none;">
    <div class="ticket-label-container">
      <span>🎫</span>
      <span>追加診断チケット</span>
    </div>
    <div class="ticket-count-big" id="ticket-count-val">0</div>
    <div class="ticket-unit">枚</div>
  </div>
'@
$new1 = @'
  <div id="ticket-badge-card" class="ticket-badge-card" style="display: none;">
    <div class="ticket-label-container">
      <span id="ticket-badge-icon">🎫</span>
      <span id="ticket-badge-label">追加診断チケット</span>
    </div>
    <div class="ticket-count-big" id="ticket-count-val">0</div>
    <div class="ticket-unit" id="ticket-unit-label">枚</div>
  </div>
'@
$content = $content.Replace($old1, $new1)
Write-Host "修正1完了"

# =====================================
# 修正2: updateTicketBadgeUI関数を月額プラン対応に
# =====================================
$old2 = @'
    window.updateTicketBadgeUI = function(credits) {
      const card = document.getElementById('ticket-badge-card');
      const val = document.getElementById('ticket-count-val');
      if (!card || !val) return;
      
      const user = auth.currentUser;
      if (!user) {
        card.style.display = 'none';
        return;
      }
      
      val.textContent = credits;
      if (credits > 0) {
        card.style.display = 'flex';
        card.classList.remove('zero');
      } else {
        card.style.display = 'none';
        card.classList.add('zero');
      }
    };
'@
$new2 = @'
    window.updateTicketBadgeUI = function(credits, isMonthlyActive) {
      const card = document.getElementById('ticket-badge-card');
      const val = document.getElementById('ticket-count-val');
      const icon = document.getElementById('ticket-badge-icon');
      const label = document.getElementById('ticket-badge-label');
      const unit = document.getElementById('ticket-unit-label');
      if (!card || !val) return;
      
      const user = auth.currentUser;
      if (!user) {
        card.style.display = 'none';
        return;
      }
      
      if (isMonthlyActive) {
        // 月額プラン有効：♾️表示
        card.style.display = 'flex';
        card.classList.remove('zero');
        card.style.background = 'linear-gradient(135deg, #a084ca, #f48fb1)';
        card.style.boxShadow = '0 8px 24px rgba(160, 132, 202, 0.4)';
        if (icon) icon.textContent = '♾️';
        if (label) label.textContent = '月額プラン';
        val.textContent = '♾️';
        val.style.fontSize = '24px';
        if (unit) unit.textContent = '使い放題';
      } else if (credits > 0) {
        // 都度払いチケットあり
        card.style.display = 'flex';
        card.classList.remove('zero');
        card.style.background = 'linear-gradient(135deg, #ffd700, #ff8c00)';
        card.style.boxShadow = '0 8px 24px rgba(255, 140, 0, 0.3)';
        if (icon) icon.textContent = '🎫';
        if (label) label.textContent = '追加診断チケット';
        val.textContent = credits;
        val.style.fontSize = '28px';
        if (unit) unit.textContent = '枚';
      } else {
        card.style.display = 'none';
        card.classList.add('zero');
      }
    };
'@
$content = $content.Replace($old2, $new2)
Write-Host "修正2完了"

# =====================================
# 修正3: onAuthStateChangedに月額プランチェックを追加
# =====================================
$old3 = @'
        const perUseCredits = data.perUseCredits || 0;

        window.updateTicketBadgeUI(perUseCredits);

        // 登録日（お試し開始日）からの日数計算
        const regDate = data.registeredAt?.toDate ? data.registeredAt.toDate() : new Date();
        const diffTime = Math.abs(new Date() - regDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 登録日を1日目とする
        const isTrialPeriod = diffDays <= 7;

        if (perUseCredits > 0) {
          badge.textContent = `✅ 追加診断チケットがあります（残り${perUseCredits}回）🐾`;
        } else if (isTrialPeriod) {
          const remainingDays = 8 - diffDays;
          badge.textContent = todayCount < 3
            ? `🎉 お試し期間（あと${remainingDays}日）｜今日はあと${3 - todayCount}回無料診断できます！`
            : `今日${todayCount}回診断済み｜次回から80円（お試し残${remainingDays}日）`;
        } else {
          badge.textContent = '⚠️ お試し期間（1週間）が終了しました｜診断には80円が必要です';
        }
'@
$new3 = @'
        const perUseCredits = data.perUseCredits || 0;

        // 月額プラン有効チェック
        let isMonthlyActive = false;
        if (data.monthlyPlanActive && data.monthlyPlanExpiry) {
          const expiry = data.monthlyPlanExpiry?.toDate ? data.monthlyPlanExpiry.toDate() : null;
          isMonthlyActive = expiry && expiry > new Date();
        }

        window.updateTicketBadgeUI(perUseCredits, isMonthlyActive);

        // 登録日（お試し開始日）からの日数計算
        const regDate = data.registeredAt?.toDate ? data.registeredAt.toDate() : new Date();
        const diffTime = Math.abs(new Date() - regDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 登録日を1日目とする
        const isTrialPeriod = diffDays <= 7;

        if (isMonthlyActive) {
          badge.textContent = `♾️ 月額プラン — 使い放題です💜`;
        } else if (perUseCredits > 0) {
          badge.textContent = `✅ 追加診断チケットがあります（残り${perUseCredits}回）🐾`;
        } else if (isTrialPeriod) {
          const remainingDays = 8 - diffDays;
          badge.textContent = todayCount < 3
            ? `🎉 お試し期間（あと${remainingDays}日）｜今日はあと${3 - todayCount}回無料診断できます！`
            : `今日${todayCount}回診断済み｜次回から80円（お試し残${remainingDays}日）`;
        } else {
          badge.textContent = '⚠️ お試し期間（1週間）が終了しました｜診断には80円が必要です';
        }
'@
$content = $content.Replace($old3, $new3)
Write-Host "修正3完了"

# =====================================
# 修正4: onAuthStateChangedのログアウト時をwindow.updateTicketBadgeUI(0, false)に
# =====================================
$old4 = '        window.updateTicketBadgeUI(0);
      }
      // ログイン状態が変わったらボタンの有効無効を更新
      updateSubmitButtons();
    });
  </script>'
$new4 = '        window.updateTicketBadgeUI(0, false);
      }
      // ログイン状態が変わったらボタンの有効無効を更新
      updateSubmitButtons();
    });
  </script>'
$content = $content.Replace($old4, $new4)
Write-Host "修正4完了"

# =====================================
# 修正5: checkAndRun内の月額プランバッジ表示を♾️に
# =====================================
$old5 = "        document.getElementById('usage-badge').textContent = ``💜 月額プラン｜今日${todayCount + 1}回診断済み``;"
$new5 = "        document.getElementById('usage-badge').textContent = ``♾️ 月額プラン — 使い放題です💜``;
        window.updateTicketBadgeUI(perUseCredits, true);"
$content = $content.Replace($old5, $new5)
Write-Host "修正5完了"

# =====================================
# 修正6: チケット消費後のupdateTicketBadgeUI引数
# =====================================
$old6 = '        window.updateTicketBadgeUI(newCredits);'
$new6 = '        window.updateTicketBadgeUI(newCredits, false);'
$content = $content.Replace($old6, $new6)
Write-Host "修正6完了"

# =====================================
# 修正7: Stripe成功後の表示（月額プラン）
# =====================================
$old7 = "            document.getElementById('usage-badge').textContent = '💜 月額プラン有効！使い放題です';"
$new7 = "            document.getElementById('usage-badge').textContent = '♾️ 月額プラン有効！使い放題です';"
$content = $content.Replace($old7, $new7)
Write-Host "修正7完了"

# ファイルに書き込み（UTF8 BOMなし）
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Resolve-Path $filePath).Path, $content, $utf8NoBom)
Write-Host "完了！ファイルを保存しました"
