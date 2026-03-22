const fs = require('fs');
const path = require('path');

async function build() {
  // 用 rollup 把 ESM 格式的 SDK 打包成 IIFE（可直接在 script 标签使用）
  const rollup = require('rollup');
  
  console.log('Bundling SDK with rollup...');
  
  const bundle = await rollup.rollup({
    input: 'node_modules/@lark-base-open/js-sdk/dist/index.mjs',
    external: [],
  });
  
  const { output } = await bundle.generate({
    format: 'iife',
    name: 'LarkBaseSDK',
    globals: {},
  });
  
  const sdkCode = output[0].code;
  console.log('SDK bundled:', Math.round(sdkCode.length/1024) + 'KB');
  
  // 追加一行：把 exports 挂到 window 上
  const sdkWithExports = sdkCode + '\n' +
    'if(typeof window !== "undefined" && typeof LarkBaseSDK !== "undefined"){' +
    'window.bitable = LarkBaseSDK.bitable;' +
    'window.FieldType = LarkBaseSDK.FieldType;' +
    '}';
  
  if (!fs.existsSync('dist')) fs.mkdirSync('dist');
  
  for (const file of ['index.html', 'editor.html']) {
    if (!fs.existsSync(file)) { console.log('Skip:', file); continue; }
    let html = fs.readFileSync(file, 'utf8');
    html = html.replace('/*__SDK__*/', sdkWithExports);
    fs.writeFileSync('dist/' + file, html);
    console.log('Built dist/' + file, Math.round(fs.statSync('dist/'+file).size/1024) + 'KB');
  }
  
  console.log('Done!');
}

build().catch(e => { console.error('Build error:', e.message); process.exit(1); });
