const fs = require('fs');

const indexPath = 'public/index.html';
let html = fs.readFileSync(indexPath, 'utf-8');

// 1. Remove voice diagnosis HTML block
const voiceDiagnosisHtmlRegex = /<!-- 🎤 鳴き声診断 \(NEW\) -->[\s\S]*?<div class="hint">今の行動をすべて選んでね（複数OK）<\/div>/;
html = html.replace(voiceDiagnosisHtmlRegex, '<div class="hint">今の行動をすべて選んでね（複数OK）</div>');

// 2. Remove voice diagnosis JS logic block
const voiceDiagnosisJsRegex = /\/\/ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\s*\/\/ 🎤 鳴き声診断機能\s*\/\/ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[\s\S]*?function selectChipById\(chipId\) \{[\s\S]*?updateSubmitButtons\(\);\s*\}/;
html = html.replace(voiceDiagnosisJsRegex, '');

// 3. Fix callClaude in analyzeBehavior (isFollowUp logic removal)
const analyzeBehaviorRegex1 = /const isFollowUp = window\.voiceDiagnosisUsed \|\| false;/;
const analyzeBehaviorRegex2 = /,\s*isFollowUp\s*\);\s*window\.voiceDiagnosisUsed = false;/;
html = html.replace(analyzeBehaviorRegex1, '');
html = html.replace(analyzeBehaviorRegex2, ',\n          false\n        );');

// 4. Replace footer contact link
const oldFooterLink = '<a href="https://www.instagram.com/ka2kichig" target="_blank" style="color: #ccc; text-decoration: underline; margin: 0 8px;">お問い合わせ</a>';
const newFooterLink = '<a href="#" onclick="openContactModal(event)" style="color: #ccc; text-decoration: underline; margin: 0 8px;">お問い合わせ</a>';
html = html.replace(oldFooterLink, newFooterLink);

// 5. Append Contact Modal HTML after footer
const footerClosingTag = '</footer>';
const modalHtml = `
  <!-- 📩 お問い合わせモーダル -->
  <div id="contact-modal" class="modal">
    <div class="modal-content">
      <h2>お問い合わせ</h2>
      <p style="font-size:13px; color:#666; margin-bottom:16px;">機能へのご要望や不具合のご報告など、お気軽にお問い合わせください。</p>
      
      <div style="text-align: left; margin-bottom: 12px;">
        <label style="font-size: 13px; font-weight: bold; color: var(--primary-dark);">お名前（任意）</label>
        <input type="text" id="contact-name" class="name-input" placeholder="例：山田 太郎" style="width: 100%; box-sizing: border-box; margin-top: 4px;">
      </div>
      
      <div style="text-align: left; margin-bottom: 12px;">
        <label style="font-size: 13px; font-weight: bold; color: var(--primary-dark);">メールアドレス <span style="color: red;">*</span></label>
        <input type="email" id="contact-email" class="name-input" placeholder="例：example@mail.com" required style="width: 100%; box-sizing: border-box; margin-top: 4px;">
      </div>
      
      <div style="text-align: left; margin-bottom: 20px;">
        <label style="font-size: 13px; font-weight: bold; color: var(--primary-dark);">お問い合わせ内容 <span style="color: red;">*</span></label>
        <textarea id="contact-message" placeholder="ここに入力してください（最大500文字）" maxlength="500" required style="width: 100%; height: 120px; padding: 12px; border: 2px solid var(--primary-light); border-radius: 12px; font-family: inherit; font-size: 14px; box-sizing: border-box; margin-top: 4px; resize: none;"></textarea>
      </div>
      
      <button class="btn" id="contact-submit-btn" onclick="submitContact()" style="width: 100%; margin-bottom: 10px;">送信する</button>
      <button class="small-btn" onclick="closeContactModal()">閉じる</button>
    </div>
  </div>`;
if (html.includes(footerClosingTag)) {
  html = html.replace(footerClosingTag, footerClosingTag + '\n' + modalHtml);
} else {
  console.log('Footer closing tag not found!');
}

// 6. Append Contact Modal JS before the end of the script tag
const endOfScriptTag = '    })();\n  </script>\n</body>';
const modalJs = `
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📩 お問い合わせモーダル制御
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    window.openContactModal = function(e) {
      if (e) e.preventDefault();
      const user = window._auth?.currentUser;
      if (user) {
        document.getElementById('contact-email').value = user.email || '';
      }
      document.getElementById('contact-modal').classList.add('show');
    };

    window.closeContactModal = function() {
      document.getElementById('contact-modal').classList.remove('show');
    };

    window.submitContact = async function() {
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const message = document.getElementById('contact-message').value.trim();
      const btn = document.getElementById('contact-submit-btn');

      if (!email || !message) {
        alert('メールアドレスとお問い合わせ内容は必須です🐾');
        return;
      }

      btn.disabled = true;
      btn.textContent = '送信中...';

      try {
        const contactData = {
          name: name,
          email: email,
          content: message, // 既存データ(admin.html)との整合性のため content にする
          createdAt: window._serverTimestamp(),
          isRead: false
        };

        const user = window._auth?.currentUser;
        if (user) {
          contactData.uid = user.uid;
        }

        await window._addDoc(window._collection(window._db, 'contacts'), contactData);
        window.showToast('送信しました！🐾');
        
        // クリア
        document.getElementById('contact-name').value = '';
        document.getElementById('contact-message').value = '';
        
        closeContactModal();
      } catch (err) {
        console.error('お問い合わせ送信エラー:', err);
        alert('送信に失敗しました。時間をおいて再度お試しください。');
      } finally {
        btn.disabled = false;
        btn.textContent = '送信する';
      }
    };
`;
if (html.includes(endOfScriptTag)) {
  html = html.replace(endOfScriptTag, modalJs + endOfScriptTag);
} else {
  console.log('End of script tag not found!');
}

fs.writeFileSync(indexPath, html, 'utf-8');
console.log('Successfully patched index.html');
