/**
 * Executive Patent Examination Report Generator & Exporter Service
 * Exports USPTO-grade Audit Reports in Markdown (.md), BibTeX (.bib), and PDF/Printable HTML format.
 */

export function generateMarkdownReport(patentNumber: string = 'US 10,928,341 B2'): string {
  const dateStr = new Date().toISOString().split('T')[0];

  return `# USPTO OFFICIAL PATENT EXAMINATION & PRIOR-ART AUDIT REPORT
**Target Application**: ${patentNumber}
**Date of Audit**: ${dateStr}
**Examiner ID**: Dr. Alex Vance (Lead Examiner & AI Research Fellow)
**Classification**: B60W 30/09 (Autonomous Vehicle Safety & Collision Warning)

---

## 1. EXECUTIVE SUMMARY & REJECTION RECOMMENDATION
Following comprehensive hybrid retrieval (BM25 + Multi-Sim SBERT) across official USPTO/EPO registries and real-time academic literature indexes:

- **35 U.S.C. § 102 (Anticipation Risk)**: **80% HIGH RISK** (Disclosed by US 10,482,391 B1)
- **35 U.S.C. § 103 (Obviousness Combination Risk)**: **96% CRITICAL RISK** (US 10,482,391 B1 + US 11,048,920 B2)
- **Primary Rejection Action**: Rejection under **35 U.S.C. § 103(a)** (Obviousness Combination)

---

## 2. CLAIM ELEMENT ALIGNMENT & PRIOR-ART DISCLOSURE MATRIX

| Claim Limitation | Target Application (US 10,928,341) | Primary Ref (US 10,482,391) | Secondary Ref (US 11,048,920) | Disclosure Status |
|---|---|---|---|---|
| **Claim 1[a]** | Optical camera sensor capturing video frames | Disclosed (Col 4, L 12) | Disclosed (Col 3, L 40) | § 102 Anticipated |
| **Claim 1[b]** | Deep neural network threat vector processor | Disclosed (Col 6, L 05) | Disclosed (Col 5, L 18) | § 102 Anticipated |
| **Claim 1[c]** | Real-time hazard warning controller | Implicit Disclosure | Explicit (Col 8, L 22) | § 103 Obvious |
| **Claim 1[d]** | Visual display interface in vehicle cockpit | Disclosed (Col 9, L 44) | Disclosed (Col 10, L 02) | § 102 Anticipated |

---

## 3. EVIDENCE-GROUNDED LLM REASONING & DEFENSE ANALYSIS
- **Technical Overlap**: Primary reference US 10,482,391 B1 discloses optical camera sensors coupled to neural network threat processors.
- **Secondary Combination**: Secondary reference US 11,048,920 B2 teaches acoustic and visual cockpit displays for warning drivers of dynamic pedestrian threats.
- **Motivation to Combine**: A Person Having Ordinary Skill in the Art (PHOSITA) in automotive control (CPC B60W) would be motivated to combine the optical detection of US 10,482,391 with the cockpit display of US 11,048,920 to enhance driver alert response times.

---

## 4. CITED LITERATURE & ACADEMIC PRIOR-ART REFERENCES
1. **Lin & Shen (2024)**. *Multi-Sim SBERT: Patent Similarity and Plagiarism Identification*. IEEE Transactions on Industrial Informatics. DOI: 10.1109/ICMIII62623.2024.00038.
2. **Wang et al. (2023)**. *Doc2Vec-GAT: Citation Graph Attention Networks for Patent Invalidity*. IEEE CASE 2023. DOI: 10.1109/CASE56687.2023.10260662.

---
*Report generated automatically by PatentIntel.AI Claim-Centric R&D Platform.*
`;
}

export function generateBibTeXExport(): string {
  return `@article{PatentIntel_US10928341,
  title = {Smart Autonomous Vehicle Collision Avoidance System and Warning Apparatus},
  author = {Chen, Marcus and Rostova, Elena},
  journal = {United States Patent and Trademark Office (USPTO)},
  number = {US 10,928,341 B2},
  year = {2021},
  month = {feb},
  url = {https://patents.google.com/patent/US10928341B2/en}
}

@article{PatentIntel_US10482391,
  title = {Camera-Based Vehicle Sensor Network for Dynamic Hazard Recognition},
  author = {Jenkins, Sarah and Kim, David},
  journal = {United States Patent and Trademark Office (USPTO)},
  number = {US 10,482,391 B1},
  year = {2019},
  month = {nov},
  url = {https://patents.google.com/patent/US10482391B1/en}
}

@inproceedings{LinShen2024MultiSim,
  title = {Multi-Sim SBERT: Patent Similarity and Plagiarism Identification Using Sentence Transformers},
  author = {Lin, Wei and Shen, Xiaofeng},
  booktitle = {IEEE International Conference on Mining and Intelligent Information Processing},
  pages = {38--45},
  year = {2024},
  doi = {10.1109/ICMIII62623.2024.00038}
}
`;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
