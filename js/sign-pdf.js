/* Sign PDF: render with pdf.js, place saved signatures by tapping, embed with pdf-lib. */
(function () {
  'use strict';
  const { $, toast, setStatus, showError, hideError, download, esc } = window.PP;

  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  }

  const MAX_PAGES = 40;
  const state = {
    pdfDoc: null, pdfBytes: null, pageCount: 0, page: 1,
    single: {}, all: [],
    mode: 'single', sigSize: 140, sigAspect: 0.35
  };

  const fileInput = $('signPdfFile');
  const stage = $('signPdfStage');
  const canvas = $('signPdfCanvas');
  const overlays = $('signPdfOverlays');
  const ctx = canvas.getContext('2d');

  function refreshSigSelect() {
    const sel = $('signPdfSig');
    const list = window.PP.signatures.store.load();
    sel.innerHTML = '';
    if (!list.length) {
      const o = document.createElement('option');
      o.value = ''; o.textContent = 'No signatures yet, make one first';
      sel.appendChild(o);
      return;
    }
    list.forEach(s => {
      const o = document.createElement('option');
      o.value = s.id;
      o.textContent = s.label + (s.isDefault ? ' (default)' : '');
      if (s.isDefault) o.selected = true;
      sel.appendChild(o);
    });
    updateSigAspect();
  }
  window.PP.refreshSignPdfSigs = refreshSigSelect;

  function currentSig() {
    const id = $('signPdfSig').value;
    return window.PP.signatures.store.load().find(s => s.id === id) || null;
  }

  function updateSigAspect() {
    const sig = currentSig();
    if (!sig) return;
    const img = new Image();
    img.onload = () => { state.sigAspect = img.naturalHeight / img.naturalWidth; };
    img.src = sig.dataURL;
  }
  $('signPdfSig').addEventListener('change', updateSigAspect);
  $('signPdfSize').addEventListener('input', e => { state.sigSize = parseInt(e.target.value, 10); });
  $('signPdfMode').addEventListener('change', e => {
    state.mode = e.target.value;
    toast(state.mode === 'all'
      ? 'All-pages mode: placements repeat on every page.'
      : 'Single-page mode: signatures land on the page you tap.');
  });

  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0];
    if (f) loadPdf(f);
  });
  $('signPdfDrop').addEventListener('drop', e => {
    const f = e.dataTransfer.files[0];
    if (f) { fileInput.files = e.dataTransfer.files; loadPdf(f); }
  });

  async function loadPdf(file) {
    hideError('signPdfError');
    setStatus('signPdfStatus', 'Opening your PDF...');
    $('signPdfWork').hidden = true;
    $('signPdfEmpty').style.display = 'none';
    try {
      const buf = await file.arrayBuffer();
      state.pdfBytes = buf.slice(0);
      const doc = await pdfjsLib.getDocument({ data: buf }).promise;
      if (doc.numPages > MAX_PAGES) {
        showError('signPdfError', 'This PDF has ' + doc.numPages + ' pages. Paper Pal handles up to ' + MAX_PAGES + ' at a time.');
        return;
      }
      state.pdfDoc = doc;
      state.pageCount = doc.numPages;
      state.page = 1;
      state.single = {}; state.all = [];
      $('signPdfName').textContent = file.name + ' (' + doc.numPages + ' page' + (doc.numPages > 1 ? 's' : '') + ')';
      refreshSigSelect();
      $('signPdfWork').hidden = false;
      await renderPage();
      setStatus('signPdfStatus', '');
    } catch (err) {
      const msg = (err && err.name === 'PasswordException')
        ? 'This PDF is password protected. Paper Pal cannot open locked files.'
        : 'Could not open that PDF. It may be corrupted or in an odd format.';
      showError('signPdfError', msg);
      $('signPdfEmpty').style.display = 'block';
      setStatus('signPdfStatus', '');
    }
  }

  async function renderPage() {
    const page = await state.pdfDoc.getPage(state.page);
    const v1 = page.getViewport({ scale: 1 });
    const targetW = Math.min(720, stage.clientWidth || 680);
    const scale = targetW / v1.width;
    const v2 = page.getViewport({ scale });
    canvas.width = Math.floor(v2.width);
    canvas.height = Math.floor(v2.height);
    await page.render({ canvasContext: ctx, viewport: v2 }).promise;
    $('signPdfPageLabel').textContent = 'Page ' + state.page + ' of ' + state.pageCount;
    drawOverlays();
  }

  function activePlacements() {
    return state.mode === 'all' ? state.all : (state.single[state.page] || []);
  }

  function drawOverlays() {
    overlays.innerHTML = '';
    const sig = currentSig();
    if (!sig) return;
    activePlacements().forEach(p => {
      const d = document.createElement('div');
      d.className = 'sig-overlay';
      d.style.left = (p.fx * 100) + '%';
      d.style.top = (p.fy * 100) + '%';
      d.style.width = (p.fw * 100) + '%';
      const img = document.createElement('img');
      img.src = sig.dataURL;
      img.alt = 'signature placement';
      d.appendChild(img);
      overlays.appendChild(d);
    });
  }

  canvas.addEventListener('click', e => {
    if (!state.pdfDoc) return;
    const sig = currentSig();
    if (!sig) { toast('Save a signature first, then come back.'); return; }
    const rect = canvas.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const fw = state.sigSize / rect.width;
    const place = { fx, fy, fw };
    if (state.mode === 'all') state.all.push(place);
    else {
      if (!state.single[state.page]) state.single[state.page] = [];
      state.single[state.page].push(place);
    }
    drawOverlays();
  });

  $('signPdfPrev').addEventListener('click', async () => {
    if (state.page > 1) { state.page--; await renderPage(); }
  });
  $('signPdfNext').addEventListener('click', async () => {
    if (state.page < state.pageCount) { state.page++; await renderPage(); }
  });
  $('signPdfUndoPlace').addEventListener('click', () => {
    const arr = activePlacements();
    arr.pop();
    drawOverlays();
  });
  $('signPdfClearPlace').addEventListener('click', () => {
    if (state.mode === 'all') state.all = [];
    else state.single[state.page] = [];
    drawOverlays();
  });

  $('signPdfDownload').addEventListener('click', async () => {
    const sig = currentSig();
    if (!sig) { toast('Pick a signature first.'); return; }
    const hasAny = state.mode === 'all' ? state.all.length : Object.values(state.single).some(a => a.length);
    if (!hasAny) { toast('Tap the page to place your signature first.'); return; }
    const btn = $('signPdfDownload');
    btn.disabled = true;
    setStatus('signPdfStatus', 'Stamping your signature in...');
    try {
      const pdfDoc = await PDFLib.PDFDocument.load(state.pdfBytes);
      const pngBytes = await (await fetch(sig.dataURL)).arrayBuffer();
      const png = await pdfDoc.embedPng(pngBytes);
      const aspect = png.height / png.width;
      const pages = pdfDoc.getPages();
      for (let i = 0; i < pages.length; i++) {
        const pg = pages[i];
        const W = pg.getWidth(), H = pg.getHeight();
        const list = state.mode === 'all' ? state.all : (state.single[i + 1] || []);
        list.forEach(p => {
          const w = p.fw * W;
          const h = w * aspect;
          const x = p.fx * W;
          const y = H - p.fy * H - h;
          pg.drawImage(png, { x, y, width: w, height: h });
        });
      }
      const out = await pdfDoc.save();
      download(new Blob([out], { type: 'application/pdf' }), 'signed-paper-pal.pdf');
      setStatus('signPdfStatus', 'Done. Freshly signed and ready to send.');
    } catch (err) {
      setStatus('signPdfStatus', '');
      toast('Something went wrong while stamping. Try a different PDF.');
    }
    btn.disabled = false;
  });

  window.addEventListener('resize', () => { if (state.pdfDoc) renderPage(); });
  refreshSigSelect();
})();
