const fs = require('fs');

// 1. functions/index.js
let fnContent = fs.readFileSync('functions/index.js', 'utf8');
fnContent = fnContent.replace(/const { password } = req\.body;\s*if \(password !== "0651"\) {\s*res\.status\(401\)\.json\({ error: "Unauthorized: Invalid password" }\);\s*return;\s*}/g,
`      let decoded;
      try {
        decoded = await verifyToken(req);
      } catch (err) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      if (decoded.uid !== "OfVGpwdVoUN1peNS1bjGKc1ZG2R2") {
        res.status(403).json({ error: "Forbidden" });
        return;
      }`);
fs.writeFileSync('functions/index.js', fnContent);

// 2. public/admin.html
let htmlContent = fs.readFileSync('public/admin.html', 'utf8');

// Replace auth imports
htmlContent = htmlContent.replace(/import { getFirestore, doc, onSnapshot, collection, getDocs } from 'https:\/\/www\.gstatic\.com\/firebasejs\/10\.7\.0\/firebase-firestore\.js';/, 
`import { getFirestore, doc, onSnapshot, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
    import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';`);

// Replace auth HTML
htmlContent = htmlContent.replace(/<div style="margin-bottom:16px;">[\s\S]*?<input type="password" id="admin-password-input"[\s\S]*?<\/div>\s*<button class="btn-large" style="width:100%; border-radius:30px;" onclick="verifyAdminPassword\(\)">ログイン<\/button>/,
`<button class="btn-large" style="width:100%; border-radius:30px; background: white; color: #333; border: 1px solid #ccc; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="window.loginAdminWithGoogle()"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" alt="Google">Googleでログイン</button>`);

// Replace JS Auth Logic
htmlContent = htmlContent.replace(/    const db = getFirestore\(app\);\s*const FUNCTIONS_BASE_URL = 'https:\/\/asia-northeast1-wanwan-translator\.cloudfunctions\.net';/,
`    const db = getFirestore(app);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    let adminToken = "";

    const FUNCTIONS_BASE_URL = 'https://asia-northeast1-wanwan-translator.cloudfunctions.net';`);

htmlContent = htmlContent.replace(/    \/\/ 1\. Password Auth flow[\s\S]*?window\.addEventListener\('DOMContentLoaded'[\s\S]*?loadData\(\);\s*}\s*else\s*{\s*errEl\.textContent = "❌ パスワードが違います。";\s*errEl\.style\.display = 'block';\s*}\s*};/,
`    // 1. Google Auth flow
    window.addEventListener('DOMContentLoaded', () => {
      auth.onAuthStateChanged(user => {
        if (user && user.uid === "OfVGpwdVoUN1peNS1bjGKc1ZG2R2") {
          document.getElementById('admin-user-email').textContent = user.email || "管理者";
          user.getIdToken().then(token => {
            adminToken = token;
            authView.style.display = 'none';
            dashboardView.style.display = 'flex';
            loadConfig();
            loadData();
          });
        } else if (user) {
          // Admin UID didn't match
          showAuthError("❌ 管理者権限がありません");
          signOut(auth);
          dashboardView.style.display = 'none';
          authView.style.display = 'flex';
          loader.style.display = 'none';
        } else {
          dashboardView.style.display = 'none';
          authView.style.display = 'flex';
          loader.style.display = 'none';
        }
      });
    });

    window.loginAdminWithGoogle = () => {
      const errEl = document.getElementById('auth-error-msg');
      errEl.style.display = 'none';
      signInWithPopup(auth, provider).catch(err => {
        showAuthError("❌ ログインエラー: " + err.message);
      });
    };`);

// Replace logout
htmlContent = htmlContent.replace(/window\.logoutAdmin = \(\) => {\s*sessionStorage\.removeItem\('admin_password'\);\s*window\.location\.reload\(\);\s*};/,
`window.logoutAdmin = () => {
      signOut(auth).then(() => {
        window.location.reload();
      });
    };`);

// Update loadData
htmlContent = htmlContent.replace(/const password = sessionStorage\.getItem\('admin_password'\);\s*if \(!password\) {\s*logoutAdmin\(\);\s*return;\s*}/, 
`if (!adminToken) {
        logoutAdmin();
        return;
      }`);

htmlContent = htmlContent.replace(/body: JSON\.stringify\({ password }\)/,
`headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken }`);

// Update runAdminAction
htmlContent = htmlContent.replace(/const password = sessionStorage\.getItem\('admin_password'\);\s*if \(!password\) {\s*alert\("パスワードが設定されていません。一度リロードしてください。"\);\s*return;\s*}/,
`if (!adminToken) {
        alert("認証されていません。一度リロードしてください。");
        return;
      }`);

htmlContent = htmlContent.replace(/body: JSON\.stringify\({ password, \.\.\.params }\)/,
`headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken },
          body: JSON.stringify(params)`);

fs.writeFileSync('public/admin.html', htmlContent);
console.log('Successfully patched admin.html');
