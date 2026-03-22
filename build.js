const fs = require('fs');
const path = require('path');

// 递归查找所有 .js 文件
function findFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) findFiles(full, results);
    else if (f.endsWith('.js')) results.push(full);
  }
  return results;
}

const sdkRoot = 'node_modules/@lark-base-open/js-sdk';
console.log('SDK dir exists:', fs.existsSync(sdkRoot));

if (fs.existsSync(sdkRoot)) {
  const allJs = findFiles(sdkRoot);
  console.log('All JS files:');
  allJs.forEach(f => console.log(' ', f, Math.round(fs.statFileSync ? 0 : fs.statSync(f).size/1024) + 'KB'));
}

// 按优先级尝试 UMD 文件
const candidates = [
  'node_modules/@lark-base-open/js-sdk/dist/js-sdk.umd.js',
  'node_modules/@lark-base-open/js-sdk/dist/js-sdk.umd.min.js',
  'node_modules/@lark-base-open/js-sdk/dist/index.umd.js',
  'node_modules/@lark-base-open/js-sdk/dist/index.umd.min.js',
  'node_modules/@lark-base-open/js-sdk/dist/index.js',
  'node_modules/@lark-base-open/js-sdk/index.js',
];

let sdkCode = null;
let sdkPath = null;
for (const c of candidates) {
  if (fs.existsSync(c)) {
    sdkCode = fs.readFileSync(c, 'utf8');
    sdkPath = c;
    console.log('Using SDK:', c, Math.round(sdkCode.length/1024) + 'KB');
    break;
  }
}

if (!sdkCode) {
  // 找不到 UMD，用最大的 JS 文件
  const allJs = findFiles(sdkRoot);
  if (allJs.length) {
    allJs.sort((a,b) => fs.statSync(b).size - fs.statSync(a).size);
    sdkPath = allJs[0];
    sdkCode = fs.readFileSync(sdkPath, 'utf8');
    console.log('Fallback to largest file:', sdkPath, Math.round(sdkCode.length/1024)+'KB');
  }
}

if (!sdkCode) {
  console.error('ERROR: Cannot find SDK file!');
  process.exit(1);
}

if (!fs.existsSync('dist')) fs.mkdirSync('dist');

for (const file of ['index.html', 'editor.html']) {
  if (!fs.existsSync(file)) { console.log('Skip:', file); continue; }
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace('/*__SDK__*/', sdkCode);
  fs.writeFileSync('dist/' + file, html);
  console.log('Built dist/' + file, Math.round(fs.statSync('dist/'+file).size/1024)+'KB');
}

console.log('Build complete!');
