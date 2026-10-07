# Paper Pal, testing notes

## Automated verification (done Oct 6, 2026)

- `node --check` passes on all 7 JS files (app, signatures, sign-pdf, photos-pdf, pdf-word, word-pdf, ocr).
- Scripted cross-check: every `$('...')` id referenced in JS exists in index.html. No missing ids.
- Grep scan: zero em-dashes in HTML, CSS, JS, README.
- CDN pins, all curl-verified HTTP 200 on Oct 6, 2026:
  - pdf.js 3.11.174: `.../pdfjs-dist@3.11.174/build/pdf.min.js` and `pdf.worker.min.js`
  - pdf-lib 1.17.1: `.../pdf-lib@1.17.1/dist/pdf-lib.min.js`
  - jsPDF 2.5.1: `.../jspdf@2.5.1/dist/jspdf.umd.min.js`
  - mammoth.js 1.6.0: `.../mammoth@1.6.0/mammoth.browser.min.js`
  - Tesseract.js 5.1.1: `.../tesseract.js@5.1.1/dist/tesseract.min.js` and `dist/worker.min.js`
  - Tesseract worker paths passed explicitly and verified:
    - workerPath `.../tesseract.js@5.1.1/dist/worker.min.js` (200)
    - langPath `https://tessdata.projectnaptha.com/4.0.0` (`eng.traineddata.gz` 200, `chi_sim.traineddata.gz` 200)
    - corePath `.../tesseract.js-core@5.1.0/tesseract-core-simd-lstm.wasm.js` (200, matches the worker's own default filename found in its source)
  - Note: tesseract.js 5.1.1 was chosen because its UMD `tesseract.min.js` build exposes `Tesseract.recognize`, which handles worker lifecycle in one call.
- pdf-lib signing flow validated in Node with pdf-lib 1.17.1: create PDF, `embedPng`, `getWidth`/`getHeight`, `drawImage` with the same coordinate math as sign-pdf.js, `save`, reload. Round-trip OK.
- Fixed during review: double HTML-escaping bug in pdf-word.js text extraction.

## Needs on-device testing (not yet done)

- Finger drawing on iOS Safari: stroke smoothness, `touch-action: none`, pointer capture.
- Sign PDF with real multi-page PDFs: placement accuracy, all-pages mode, files near the 40-page cap, password-protected PDFs (expect the friendly locked-file message).
- Photos to PDF on iPhone: HEIC photos from the camera roll (iOS converts to JPEG on file pick in most cases, but worth confirming), PNG download behavior.
- Chinese OCR accuracy on real scans; first-run language data download size (chi_sim is about 13 MB).
- Word to PDF: the system print dialog flow and "Save as PDF" output on iOS and desktop.
- The actual GitHub Pages deploy and a hard refresh.

## Known honest limitations (stated in the UI)

- PDF to Word extracts text only. Layout, fonts, and images are not preserved.
- Word to PDF relies on the system print dialog.
- OCR is good but not perfect; users are told to skim the result.
- Static site: no background push anything, everything stays on device.
