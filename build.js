const fs = require('fs');
const path = require('path');

// 读取所有 chunk 文件并拼接，最后添加挂载代码
const distDir = 'node_modules/@lark-base-open/js-sdk/dist';
const files = fs.readdirSync(distDir).filter(f => f.endsWith('.mjs')).sort();
console.log('Chunk files:', files);

let combined = '"use strict";\n';
for (const f of files) {
  let code = fs.readFileSync(path.join(distDir, f), 'utf8');
  // 去掉 import/export 语句
  code = code.replace(/^import\s+.*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, '');
  code = code.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '');
  code = code.replace(/^export\s+(default\s+)?/gm, '');
  combined += code + '\n';
}

// 挂载
combined += `
try {
  window.__bitable = bitable;
  window.__FieldType = FieldType || {};
  console.log('[SDK] OK, bitable:', typeof bitable, typeof bitable.base);
} catch(e) {
  console.error('[SDK] mount failed:', e.message);
}
`;

const sdkCode = `(function(){\n${combined}\n})();`;
console.log('SDK size:', Math.round(sdkCode.length/1024) + 'KB');

if (!fs.existsSync('dist')) fs.mkdirSync('dist');
const html = fs.readFileSync('index.html', 'utf8');
const out = html.replace('/*__SDK__*/', sdkCode);
fs.writeFileSync('dist/index.html', out);
console.log('Built:', Math.round(out.length/1024) + 'KB');
