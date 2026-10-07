/* Photos to PDF: pick, reorder, compress, export one PDF with jsPDF. */
(function () {
  'use strict';
  const { $, toast, setStatus, download, esc } = window.PP;

  let photos = []; // {id, dataUrl, name, w, h}

  function loadImageEl(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function processImage(file, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxDim = quality.high ? 2400 : 1600;
          let w = img.naturalWidth, h = img.naturalHeight;
          const s = Math.min(1, maxDim / Math.max(w, h));
          w = Math.round(w * s); h = Math.round(h * s);
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve({ dataUrl: c.toDataURL('image/jpeg', quality.q), w, h });
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  $('photosInput').addEventListener('change', async e => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    const quality = $('photosCompress').checked ? { high: false, q: 0.72 } : { high: true, q: 0.9 };
    setStatus('photosStatus', 'Preparing ' + files.length + ' photo' + (files.length > 1 ? 's' : '') + '...');
    for (const f of files) {
      try {
        const p = await processImage(f, quality);
        photos.push({ id: 'ph_' + Date.now().toString(36) + Math.floor(Math.random() * 1e4), name: f.name, ...p });
      } catch (err) { toast('Skipped one file that would not open: ' + f.name); }
    }
    e.target.value = '';
    renderPhotos();
    setStatus('photosStatus', '');
  });

  function renderPhotos() {
    const box = $('photosList');
    $('photosCard').hidden = !photos.length;
    $('photosCount').textContent = photos.length ? '(' + photos.length + ')' : '';
    box.innerHTML = '';
    photos.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'photo-item';
      div.innerHTML =
        '<img src="' + p.dataUrl + '" alt="photo ' + (i + 1) + '">' +
        '<div class="photo-meta">Page ' + (i + 1) + '<br>' + esc(p.name) + '</div>' +
        '<div class="order-btns"></div>';
      const ob = div.querySelector('.order-btns');
      const up = document.createElement('button');
      up.textContent = '\u25B2'; up.setAttribute('aria-label', 'Move up');
      up.disabled = i === 0;
      up.addEventListener('click', () => { [photos[i - 1], photos[i]] = [photos[i], photos[i - 1]]; renderPhotos(); });
      const down = document.createElement('button');
      down.textContent = '\u25BC'; down.setAttribute('aria-label', 'Move down');
      down.disabled = i === photos.length - 1;
      down.addEventListener('click', () => { [photos[i + 1], photos[i]] = [photos[i], photos[i + 1]]; renderPhotos(); });
      const del = document.createElement('button');
      del.textContent = '\u2715'; del.setAttribute('aria-label', 'Remove');
      del.addEventListener('click', () => { photos.splice(i, 1); renderPhotos(); });
      ob.appendChild(up); ob.appendChild(down); ob.appendChild(del);
      box.appendChild(div);
    });
  }

  $('photosClear').addEventListener('click', () => { photos = []; renderPhotos(); });

  $('photosDownload').addEventListener('click', async () => {
    if (!photos.length) { toast('Add some photos first.'); return; }
    const btn = $('photosDownload');
    btn.disabled = true;
    setStatus('photosStatus', 'Binding your PDF...');
    try {
      const { jsPDF } = window.jspdf;
      let doc = null;
      for (const p of photos) {
        if (!doc) {
          doc = new jsPDF({ unit: 'px', format: [p.w, p.h], hotfix: ['px_scaling'], compress: true });
        } else {
          doc.addPage([p.w, p.h]);
        }
        doc.addImage(p.dataUrl, 'JPEG', 0, 0, p.w, p.h);
      }
      doc.save('paper-pal-photos.pdf');
      setStatus('photosStatus', 'Done. ' + photos.length + ' page' + (photos.length > 1 ? 's' : '') + ', hot off the press.');
    } catch (err) {
      setStatus('photosStatus', '');
      toast('The PDF press jammed. Try fewer or smaller photos.');
    }
    btn.disabled = false;
  });
})();
