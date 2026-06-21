const fs = require('fs');
let content = fs.readFileSync('public/index.html', 'utf8');

// HTML section remove
content = content.replace(/<!-- 🎤 鳴き声診断 \(NEW\) -->[\s\S]*?<\/div>\s*<div class="hint">今の行動をすべて選んでね/g, '<div class="hint">今の行動をすべて選んでね');

// JS function remove
content = content.replace(/\/\/ 🎤 鳴き声診断機能[\s\S]*?async function getCredits/g, 'async function getCredits');

// Text replacements
content = content.replace(/の行動・鳴き声：/g, 'の行動：');
content = content.replace(/行動・鳴き声のパターン/g, '行動のパターン');
content = content.replace(/「🎤 鳴き声診断」は月額プランまたは都度購入で使えます。/g, '');
content = content.replace(/鳴き声を録音するか、音声・動画ファイルをアップロードして\nAIに解析させることができます。\n※ 月額プランまたは都度購入（80円\/回）でご利用いただけます。/g, '');

fs.writeFileSync('public/index.html', content);
console.log('Successfully patched index.html');
