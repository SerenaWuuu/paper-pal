/* Word to PDF: parse .docx with mammoth.js into a styled preview, print via system dialog. */
(function () {
  'use strict';
  const { $, toast, setStatus, showError, hideError } = window.PP;

  $('wordPdfFile').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    hideError('wordPdfError');
    $('wordPdfPreviewCard').hidden = true;
    $('wordPdfPrint').disabled = true;
    $('wordPdfName').textContent = file.name;
    setStatus('wordPdfStatus', 'Reading your document...');
    try {
      const buf = await file.arrayBuffer();
      const result = await window.mammoth.convertToHtml({ arrayBuffer: buf });
      $('printContent').innerHTML = result.value;
      $('wordPdfPreview').innerHTML = result.value;
      $('wordPdfPreviewCard').hidden = false;
      $('wordPdfPrint').disabled = false;
      if (result.messages && result.messages.length) {
        setStatus('wordPdfStatus', 'Converted with ' + result.messages.length + ' minor note' +
          (result.messages.length > 1 ? 's' : '') + '. Complex formatting may look simpler.');
      } else {
        setStatus('wordPdfStatus', 'Looks good. Hit print when ready.');
      }
    } catch (err) {
      showError('wordPdfError', 'Could not read that file. Make sure it is a real .docx, not an old .doc or a renamed file.');
      setStatus('wordPdfStatus', '');
    }
  });

  $('wordPdfPrint').addEventListener('click', () => {
    toast('Opening your print dialog. Choose "Save as PDF".');
    setTimeout(() => window.print(), 350);
  });
})();
