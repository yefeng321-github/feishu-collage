const fs = require('fs');
const path = require('path');

const sdkRoot = 'node_modules/@lark-base-open/js-sdk';

function findJs(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) results.push(...findJs(full));
    else if (f.endsWith('.js')) results.push({ path: full, size: stat.size });
  }
  return results;
}

console.log('SDK dir exists:', fs.existsSync(sdkRoot));
const allJs = findJs(sdkRoot);
console.log('All JS files:');
allJs.forEach(f => console.log(' ', f.path, Math.round(f.size/1024) + 'KB'));

const candidates = [
  'node_modules/@lark-base-open/js-sdk/dist/js-sdk.umd.js',
  'node_modules/@lark-base-open/js-sdk/dist/js-sdk.umd.min.js',
  'node_modules/@lark-base-open/js-sdk/dist/index.umd.js',
  'node_modules/@lark-base-open/js-sdk/dist/index.umd.min.js',
];

let sdkCode = null;
for (const c of candidates) {
  if (fs.existsSync(c)) {
    sdkCode = fs.readFileSync(c, 'utf8');
    console.log('Using:', c, Math.round(sdkCode.length/1024) + 'KB');
    break;
  }
}

if (!sdkCode && allJs.length > 0) {
  allJs.sort((a, b) => b.size - a.size);
  sdkCode = fs.readFileSync(allJs[0].path, 'utf8');
  console.log('Fallback:', allJs[0].path, Math.round(sdkCode.length/1024) + 'KB');
}

if (!sdkCode) { console.error('ERROR: No SDK found!'); process.exit(1); }

if (!fs.existsSync('dist')) fs.mkdirSync('dist');

for (const file of ['index.html', 'editor.html']) {
  if (!fs.existsSync(file)) { console.log('Skip:', file); continue; }
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace('/*__SDK__*/', sdkCode);
  fs.writeFileSync('dist/' + file, html);
  console.log('Built dist/' + file, Math.round(fs.statSync('dist/'+file).size/1024) + 'KB');
}

console.log('Done!');
