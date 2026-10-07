/* Paper Pal shared utilities: tabs, toast, downloads, easter egg. */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  let toastTimer = null;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 4000);
  }

  function downloadText(text, filename, mime) {
    download(new Blob([text], { type: mime || 'text/plain;charset=utf-8' }), filename);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function setStatus(id, msg) {
    const el = $(id);
    if (el) el.textContent = msg || '';
  }

  function showError(id, msg) {
    const el = $(id);
    if (!el) { toast(msg); return; }
    el.textContent = msg;
    el.hidden = false;
  }

  function hideError(id) {
    const el = $(id);
    if (el) { el.hidden = true; el.textContent = ''; }
  }

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $('tab-' + btn.dataset.tab).classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Easter egg: tap the brand 7 times for a rubber stamp
  const quips = [
    'This paperwork approves of you.',
    'Filed under: delightful.',
    'No trees were harmed. Probably.',
    'Your penmanship is showing off again.',
    'The desk gnome gives a thumbs up.'
  ];
  let taps = 0, tapTimer = null;
  $('brand').addEventListener('click', () => {
    taps++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { taps = 0; }, 2500);
    if (taps >= 7) {
      taps = 0;
      $('stampQuip').textContent = quips[Math.floor(Math.random() * quips.length)];
      const s = $('stamp');
      s.hidden = false;
      setTimeout(() => { s.hidden = true; }, 2200);
    }
  });

  // Drag-over highlight for file drops
  document.querySelectorAll('.file-drop').forEach(drop => {
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag'); }));
  });

  window.PP = { $, toast, download, downloadText, esc, setStatus, showError, hideError };
})();
