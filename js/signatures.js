/* My Signatures: draw, type, save, manage. Stored in localStorage as transparent PNGs. */
(function () {
  'use strict';
  const { $, toast, esc } = window.PP;
  const KEY = 'paperpal.signatures.v1';

  const store = {
    load() {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; }
      catch (e) { return []; }
    },
    save(list) {
      try { localStorage.setItem(KEY, JSON.stringify(list)); }
      catch (e) { toast('Could not save. Storage might be full.'); }
    }
  };

  function getDefault() {
    const list = store.load();
    return list.find(s => s.isDefault) || list[0] || null;
  }

  /* ---------- drawing pad ---------- */
  const canvas = $('sigCanvas');
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const CW = 600, CH = 220;
  canvas.width = CW * DPR; canvas.height = CH * DPR;
  ctx.scale(DPR, DPR);
  ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1d2433';

  let strokes = [];
  let current = null;

  function redraw() {
    ctx.clearRect(0, 0, CW, CH);
    ctx.strokeStyle = '#1d2433';
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    strokes.forEach(stroke => {
      if (stroke.length < 2) {
        if (stroke.length === 1) {
          ctx.beginPath();
          ctx.arc(stroke[0].x, stroke[0].y, 1.6, 0, Math.PI * 2);
          ctx.fillStyle = '#1d2433';
          ctx.fill();
        }
        return;
      }
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length - 1; i++) {
        const mx = (stroke[i].x + stroke[i + 1].x) / 2;
        const my = (stroke[i].y + stroke[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, mx, my);
      }
      ctx.lineTo(stroke[stroke.length - 1].x, stroke[stroke.length - 1].y);
      ctx.stroke();
    });
  }

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (CW / r.width), y: (e.clientY - r.top) * (CH / r.height) };
  }

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    current = [pos(e)];
    strokes.push(current);
  });
  canvas.addEventListener('pointermove', e => {
    if (!current) return;
    e.preventDefault();
    current.push(pos(e));
    redraw();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
    canvas.addEventListener(ev, () => { current = null; })
  );

  $('sigUndo').addEventListener('click', () => { strokes.pop(); redraw(); });
  $('sigClear').addEventListener('click', () => { strokes = []; redraw(); });

  /* ---------- typed signatures ---------- */
  const typeCanvas = $('sigTypeCanvas');
  const tctx = typeCanvas.getContext('2d');
  typeCanvas.width = 600 * DPR; typeCanvas.height = 180 * DPR;
  tctx.scale(DPR, DPR);
  const FONTS = [
    "'Brush Script MT','Segoe Script','Apple Chancery',cursive",
    "'Snell Roundhand','Lucida Handwriting','Apple Chancery',cursive",
    "'Segoe Script','Bradley Hand','Chalkboard SE',cursive"
  ];
  let fontIdx = 0;

  function renderTyped() {
    const name = $('sigTypeName').value.trim() || 'Your Name';
    tctx.clearRect(0, 0, 600, 180);
    tctx.fillStyle = '#1d2433';
    tctx.font = '64px ' + FONTS[fontIdx];
    tctx.textAlign = 'center';
    tctx.textBaseline = 'middle';
    tctx.fillText(name, 300, 95);
  }
  $('sigTypeName').addEventListener('input', renderTyped);
  document.querySelectorAll('.font-opt').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.font-opt').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    fontIdx = parseInt(b.dataset.font, 10);
    renderTyped();
  }));
  renderTyped();

  /* ---------- persistence ---------- */
  function addSignature(label, dataURL) {
    const list = store.load();
    list.push({
      id: 'sig_' + Date.now().toString(36) + Math.floor(Math.random() * 1e4),
      label: label || 'Untitled',
      dataURL,
      isDefault: list.length === 0,
      created: Date.now()
    });
    store.save(list);
    renderList();
    toast('Signature saved. Looking sharp.');
  }

  $('sigSaveDraw').addEventListener('click', () => {
    if (!strokes.length) { toast('Draw something first. Even a squiggle counts.'); return; }
    // export trimmed transparent PNG
    const out = document.createElement('canvas');
    out.width = canvas.width; out.height = canvas.height;
    out.getContext('2d').drawImage(canvas, 0, 0);
    addSignature($('sigLabel').value.trim(), out.toDataURL('image/png'));
    $('sigLabel').value = '';
  });

  $('sigSaveType').addEventListener('click', () => {
    const name = $('sigTypeName').value.trim();
    if (!name) { toast('Type your name first.'); return; }
    addSignature($('sigTypeLabel').value.trim() || name, typeCanvas.toDataURL('image/png'));
    $('sigTypeLabel').value = '';
  });

  function renderList() {
    const list = store.load();
    const box = $('sigList');
    $('sigCount').textContent = list.length ? '(' + list.length + ')' : '';
    $('sigEmpty').style.display = list.length ? 'none' : 'block';
    box.innerHTML = '';
    list.forEach(sig => {
      const div = document.createElement('div');
      div.className = 'sig-item';
      div.innerHTML =
        '<img src="' + sig.dataURL + '" alt="signature preview">' +
        '<div class="sig-meta"><div class="sig-name">' + esc(sig.label) +
        (sig.isDefault ? '<span class="default-badge">default</span>' : '') + '</div></div>' +
        '<div class="mini-btns"></div>';
      const btns = div.querySelector('.mini-btns');
      if (!sig.isDefault) {
        const d = document.createElement('button');
        d.className = 'mini-btn'; d.textContent = 'Set default';
        d.addEventListener('click', () => {
          const l = store.load();
          l.forEach(s => { s.isDefault = (s.id === sig.id); });
          store.save(l); renderList();
          if (window.PP.refreshSignPdfSigs) window.PP.refreshSignPdfSigs();
        });
        btns.appendChild(d);
      }
      const del = document.createElement('button');
      del.className = 'mini-btn'; del.textContent = 'Delete';
      del.addEventListener('click', () => {
        if (!confirm('Delete "' + sig.label + '"? This cannot be undone.')) return;
        let l = store.load().filter(s => s.id !== sig.id);
        if (sig.isDefault && l.length) l[0].isDefault = true;
        store.save(l); renderList();
        if (window.PP.refreshSignPdfSigs) window.PP.refreshSignPdfSigs();
      });
      btns.appendChild(del);
      box.appendChild(div);
    });
  }

  window.PP.signatures = { store, getDefault, renderList };
  renderList();
})();
