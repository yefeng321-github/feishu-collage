import { bitable, FieldType } from '@lark-base-open/js-sdk';

const S = { table: null, tableId: null, recordId: null, images: [] };

function el(id) { return document.getElementById(id); }

function showSt(id, type, msg) {
  const e = el(id);
  e.className = 'status s-' + type;
  e.innerHTML = '<div class="sdot"></div><span>' + msg + '</span>';
  e.classList.remove('hidden');
}
function hideSt(id) { el(id).classList.add('hidden'); }

async function loadFields(table) {
  try {
    const fields = await table.getFieldMetaList();
    const att = fields.filter(f => f.type === FieldType.Attachment);
    if (!att.length) {
      showSt('cfg-status', 'warn', '当前表没有附件字段');
      el('sel-src').innerHTML = '<option value="">-- 无附件字段 --</option>';
      el('sel-dst').innerHTML = '<option value="">-- 无附件字段 --</option>';
      return;
    }
    hideSt('cfg-status');
    const opts = att.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    el('sel-src').innerHTML = opts;
    el('sel-dst').innerHTML = opts;
    el('sel-src').value = att[0].id;
    el('sel-dst').value = att.length > 1 ? att[1].id : att[0].id;
  } catch (e) {
    showSt('cfg-status', 'err', '加载字段失败：' + e.message);
  }
}

async function loadImages(recordId) {
  const srcId = el('sel-src').value;
  if (!srcId || !S.table) return;
  el('hint').classList.add('hidden');
  el('img-grid').innerHTML = '';
  el('btn-editor').classList.add('hidden');
  showSt('img-status', 'info', '加载图片中…');
  try {
    const field = await S.table.getField(srcId);
    const atts = await field.getValue(recordId);
    if (!atts || !atts.length) { showSt('img-status', 'warn', '该行没有附件，请点击其他行'); return; }
    const urls = await field.getAttachmentUrls(recordId);
    S.images = atts.map((a, i) => ({
      name: a.name, url: urls[i] || '', token: a.token,
      size: a.size, type: a.type, permission: a.permission || null
    })).filter(x => x.url && x.type && x.type.startsWith('image/'));
    if (!S.images.length) { showSt('img-status', 'warn', '附件中没有图片格式的文件'); return; }
    const grid = el('img-grid');
    S.images.forEach(img => {
      const d = document.createElement('div');
      d.className = 'img-thumb';
      d.innerHTML = `<img src="${img.url}" loading="lazy"><div class="img-thumb-name">${img.name}</div>`;
      grid.appendChild(d);
    });
    showSt('img-status', 'ok', `✓ 已加载 ${S.images.length} 张图片`);
    el('btn-editor').classList.remove('hidden');
  } catch (e) {
    showSt('img-status', 'err', '加载失败：' + e.message);
  }
}

async function init() {
  try {
    const table = await bitable.base.getActiveTable();
    S.table = table;
    S.tableId = table.id;
    await loadFields(table);

    bitable.base.onSelectionChange(async ({ data }) => {
      if (data.tableId && data.tableId !== S.tableId) {
        S.tableId = data.tableId;
        const t = await bitable.base.getTable(data.tableId);
        S.table = t;
        await loadFields(t);
      }
      if (data.recordId && data.recordId !== S.recordId) {
        S.recordId = data.recordId;
        await loadImages(data.recordId);
      }
    });

    const sel = await bitable.base.getSelection();
    if (sel.recordId) {
      S.recordId = sel.recordId;
      await loadImages(sel.recordId);
    }
  } catch (e) {
    showSt('cfg-status', 'err', '初始化失败：' + e.message);
  }
}

// 暴露 bitable 给编辑器窗口通过 window.opener 调用
window.__plugin = {
  _bitable: bitable,
  onSrcChange() { if (S.recordId) loadImages(S.recordId); },
  openEditor() {
    const dstId = el('sel-dst').value;
    if (!S.images.length) { alert('请先选择一行有图片的记录'); return; }
    if (!dstId) { alert('请先选择保存目标字段'); return; }
    sessionStorage.setItem('collage_images', JSON.stringify(S.images));
    sessionStorage.setItem('collage_config', JSON.stringify({
      tableId: S.tableId, recordId: S.recordId, dstFieldId: dstId
    }));
    window.open('./editor.html', '_blank', 'width=1280,height=820,resizable=yes');
  }
};

init();
