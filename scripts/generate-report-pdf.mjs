import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

async function generatePdf() {
  const htmlPath = path.resolve('docx/MAJOR_PROJECT_REPORT_FINAL.html');
  const pdfPath = path.resolve('docx/MAJOR_PROJECT_REPORT_FINAL.pdf');

  console.log('Launching browser to render PDF...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  console.log(`Navigating to ${fileUrl}...`);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  console.log('Generating PDF...');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: {
      top: '1in',
      bottom: '1in',
      left: '1in',
      right: '1in'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="font-family: \'Times New Roman\', serif; font-size: 10pt; width: 100%; text-align: right; padding-right: 0.8in;"><span class="pageNumber"></span></div>'
  });

  await browser.close();
  const stats = fs.statSync(pdfPath);
  console.log(`PDF created successfully at: ${pdfPath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
}

generatePdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
