const fs = require('fs');

async function build() {
  const rollup = require('rollup');

  console.log('Bundling SDK...');
  
  // 先看看 SDK 的 index.mjs 导出了什么
  const sdkPkg = JSON.parse(fs.readFileSync('node_modules/@lark-base-open/js-sdk/package.json','utf8'));
  console.log('SDK version:', sdkPkg.version);
  console.log('SDK main:', sdkPkg.main);
  console.log('SDK module:', sdkPkg.module);
  console.log('SDK exports:', JSON.stringify(sdkPkg.exports).slice(0,200));

  const entry = sdkPkg.module || sdkPkg.main || 'node_modules/@lark-base-open/js-sdk/dist/index.mjs';
  console.log('Using entry:', entry);

  const bundle = await rollup.rollup({
    input: 'node_modules/@lark-base-open/js-sdk/' + entry.replace('./',''),
    onwarn: () => {},
  });

  const { output } = await bundle.generate({
    format: 'iife',
    name: 'LarkSDK',
  });

  const rawCode = output[0].code;
  console.log('Raw SDK size:', Math.round(rawCode.length/1024)+'KB');
  
  // 打印 LarkSDK 的 keys，确认 bitable 在哪
  const sdkCode = rawCode + '\n' +
    'try{' +
    'console.log("[SDK] LarkSDK keys:", Object.keys(LarkSDK).join(","));' +
    'window.__bitable = LarkSDK.bitable || LarkSDK.default && LarkSDK.default.bitable;' +
    'window.__FieldType = LarkSDK.FieldType || {};' +
    'console.log("[SDK] bitable:", typeof window.__bitable);' +
    '}catch(e){console.error("[SDK] mount error:",e.message);}';

  console.log('Final SDK size:', Math.round(sdkCode.length/1024)+'KB');

  if (!fs.existsSync('dist')) fs.mkdirSync('dist');
  const html = fs.readFileSync('index.html','utf8');
  const out = html.replace('/*__SDK__*/', sdkCode);
  fs.writeFileSync('dist/index.html', out);
  console.log('Built dist/index.html', Math.round(out.length/1024)+'KB');
  console.log('Done!');
}

build().catch(e => { console.error('Build error:', e.message); process.exit(1); });
