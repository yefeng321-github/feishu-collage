let els = [], selId = null, idCtr = 1, cvW = 1200, cvH = 900;
let drag = null, resize = null, rot = null;
const cv = document.getElementById('cv');

window.addEventListener('load', () => {
  const imgs = JSON.parse(sessionStorage.getItem('collage_images') || '[]');
  const lib = document.getElementById('lib');
  imgs.forEach((img, i) => {
    const d = document.createElement('div');
    d.className = 'lib-item'; d.draggable = true;
    d.innerHTML = `<img src="${img.url}"><div class="lib-name">${img.name}</div>`;
    d.addEventListener('dragstart', e => e.dataTransfer.setData('idx', i));
    lib.appendChild(d);
  });
  setMsg('从左侧拖拽图片到画布 · 双击文字编辑 · Del 删除');
  updSb();
});

cv.addEventListener('dragover', e => e.preventDefault());
cv.addEventListener('drop', e => {
  e.preventDefault();
  const idx = e.dataTransfer.getData('idx');
  if (idx === '') return;
  const imgs = JSON.parse(sessionStorage.getItem('collage_images') || '[]');
  const img = imgs[+idx];
  const r = cv.getBoundingClientRect();
  addImg(img.url, img.name, e.clientX - r.left - 100, e.clientY - r.top - 75, 200, 150);
});

function addImg(url, name, x, y, w, h) {
  const id = idCtr++;
  els.push({ id, type: 'img', url, name, x, y, w, h, r: 0, o: 1, z: els.length + 1 });
  renderEl(els[els.length - 1]); sel(id); updSb();
}

function addText() {
  const id = idCtr++;
  els.push({ id, type: 'txt', text: '双击编辑文字', x: Math.round(cvW / 2 - 80), y: Math.round(cvH / 2 - 15), w: 200, h: 40, r: 0, o: 1, z: els.length + 1, fs: 24, fc: '#000000', bc: '#ffffff', bt: false, bold: false });
  renderEl(els[els.length - 1]); sel(id); updSb();
}

function renderEl(el) {
  document.getElementById('el-' + el.id)?.remove();
  const div = document.createElement('div');
  div.id = 'el-' + el.id;
  div.className = el.type === 'txt' ? 'txt el' : 'el';
  setXf(div, el);
  if (el.type === 'img') {
    const img = document.createElement('img'); img.src = el.url; img.draggable = false; div.appendChild(img);
  } else {
    setTs(div, el); div.textContent = el.text;
    div.addEventListener('dblclick', e => { e.stopPropagation(); startEdit(el.id); });
  }
  ['tl', 'tr', 'bl', 'br'].forEach(c => {
    const h = document.createElement('div'); h.className = 'hdl ' + c;
    h.addEventListener('mousedown', e => { e.stopPropagation(); startResize(e, el.id, c); });
    div.appendChild(h);
  });
  const rh = document.createElement('div'); rh.className = 'hdl rot';
  rh.addEventListener('mousedown', e => { e.stopPropagation(); startRot(e, el.id); });
  div.appendChild(rh);
  div.addEventListener('mousedown', e => { e.stopPropagation(); startDrag(e, el.id); });
  cv.appendChild(div); showH(el.id, el.id === selId);
}

