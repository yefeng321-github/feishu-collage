const fs = require('fs');
const path = require('path');

const sdkRoot = 'node_modules/@lark-base-open/js-sdk';

// 列出目录所有内容（包括子目录）
function listAll(dir, indent = '') {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      console.log(indent + '[DIR] ' + f);
      listAll(full, indent + '  ');
    } else {
      console.log(indent + f + ' (' + Math.round(stat.size/1024) + 'KB)');
    }
  }
}

console.log('=== SDK Structure ===');
listAll(sdkRoot);

// 递归找所有 .js 文件
function findJs(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) results.push(...findJs(full));
    else if (f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.cjs')) {
      results.push({ path: full, size: stat.size });
    }
  }
  return results;
}

const allJs = findJs(sdkRoot);
console.log('\n=== All JS/MJS/CJS files ===');
allJs.forEach(f => console.log(f.path, Math.round(f.size/1024) + 'KB'));

// 找最大的 js 文件作为 SDK
if (allJs.length === 0) {
  console.error('ERROR: No JS files found in SDK!');
  process.exit(1);
}

allJs.sort((a, b) => b.size - a.size);
const sdkCode = fs.readFileSync(allJs[0].path, 'utf8');
console.log('\nUsing:', allJs[0].path, Math.round(sdkCode.length/1024) + 'KB');

if (!fs.existsSync('dist')) fs.mkdirSync('dist');

for (const file of ['index.html', 'editor.html']) {
  if (!fs.existsSync(file)) { console.log('Skip:', file); continue; }
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace('/*__SDK__*/', sdkCode);
  fs.writeFileSync('dist/' + file, html);
  console.log('Built dist/' + file, Math.round(fs.statSync('dist/'+file).size/1024) + 'KB');
}

console.log('Done!');
