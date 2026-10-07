# Paper Pal

Your pocket paperwork desk. Sign PDFs, turn photos into PDFs, convert documents, and scan text into words. Everything runs in your browser, your documents never leave your device.

Live: https://serenawuuu.github.io/paper-pal/

## Tools

1. **My Signatures**: draw with a finger or type in a script font. Save multiple named signatures, pick a default.
2. **Sign PDF**: tap where the signature goes, size it, apply to one page or all, download the signed PDF.
3. **Photos to PDF**: reorder photos, optional compression, export one PDF.
4. **PDF to Word**: extracts text into an editable .doc (text only, layout not preserved).
5. **Word to PDF**: previews a .docx, then uses your system print dialog to save as PDF.
6. **Scan to Text**: OCR in English and Simplified Chinese with a progress bar.

## Run locally

No build step. Serve the folder over HTTP (file:// works for most tabs, but the PDF worker and OCR prefer http://):

```bash
cd paper-pal
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy to GitHub Pages

1. Push this folder to the `main` branch of `SerenaWuuu/paper-pal`.
2. Repo Settings, Pages, Deploy from branch, `main`, `/(root)`.
3. Wait a minute, open https://serenawuuu.github.io/paper-pal/.

## Tech

Plain HTML/CSS/JS plus pinned CDN libraries: pdf.js 3.11.174, pdf-lib 1.17.1, jsPDF 2.5.1, mammoth.js 1.6.0, Tesseract.js 5.1.1. See TESTING.md for verification notes.

MIT licensed.