function setXf(d, el) { d.style.left = el.x + 'px'; d.style.top = el.y + 'px'; d.style.width = el.w + 'px'; d.style.height = el.h + 'px'; d.style.transform = 'rotate(' + el.r + 'deg)'; d.style.opacity = el.o; d.style.zIndex = el.z; }
function setTs(d, el) { d.style.fontSize = el.fs + 'px'; d.style.color = el.fc; d.style.backgroundColor = el.bt ? 'transparent' : el.bc; d.style.fontWeight = el.bold ? 'bold' : 'normal'; }
cv.addEventListener('mousedown', e => { if (e.target === cv) desel(); });
function sel(id) { desel(); selId = id; document.getElementById('el-' + id)?.classList.add('sel'); showH(id, true); updP(); }
function desel() { if (selId !== null) { document.getElementById('el-' + selId)?.classList.remove('sel'); showH(selId, false); } selId = null; document.getElementById('ns').style.display = ''; document.getElementById('props').style.display = 'none'; }
function showH(id, show) { document.getElementById('el-' + id)?.querySelectorAll('.hdl').forEach(h => h.style.display = show ? '' : 'none'); }
function startDrag(e, id) { sel(id); const el = getEl(id); drag = { id, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y }; e.preventDefault(); }
function startResize(e, id, c) { sel(id); const el = getEl(id); resize = { id, c, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y, ow: el.w, oh: el.h }; e.preventDefault(); }
function startRot(e, id) { sel(id); const el = getEl(id); const d = document.getElementById('el-' + id); const r = d.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; rot = { id, cx, cy, sa: Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI, or: el.r }; e.preventDefault(); }
document.addEventListener('mousemove', e => {
  if (drag) { const el = getEl(drag.id); el.x = drag.ox + e.clientX - drag.sx; el.y = drag.oy + e.clientY - drag.sy; const d = document.getElementById('el-' + drag.id); d.style.left = el.x + 'px'; d.style.top = el.y + 'px'; updP(); }
  if (resize) { const el = getEl(resize.id); const dx = e.clientX - resize.sx, dy = e.clientY - resize.sy, c = resize.c; let nx = resize.ox, ny = resize.oy, nw = resize.ow, nh = resize.oh; if (c === 'br') { nw = Math.max(20, resize.ow + dx); nh = Math.max(10, resize.oh + dy); } else if (c === 'bl') { nw = Math.max(20, resize.ow - dx); nx = resize.ox + dx; nh = Math.max(10, resize.oh + dy); } else if (c === 'tr') { nw = Math.max(20, resize.ow + dx); nh = Math.max(10, resize.oh - dy); ny = resize.oy + dy; } else if (c === 'tl') { nw = Math.max(20, resize.ow - dx); nx = resize.ox + dx; nh = Math.max(10, resize.oh - dy); ny = resize.oy + dy; } Object.assign(el, { x: nx, y: ny, w: nw, h: nh }); const d = document.getElementById('el-' + resize.id); d.style.left = nx + 'px'; d.style.top = ny + 'px'; d.style.width = nw + 'px'; d.style.height = nh + 'px'; updP(); }
  if (rot) { const el = getEl(rot.id); el.r = Math.round(Math.atan2(e.clientY - rot.cy, e.clientX - rot.cx) * 180 / Math.PI - rot.sa + rot.or); document.getElementById('el-' + rot.id).style.transform = 'rotate(' + el.r + 'deg)'; updP(); }
});
document.addEventListener('mouseup', () => { drag = null; resize = null; rot = null; });
function startEdit(id) { const el = getEl(id); const d = document.getElementById('el-' + id); d.classList.add('edit'); d.contentEditable = 'true'; d.focus(); d.addEventListener('blur', () => { d.contentEditable = 'false'; d.classList.remove('edit'); el.text = d.textContent; }, { once: true }); }
function updP() {
  if (selId === null) return; const el = getEl(selId);
  document.getElementById('ns').style.display = 'none'; document.getElementById('props').style.display = '';
  const sv = (id, v) => document.getElementById(id).value = String(v);
  sv('px', Math.round(el.x)); sv('py', Math.round(el.y)); sv('pw', Math.round(el.w)); sv('ph', Math.round(el.h)); sv('pr', Math.round(el.r)); sv('po', el.o);
  const isTxt = el.type === 'txt'; document.getElementById('txt-props').style.display = isTxt ? '' : 'none';
  if (isTxt) { sv('pfs', el.fs); sv('pfc', el.fc); sv('pbc', el.bc || '#ffffff'); document.getElementById('pbt').checked = !!el.bt; document.getElementById('pbold').classList.toggle('active', !!el.bold); }
}
function ap(prop, val) { if (selId === null) return; const el = getEl(selId); el[prop] = prop === 'w' ? Math.max(20, val) : prop === 'h' ? Math.max(10, val) : val; setXf(document.getElementById('el-' + selId), el); }
function atp(prop, val) { if (selId === null) return; const el = getEl(selId); const d = document.getElementById('el-' + selId); if (prop === 'fs') { el.fs = val; d.style.fontSize = val + 'px'; } else if (prop === 'fc') { el.fc = val; d.style.color = val; } else if (prop === 'bc') { el.bc = val; if (!el.bt) d.style.backgroundColor = val; } else if (prop === 'bt') { el.bt = val; d.style.backgroundColor = val ? 'transparent' : el.bc; } }
function toggleBold() { if (selId === null) return; const el = getEl(selId); el.bold = !el.bold; document.getElementById('el-' + selId).style.fontWeight = el.bold ? 'bold' : 'normal'; document.getElementById('pbold').classList.toggle('active', el.bold); }
function bringFwd() { if (selId === null) return; const el = getEl(selId); el.z++; document.getElementById('el-' + selId).style.zIndex = el.z; }
function sendBk() { if (selId === null) return; const el = getEl(selId); el.z = Math.max(1, el.z - 1); document.getElementById('el-' + selId).style.zIndex = el.z; }
function delSel() { if (selId === null) return; document.getElementById('el-' + selId)?.remove(); els = els.filter(e => e.id !== selId); selId = null; document.getElementById('ns').style.display = ''; document.getElementById('props').style.display = 'none'; updSb(); }
function resizeCv() { cvW = parseInt(document.getElementById('cvW').value) || 1200; cvH = parseInt(document.getElementById('cvH').value) || 900; cv.style.width = cvW + 'px'; cv.style.height = cvH + 'px'; updSb(); }
function preset(w, h) { document.getElementById('cvW').value = w; document.getElementById('cvH').value = h; resizeCv(); }
function setBg() { cv.style.background = document.getElementById('cvBg').value; }
function autoLayout() { const imgs = els.filter(e => e.type === 'img'); if (!imgs.length) return; const cols = Math.ceil(Math.sqrt(imgs.length)), rows = Math.ceil(imgs.length / cols), pad = 16; const w = Math.floor((cvW - pad * (cols + 1)) / cols), h = Math.floor((cvH - pad * (rows + 1)) / rows); imgs.forEach((el, i) => { el.x = pad + (i % cols) * (w + pad); el.y = pad + Math.floor(i / cols) * (h + pad); el.w = w; el.h = h; el.r = 0; setXf(document.getElementById('el-' + el.id), el); }); setMsg('已自动排列 ' + imgs.length + ' 张图片'); }

