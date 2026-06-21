const fs = require('fs');

// 1. functions/index.js
let fnContent = fs.readFileSync('functions/index.js', 'utf8');
fnContent = fnContent.replace(/if \(decoded\.uid !== "OfVGpwdVoUN1peNS1bjGKc1ZG2R2"\)/g, 'if (decoded.email !== "ka2kichi@gmail.com")');
fnContent = fnContent.replace(/const uid = "OfVGpwdVoUN1peNS1bjGKc1ZG2R2";/g, '// Admin operations target user dynamically, or keeping old logic for specific UID');
fs.writeFileSync('functions/index.js', fnContent);

// 2. public/admin.html
let htmlContent = fs.readFileSync('public/admin.html', 'utf8');
htmlContent = htmlContent.replace(/if \(user && user\.uid === "OfVGpwdVoUN1peNS1bjGKc1ZG2R2"\)/g, 'if (user && user.email === "ka2kichi@gmail.com")');
fs.writeFileSync('public/admin.html', htmlContent);

console.log('Successfully patched email authorization');
