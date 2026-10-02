import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDocument } from '../server/documents.mjs';

// A small valid PDF, built independently of the extraction implementation.
function pdfFixture(pageCount = 1, text = 'Optical sensor measures temperature') {
  const pageIds = Array.from({ length: pageCount }, (_, i) => 4 + i * 2);
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  for (const id of pageIds) {
    const stream = text ? `BT /F1 12 Tf 72 700 Td (${text}) Tj ET` : '';
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${id + 1} 0 R >>`, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }
  let output = '%PDF-1.4\n'; const offsets = [0];
  for (let i = 0; i < objects.length; i++) { offsets.push(Buffer.byteLength(output)); output += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`; }
  const xref = Buffer.byteLength(output);
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(output);
}
test('text PDFs extract actual page text and preserve page numbers', async () => {
  const parsed = await parseDocument('proposal.pdf', pdfFixture(2));
  assert.equal(parsed.mime, 'application/pdf'); assert.equal(parsed.pages.length, 2);
  assert.equal(parsed.pages[1].page, 2); assert.match(parsed.pages[0].text, /Optical sensor measures temperature/);
});
test('PDF without extractable text requests OCR, and over 100 pages is rejected', async () => {
  await assert.rejects(parseDocument('scan.pdf', pdfFixture(1, '')), e => e.status === 422 && /OCR/.test(e.message));
  await assert.rejects(parseDocument('long.pdf', pdfFixture(101)), e => e.status === 413 && /100 pages/.test(e.message));
  await assert.rejects(parseDocument('broken.pdf', Buffer.from('%PDF-1.4\ncorrupt')), e => e.status === 400);
});
