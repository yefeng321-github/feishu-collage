const fs = require('fs');

async function build() {
  const rollup = require('rollup');

  console.log('Bundling SDK...');
  const bundle = await rollup.rollup({
    input: 'node_modules/@lark-base-open/js-sdk/dist/index.mjs',
  });

  const { output } = await bundle.generate({
    format: 'iife',
    name: 'LarkSDK',
  });

  // 打包后的代码 + 把 bitable/FieldType 挂到 window
  const sdkCode = output[0].code +
    '\nif(typeof LarkSDK!=="undefined"){' +
    'window.__bitable=LarkSDK.bitable;' +
    'window.__FieldType=LarkSDK.FieldType;}';

  console.log('SDK size:', Math.round(sdkCode.length / 1024) + 'KB');

  if (!fs.existsSync('dist')) fs.mkdirSync('dist');

  const html = fs.readFileSync('index.html', 'utf8');
  const out = html.replace('/*__SDK__*/', sdkCode);
  fs.writeFileSync('dist/index.html', out);
  console.log('Built dist/index.html', Math.round(out.length / 1024) + 'KB');
  console.log('Done!');
}

build().catch(e => { console.error(e.message); process.exit(1); });
