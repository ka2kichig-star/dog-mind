const fs = require('fs');

let content = fs.readFileSync('public/index.html', 'utf8');

// Replace link
content = content.replace(
  '<a href="https://www.instagram.com/ka2kichig" target="_blank" style="color: #ccc; text-decoration: underline; margin: 0 8px;">お問い合わせ</a>',
  '<a href="#" onclick="event.preventDefault(); window.showContactModal();" style="color: #ccc; text-decoration: underline; margin: 0 8px;">お問い合わせ</a>'
);

const modalHtml = `
  <!-- お問い合わせモーダル -->
  <div class="pay-modal" id="contact-modal">
    <div class="pay-box" style="max-height: 90vh; overflow-y: auto;">
      <div style="font-size:44px;margin-bottom:10px">✉️</div>
      <h3>お問い合わせ</h3>
      <p style="margin-bottom: 20px;">ご質問・ご要望などお気軽にご連絡ください。<br>※返信には数日かかる場合があります。</p>
      
      <div style="text-align: left; margin-bottom: 16px;">
        <span class="label">お名前（任意）</span>
        <input class="text-input" id="contact-name" type="text" placeholder="例：山田 太郎">
        
        <span class="label">メールアドレス（必須）</span>
        <input class="text-input" id="contact-email" type="email" placeholder="返信用アドレス">
        
        <span class="label">お問い合わせ内容（必須）</span>
        <textarea id="contact-message" placeholder="ここに入力してください" style="height: 120px; width: 100%; box-sizing: border-box; padding: 12px; border-radius: 8px; border: 1px solid #ddd; font-family: inherit; font-size: 16px; margin-top: 4px; resize: vertical;"></textarea>
      </div>
      
      <button class="btn" style="width:100%; box-sizing: border-box; margin-bottom: 12px;" onclick="window.submitContactForm()">
        送信する
      </button>
      <button class="cancel-btn" onclick="document.getElementById('contact-modal').classList.remove('show')">閉じる</button>
    </div>
  </div>
`;

// Insert modal before footer
content = content.replace('<div class="footer" id="footer-el">', modalHtml + '\n  <div class="footer" id="footer-el">');

const jsLogic = `
      // --- お問い合わせ機能 ---
      window.showContactModal = () => {
        document.getElementById('contact-modal').classList.add('show');
        document.getElementById('contact-name').value = '';
        document.getElementById('contact-email').value = '';
        document.getElementById('contact-message').value = '';
      };

      window.submitContactForm = async () => {
        const name = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const contentVal = document.getElementById('contact-message').value.trim();

        if (!email) {
          window.showToast('メールアドレスを入力してください。', 'error');
          return;
        }
        if (!contentVal) {
          window.showToast('お問い合わせ内容を入力してください。', 'error');
          return;
        }

        try {
          const contactsRef = collection(db, 'contacts');
          await addDoc(contactsRef, {
            name: name || '名前なし',
            email: email,
            subject: 'ユーザーからのお問い合わせ',
            content: contentVal,
            createdAt: serverTimestamp(),
            isRead: false
          });

          document.getElementById('contact-modal').classList.remove('show');
          window.showToast('送信しました！', 'success');
        } catch (err) {
          console.error("お問い合わせ送信エラー:", err);
          window.showToast('送信に失敗しました。', 'error');
        }
      };
`;

// Insert JS logic before the closing script tag
content = content.replace('    })();\n  </script>', jsLogic + '\n    })();\n  </script>');

fs.writeFileSync('public/index.html', content);
console.log('Successfully patched index.html with contact modal');
