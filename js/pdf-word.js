/* PDF to Word: extract text per page with pdf.js, download as Word-compatible .doc */
(function () {
  'use strict';
  const { $, toast, setStatus, showError, hideError, download, esc } = window.PP;

  let pendingFile = null;

  $('pdfWordFile').addEventListener('change', e => {
    pendingFile = e.target.files[0] || null;
    $('pdfWordName').textContent = pendingFile ? pendingFile.name : 'text will be extracted page by page';
    $('pdfWordGo').disabled = !pendingFile;
    hideError('pdfWordError');
  });

  $('pdfWordGo').addEventListener('click', async () => {
    if (!pendingFile) return;
    const btn = $('pdfWordGo');
    btn.disabled = true;
    hideError('pdfWordError');
    try {
      const buf = await pendingFile.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buf }).promise;
      let pagesHtml = '';
      for (let i = 1; i <= doc.numPages; i++) {
        setStatus('pdfWordStatus', 'Reading page ' + i + ' of ' + doc.numPages + '...');
        const page = await doc.getPage(i);
        const tc = await page.getTextContent();
        let text = '';
        tc.items.forEach(item => {
          text += item.str;
          if (item.hasEOL) text += '\n';
          else text += ' ';
        });
        const html = esc(text.trim()).replace(/\n/g, '<br>');
        pagesHtml += (i > 1 ? '<br clear="all" style="page-break-before:always">' : '') +
          '<p>' + (html || '<i>[no extractable text on this page, it may be a scanned image]</i>') + '</p>';
      }
      const wordHtml =
        '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
        'xmlns:w="urn:schemas-microsoft-com:office:word" ' +
        'xmlns="http://www.w3.org/TR/REC-html40">' +
        '<head><meta charset="utf-8"><title>Paper Pal export</title></head>' +
        '<body style="font-family:Calibri,Arial,sans-serif">' + pagesHtml + '</body></html>';
      const base = pendingFile.name.replace(/\.pdf$/i, '');
      download(new Blob(['\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' }), base + '-paper-pal.doc');
      setStatus('pdfWordStatus', 'Done. Text only, as promised.');
    } catch (err) {
      const msg = (err && err.name === 'PasswordException')
        ? 'This PDF is password protected. Paper Pal cannot open locked files.'
        : 'Could not read that PDF. It may be corrupted.';
      showError('pdfWordError', msg);
      setStatus('pdfWordStatus', '');
    }
    btn.disabled = false;
  });
})();
