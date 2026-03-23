const fs = require('fs');
const path = require('path');

async function build() {
  const rollup = require('rollup');

  console.log('Bundling SDK...');
  const entry = 'node_modules/@lark-base-open/js-sdk/dist/index.mjs';
  console.log('Entry exists:', fs.existsSync(entry));

  const bundle = await rollup.rollup({
    input: entry,
    onwarn: () => {},
  });

  // 用 es 格式，手动包成 IIFE
  const { output } = await bundle.generate({
    format: 'es',
  });

  let code = '';
  for (const chunk of output) {
    if (chunk.type === 'chunk') code += chunk.code + '\n';
  }

  // 把 export { bitable, FieldType, ... } 找出来挂到 window
  const exportMatch = code.match(/export\s*\{([^}]+)\}/);
  let exports = [];
  if (exportMatch) {
    exports = exportMatch[1].split(',').map(s => s.trim().split(/\s+as\s+/).pop().trim());
    code = code.replace(/export\s*\{[^}]+\}\s*;?/, '');
  }
  // 移除所有 export 关键字
  code = code.replace(/^export (const|let|var|function|class|default) /mg, '$1 ');

  console.log('Exports found:', exports.join(', '));

  // 挂载所有导出到 window.__sdk_xxx
  const mountCode = exports.map(name =>
    `try{if(typeof ${name}!=="undefined")window.__sdk_${name}=${name};}catch(e){}`
  ).join('\n');

  // 特别确保 bitable 正确挂载
  const finalMount =
    'window.__bitable=window.__sdk_bitable;' +
    'window.__FieldType=window.__sdk_FieldType||{};' +
    'console.log("[SDK] bitable type:", typeof window.__bitable);' +
    'if(window.__bitable)console.log("[SDK] bitable.base type:", typeof window.__bitable.base);';

  const sdkCode = '(function(){\n"use strict";\n' + code + '\n' + mountCode + '\n' + finalMount + '\n})();';

  console.log('SDK size:', Math.round(sdkCode.length/1024) + 'KB');

  if (!fs.existsSync('dist')) fs.mkdirSync('dist');
  const html = fs.readFileSync('index.html', 'utf8');
  const out = html.replace('/*__SDK__*/', sdkCode);
  fs.writeFileSync('dist/index.html', out);
  console.log('Built dist/index.html', Math.round(out.length/1024) + 'KB');
  console.log('Done!');
}

build().catch(e => { console.error('Build error:', e.message); process.exit(1); });
