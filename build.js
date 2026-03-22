const fs = require('fs');
const path = require('path');

// 找到 SDK 文件
const sdkCandidates = [
  'node_modules/@lark-base-open/js-sdk/dist/js-sdk.umd.js',
  'node_modules/@lark-base-open/js-sdk/dist/js-sdk.umd.min.js',
  'node_modules/@lark-base-open/js-sdk/dist/index.umd.js',
  'node_modules/@lark-base-open/js-sdk/dist/index.umd.min.js',
];

let sdkCode = '';
for (const p of sdkCandidates) {
  if (fs.existsSync(p)) {
    sdkCode = fs.readFileSync(p, 'utf8');
    console.log('✓ SDK found:', p, Math.round(sdkCode.length/1024) + 'KB');
    break;
  }
}

if (!sdkCode) {
  // 列出 dist 目录内容帮助调试
  const distDir = 'node_modules/@lark-base-open/js-sdk/dist';
  if (fs.existsSync(distDir)) {
    console.log('dist files:', fs.readdirSync(distDir));
  } else {
    const sdkDir = 'node_modules/@lark-base-open/js-sdk';
    if (fs.existsSync(sdkDir)) {
      console.log('sdk files:', fs.readdirSync(sdkDir));
    }
  }
  console.error('✗ SDK not found, using CDN fallback');
  sdkCode = '/* SDK_LOAD_FAILED */';
}

if (!fs.existsSync('dist')) fs.mkdirSync('dist');

['index.html', 'editor.html'].forEach(file => {
  if (!fs.existsSync(file)) { console.log('skip', file); return; }
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace('/*__SDK__*/', sdkCode);
  fs.writeFileSync('dist/' + file, html);
  console.log('✓ Built dist/' + file);
});

console.log('Build done');
