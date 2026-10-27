import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

const markdownPath = path.resolve('docx/MAJOR_PROJECT_REPORT_FINAL.md');
const htmlOutputPath = path.resolve('docx/MAJOR_PROJECT_REPORT_FINAL.html');

const markdownContent = fs.readFileSync(markdownPath, 'utf-8');

// Replace \newpage with <div class="page-break"></div>
const preprocessed = markdownContent
  .replace(/\\newpage/g, '<div class="page-break"></div>')
  .replace(/\\vspace\{([^}]+)\}/g, '<div style="margin-top: $1"></div>')
  .replace(/\\hfill/g, '<span style="float: right;"></span>');

const htmlBody = marked.parse(preprocessed);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PatentIntel.AI - Final Major Project Report</title>
  <style>
    @page {
      size: A4;
      margin: 1in;
      @bottom-right {
        content: counter(page);
      }
    }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      text-align: justify;
    }
    h1 {
      font-size: 16pt;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      margin-top: 1.5rem;
      margin-bottom: 1rem;
      page-break-after: avoid;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 1.25rem;
      margin-bottom: 0.75rem;
      page-break-after: avoid;
    }
    h3 {
      font-size: 13pt;
      font-weight: bold;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
      page-break-after: avoid;
    }
    h4 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 0.75rem;
      margin-bottom: 0.5rem;
      page-break-after: avoid;
    }
    p {
      margin-bottom: 0.8rem;
      text-indent: 0.5in;
    }
    .no-indent p {
      text-indent: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.2rem 0;
      font-size: 11pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #333;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
      text-align: center;
    }
    pre, code {
      font-family: "Courier New", Courier, monospace;
      font-size: 10pt;
      background: #f7f7f7;
      padding: 2px 4px;
    }
    pre {
      padding: 12px;
      border: 1px solid #ccc;
      overflow-x: auto;
      line-height: 1.3;
      page-break-inside: avoid;
      text-indent: 0;
    }
    pre code {
      padding: 0;
      background: none;
    }
    hr {
      border: 0;
      border-top: 1px solid #666;
      margin: 2rem 0;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
      margin-top: 2rem;
    }
    blockquote {
      border-left: 3px solid #888;
      padding-left: 1rem;
      font-style: italic;
      margin: 1rem 0;
    }
    .center-text {
      text-align: center;
      text-indent: 0;
    }
  </style>
</head>
<body>
${htmlBody}
</body>
</html>`;

fs.writeFileSync(htmlOutputPath, fullHtml, 'utf-8');
console.log(`Successfully generated: ${htmlOutputPath}`);