function renderBlob() {
  return new Promise((res, rej) => {
    const off = document.createElement('canvas'); off.width = cvW; off.height = cvH;
    const ctx = off.getContext('2d'); ctx.fillStyle = document.getElementById('cvBg').value; ctx.fillRect(0, 0, cvW, cvH);
    const sorted = [...els].sort((a, b) => (a.z || 1) - (b.z || 1));
    let pending = sorted.filter(e => e.type === 'img').length;
    const finish = () => { drawTexts(ctx, sorted); off.toBlob(b => b ? res(b) : rej(new Error('toBlob失败')), 'image/png'); };
    if (pending === 0) { finish(); return; }
    sorted.forEach(el => {
      if (el.type !== 'img') return;
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => { ctx.save(); ctx.globalAlpha = el.o; ctx.translate(el.x + el.w / 2, el.y + el.h / 2); ctx.rotate(el.r * Math.PI / 180); ctx.drawImage(img, -el.w / 2, -el.h / 2, el.w, el.h); ctx.restore(); if (--pending === 0) finish(); };
      img.onerror = () => { if (--pending === 0) finish(); };
      img.src = el.url;
    });
  });
}
function drawTexts(ctx, sorted) { sorted.forEach(el => { if (el.type !== 'txt') return; ctx.save(); ctx.globalAlpha = el.o; ctx.translate(el.x + el.w / 2, el.y + el.h / 2); ctx.rotate(el.r * Math.PI / 180); if (!el.bt) { ctx.fillStyle = el.bc || '#fff'; ctx.fillRect(-el.w / 2, -el.h / 2, el.w, el.h); } ctx.font = (el.bold ? 'bold ' : '') + (el.fs || 24) + 'px -apple-system,"PingFang SC","Microsoft Yahei",sans-serif'; ctx.fillStyle = el.fc || '#000'; ctx.textBaseline = 'middle'; const lines = (el.text || '').split('\n'), lh = (el.fs || 24) * 1.4, tot = lines.length * lh; lines.forEach((line, i) => ctx.fillText(line, -el.w / 2 + 6, -tot / 2 + lh * (i + 0.5))); ctx.restore(); }); }

async function save() {
  const config = JSON.parse(sessionStorage.getItem('collage_config') || '{}');
  if (!config.tableId) { alert('未获取到配置，请关闭后重新从边栏打开'); return; }
  showProg('渲染画布…', 10, '合成图片中');
  try {
    const blob = await renderBlob();
    setProg(50, '上传到飞书…');
    const file = new File([blob], 'collage_' + Date.now() + '.png', { type: 'image/png' });
    // 通过父窗口的 bitable 连接保存
    const bt = window.opener?.__plugin?._bitable;
    if (!bt) throw new Error('请从飞书插件内打开编辑器，不要直接访问此页面');
    const table = await bt.base.getTable(config.tableId);
    const field = await table.getField(config.dstFieldId);
    await field.setValue(config.recordId, file);
    setProg(100, '保存成功！');
    setTimeout(() => { hideProg(); setMsg('✓ 已成功保存到飞书！'); }, 800);
  } catch (e) { hideProg(); alert('保存失败：' + e.message); }
}

function showProg(t, p, m) { document.getElementById('prog').classList.add('open'); document.getElementById('pt').textContent = t; setProg(p, m); }
function setProg(p, m) { document.getElementById('pf').style.width = p + '%'; if (m) document.getElementById('pm').textContent = m; }
function hideProg() { document.getElementById('prog').classList.remove('open'); }
function getEl(id) { return els.find(e => e.id === id); }
function updSb() { document.getElementById('sb-el').textContent = '元素: ' + els.length; document.getElementById('sb-cv').textContent = '画布: ' + cvW + '×' + cvH; }
function setMsg(m) { document.getElementById('sb-msg').textContent = m; }
document.addEventListener('keydown', e => { if (e.target.contentEditable === 'true') return; if (e.key === 'Delete' || e.key === 'Backspace') delSel(); if (e.key === 'Escape') desel(); if (selId === null) return; const el = getEl(selId), d = document.getElementById('el-' + selId), s = e.shiftKey ? 10 : 1; if (e.key === 'ArrowLeft') { el.x -= s; d.style.left = el.x + 'px'; updP(); e.preventDefault(); } if (e.key === 'ArrowRight') { el.x += s; d.style.left = el.x + 'px'; updP(); e.preventDefault(); } if (e.key === 'ArrowUp') { el.y -= s; d.style.top = el.y + 'px'; updP(); e.preventDefault(); } if (e.key === 'ArrowDown') { el.y += s; d.style.top = el.y + 'px'; updP(); e.preventDefault(); } });

window.__editor = { addText, bringFwd, sendBk, delSel, resizeCv, preset, setBg, autoLayout, ap, atp, toggleBold, save };
