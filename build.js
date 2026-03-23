const fs = require('fs');

async function build() {
  const rollup = require('rollup');

  const sdkPkg = JSON.parse(fs.readFileSync('node_modules/@lark-base-open/js-sdk/package.json','utf8'));
  console.log('SDK version:', sdkPkg.version);

  // 直接用已知的入口文件
  const entry = 'node_modules/@lark-base-open/js-sdk/dist/index.mjs';
  console.log('Entry:', entry, 'exists:', fs.existsSync(entry));

  const bundle = await rollup.rollup({
    input: entry,
    onwarn: () => {},
  });

  const { output } = await bundle.generate({
    format: 'iife',
    name: 'LarkSDK',
  });

  const rawCode = output[0].code;
  console.log('SDK size:', Math.round(rawCode.length/1024) + 'KB');

  const sdkCode = rawCode + '\n' +
    'try{' +
    'var _k=Object.keys(LarkSDK);' +
    'console.log("[SDK] keys:", _k.join(","));' +
    'window.__bitable=LarkSDK.bitable;' +
    'window.__FieldType=LarkSDK.FieldType||{};' +
    'console.log("[SDK] bitable type:", typeof window.__bitable);' +
    '}catch(e){console.error("[SDK] error:",e.message);}';

  if (!fs.existsSync('dist')) fs.mkdirSync('dist');
  const html = fs.readFileSync('index.html','utf8');
  const out = html.replace('/*__SDK__*/', sdkCode);
  fs.writeFileSync('dist/index.html', out);
  console.log('Built dist/index.html', Math.round(out.length/1024) + 'KB');
  console.log('Done!');
}

build().catch(e => { console.error('Build error:', e.message); process.exit(1); });
