# -*- coding: utf-8 -*-
import re

file_path = r"public\index.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

original_len = len(content)

# =====================================
# Fix 1: Add IDs to ticket badge HTML
# =====================================
old1 = '''  <div id="ticket-badge-card" class="ticket-badge-card" style="display: none;">
    <div class="ticket-label-container">
      <span>🎫</span>
      <span>追加診断チケット</span>
    </div>
    <div class="ticket-count-big" id="ticket-count-val">0</div>
    <div class="ticket-unit">枚</div>
  </div>'''

new1 = '''  <div id="ticket-badge-card" class="ticket-badge-card" style="display: none;">
    <div class="ticket-label-container">
      <span id="ticket-badge-icon">🎫</span>
      <span id="ticket-badge-label">追加診断チケット</span>
    </div>
    <div class="ticket-count-big" id="ticket-count-val">0</div>
    <div class="ticket-unit" id="ticket-unit-label">枚</div>
  </div>'''

if old1 in content:
    content = content.replace(old1, new1)
    print("Fix 1 applied: badge HTML IDs added")
else:
    print("Fix 1 NOT FOUND - checking alternatives...")

# =====================================
# Fix 2: Update updateTicketBadgeUI function for monthly plan
# =====================================
old2 = '''    window.updateTicketBadgeUI = function(credits) {
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
    };'''

new2 = '''    window.updateTicketBadgeUI = function(credits, isMonthlyActive) {
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
    };'''

if old2 in content:
    content = content.replace(old2, new2)
    print("Fix 2 applied: updateTicketBadgeUI updated for monthly plan")
else:
    print("Fix 2 NOT FOUND")

# =====================================
# Fix 3: Add monthly plan check in onAuthStateChanged
# =====================================
old3 = '''        const perUseCredits = data.perUseCredits || 0;

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
        }'''

new3 = '''        const perUseCredits = data.perUseCredits || 0;

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
        }'''

if old3 in content:
    content = content.replace(old3, new3)
    print("Fix 3 applied: onAuthStateChanged monthly plan check added")
else:
    print("Fix 3 NOT FOUND")

# =====================================
# Fix 4: updateTicketBadgeUI(0) -> updateTicketBadgeUI(0, false) in logout branch
# =====================================
old4 = "        window.updateTicketBadgeUI(0);\n      }\n      // ログイン状態が変わったらボタンの有効無効を更新\n      updateSubmitButtons();\n    });\n  </script>"
new4 = "        window.updateTicketBadgeUI(0, false);\n      }\n      // ログイン状態が変わったらボタンの有効無効を更新\n      updateSubmitButtons();\n    });\n  </script>"

if old4 in content:
    content = content.replace(old4, new4)
    print("Fix 4 applied: logout updateTicketBadgeUI updated")
else:
    print("Fix 4 NOT FOUND - trying CRLF...")
    old4_crlf = "        window.updateTicketBadgeUI(0);\r\n      }\r\n      // ログイン状態が変わったらボタンの有効無効を更新\r\n      updateSubmitButtons();\r\n    });\r\n  </script>"
    new4_crlf = "        window.updateTicketBadgeUI(0, false);\r\n      }\r\n      // ログイン状態が変わったらボタンの有効無効を更新\r\n      updateSubmitButtons();\r\n    });\r\n  </script>"
    if old4_crlf in content:
        content = content.replace(old4_crlf, new4_crlf)
        print("Fix 4 applied (CRLF version)")
    else:
        print("Fix 4 CRLF NOT FOUND either")

# =====================================
# Fix 5: checkAndRun monthly plan badge text -> infinity symbol
# =====================================
old5 = "        document.getElementById('usage-badge').textContent = `\ud83d\udc9c \u6708\u984d\u30d7\u30e9\u30f3\uff5c\u4eca\u65e5${todayCount + 1}\u56de\u8a3a\u65ad\u6e08\u307f`;"
new5 = "        document.getElementById('usage-badge').textContent = `\u267e\ufe0f \u6708\u984d\u30d7\u30e9\u30f3 \u2014 \u4f7f\u3044\u653e\u984d\u3067\u3059\ud83d\udc9c`;\n        window.updateTicketBadgeUI(perUseCredits, true);"

if old5 in content:
    content = content.replace(old5, new5)
    print("Fix 5 applied: checkAndRun monthly badge updated")
else:
    print("Fix 5 NOT FOUND - searching...")
    idx = content.find("月額プラン｜今日")
    if idx >= 0:
        print(f"  Found at position {idx}: {content[idx-80:idx+80]}")

# =====================================
# Fix 6: updateTicketBadgeUI(newCredits) -> (newCredits, false)
# =====================================
old6 = "        window.updateTicketBadgeUI(newCredits);"
new6 = "        window.updateTicketBadgeUI(newCredits, false);"

if old6 in content:
    content = content.replace(old6, new6)
    print("Fix 6 applied: newCredits badge call updated")
else:
    print("Fix 6 NOT FOUND")

# =====================================
# Fix 7: Stripe success banner for monthly plan
# =====================================
old7 = "            document.getElementById('usage-badge').textContent = '\ud83d\udc9c \u6708\u984d\u30d7\u30e9\u30f3\u6709\u52b9\uff01\u4f7f\u3044\u653e\u984d\u3067\u3059';"
new7 = "            document.getElementById('usage-badge').textContent = '\u267e\ufe0f \u6708\u984d\u30d7\u30e9\u30f3\u6709\u52b9\uff01\u4f7f\u3044\u653e\u984d\u3067\u3059';"

if old7 in content:
    content = content.replace(old7, new7)
    print("Fix 7 applied: Stripe success banner updated")
else:
    print("Fix 7 NOT FOUND")

# Save
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

new_len = len(content)
print(f"\nDone! Original: {original_len} chars, New: {new_len} chars")
