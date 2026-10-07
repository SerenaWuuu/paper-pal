/* Scan to Text: Tesseract.js OCR, English + Simplified Chinese, progress bar. */
(function () {
  'use strict';
  const { $, toast, setStatus, showError, hideError, downloadText } = window.PP;

  const TESS = {
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
    langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0/tesseract-core-simd-lstm.wasm.js'
  };

  let pendingFile = null;

  $('ocrFile').addEventListener('change', e => {
    pendingFile = e.target.files[0] || null;
    $('ocrName').textContent = pendingFile ? pendingFile.name : 'clear, straight-on photos work best';
    $('ocrGo').disabled = !pendingFile;
    hideError('ocrError');
  });

  $('ocrGo').addEventListener('click', async () => {
    if (!pendingFile) return;
    const langs = [];
    if ($('ocrEng').checked) langs.push('eng');
    if ($('ocrChi').checked) langs.push('chi_sim');
    if (!langs.length) { toast('Pick at least one language.'); return; }

    const btn = $('ocrGo');
    btn.disabled = true;
    hideError('ocrError');
    $('ocrResultCard').hidden = true;
    $('ocrProgressWrap').hidden = false;
    $('ocrProgressBar').style.width = '2%';
    setStatus('ocrStatus', 'Warming up the text reader. First run downloads the language data...');

    try {
      const { data } = await window.Tesseract.recognize(
        pendingFile,
        langs.join('+'),
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              const pct = Math.round((m.progress || 0) * 100);
              $('ocrProgressBar').style.width = pct + '%';
              setStatus('ocrStatus', 'Reading your scan, ' + pct + '%...');
            } else if (m.status === 'loading tesseract core' || m.status === 'loading language traineddata') {
              setStatus('ocrStatus', 'Loading ' + m.status.replace('loading ', '') + '...');
            }
          },
          workerPath: TESS.workerPath,
          langPath: TESS.langPath,
          corePath: TESS.corePath,
          cacheMethod: 'write'
        }
      );
      const text = (data.text || '').trim();
      $('ocrText').value = text;
      $('ocrResultCard').hidden = false;
      $('ocrProgressBar').style.width = '100%';
      if (text) setStatus('ocrStatus', 'Done. Give it a skim, OCR is clever but not perfect.');
      else setStatus('ocrStatus', 'Done, but no text was found. Try a clearer photo.');
    } catch (err) {
      showError('ocrError', 'The text reader stumbled. Check your connection and try a smaller image.');
      setStatus('ocrStatus', '');
    }
    $('ocrProgressWrap').hidden = true;
    btn.disabled = false;
  });

  $('ocrCopy').addEventListener('click', async () => {
    const t = $('ocrText').value;
    if (!t) { toast('Nothing to copy yet.'); return; }
    try {
      await navigator.clipboard.writeText(t);
      toast('Copied to clipboard.');
    } catch (err) {
      $('ocrText').select();
      document.execCommand('copy');
      toast('Copied to clipboard.');
    }
  });

  $('ocrDownload').addEventListener('click', () => {
    const t = $('ocrText').value;
    if (!t) { toast('Nothing to download yet.'); return; }
    downloadText(t, 'paper-pal-scan.txt');
  });
})();
