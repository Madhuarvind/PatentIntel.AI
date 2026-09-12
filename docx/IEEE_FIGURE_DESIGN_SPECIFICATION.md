# PatentIntel.AI: IEEE Figure Design Specifications & Blueprint Guide

**Authors:** Madhuaravind P, Harish M, Mouneesh R  
**Department:** Department of Artificial Intelligence and Data Science / Machine Learning  
**Institution:** M. Kumarasamy College of Engineering, Karur, Tamil Nadu, India  

---

## PURPOSE OF THIS GUIDE
This guide provides precise, box-by-box structural specifications, node labels, decision logic, arrow connections, data flows, exact mathematical numbers, and layout coordinates for **Figures 1, 2, 3, and 4**. 

You can use this exact blueprint to draw clean, high-resolution, publication-grade figures in **Draw.io**, **Figma**, **Microsoft PowerPoint**, **Visio**, or **TikZ (LaTeX)** without relying on AI image generators.

---

## FIGURE 1: END-TO-END SYSTEM ARCHITECTURE BLUEPRINT

### Title in Paper
**Fig. 1. End-to-end multi-tier system architecture of PatentIntel.AI.**

### Canvas Layout Recommendation
- **Orientation:** Landscape (16:9 ratio) or 2-column wide block (IEEE standard 3.5 inch per column or 7.0 inch full width).
- **Style:** Clean white background, 1pt dark gray borders, pastel blue/indigo/emerald accent boxes.

---

### Layer-by-Layer Node Breakdown & Connection Map

```
+---------------------------------------------------------------------------------------------------+
| LAYER 1: USER INTERFACE & INPUT LAYER (Top Row - Full Width)                                      |
| Box 1.1: [User Target Patent Claim Input (Natural Text / Patent ID)]                             |
| Box 1.2: [React 18 + TypeScript SPA Workspace (Observer State Store)]                            |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v (User Query Q)
+---------------------------------------------------------------------------------------------------+
| LAYER 2: ROUTING & API PROXY LAYER (Middle-Top Row)                                                |
| Box 2.1: [Deterministic Dual-Pipeline Source Router (Regex / AST Classifier)]                      |
|          |---> Branch A (Canonical Patent ID e.g., US11234567B2) --> [Patent Registry Pipeline]   |
|          |---> Branch B (Free-Text Academic Description)        --> [Academic Graph Pipeline]   |
| Box 2.2: [Server-Side REST CORS Proxy Layer]                                                      |
|          |---> Fetches Live Stream from USPTO PatentsView (api.uspto.gov)                         |
|          |---> Fetches Live Stream from Google Patents / EPO Open Patent Services                 |
|          |---> Fetches Live Stream from Semantic Scholar Graph API                                |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v (Clean JSON Payload Streams)
+---------------------------------------------------------------------------------------------------+
| LAYER 3: CORE ANALYTIC & EMBEDDING ENGINES (Middle Row - 3 Side-by-Side Columns)                  |
|                                                                                                   |
| COLUMN A:                                 COLUMN B:                           COLUMN C:           |
| Box 3.1:                                  Box 3.2:                            Box 3.3:            |
| [Hierarchical Claim                      [Multi-Signal SBERT                  [Statutory Legal    |
| Decomposition Engine]                     Embedding Matrix]                   Screening Engine]   |
| - Preamble Parser (P_preamble)            - 768-dim Dense Vectors             - India Sec 3(k)    |
| - Transition Classifier (T_trans)         - Clause Cosine Sim                 - US 35 U.S.C. 101  |
| - Body Limitations (L_1, ..., L_n)        - Lexical Jaccard Overlap           - Token Inspector   |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v (Scored Provenance Matrix)
+---------------------------------------------------------------------------------------------------+
| LAYER 4: MULTIMODAL & REPORT GENERATION LAYER (Bottom Row)                                        |
| Box 4.1: [ColPali Multimodal Drawing Topology Engine (Vision-Language Visual Matching)]           |
| Box 4.2: [Statutory Risk Calculator & FER Generator (35 U.S.C. §§ 102, 103, 112 Analysis)]         |
| Box 4.3: [1-Click Executive Audit Dossier Exporter (PDF / Markdown / BibTeX Downloader)]          |
+---------------------------------------------------------------------------------------------------+
```

### Exact Text Labels & Arrows to Draw in Draw.io / Figma
1. **Top Input Box:** Label = `"Target Application Input (Patent ID or Free-Text Claim)"`
2. **Arrow 1:** From Input Box down to Router Box. Label = `"User Query Q"`
3. **Router Box:** Label = `"Deterministic Dual-Pipeline Source Router"`
4. **Left Branch Arrow:** Label = `"If Patent ID (US/EP/WO)"` pointing to `"USPTO / Google Patents API"`
5. **Right Branch Arrow:** Label = `"If Free-Text Keywords"` pointing to `"Semantic Scholar API"`
6. **Middle Box:** Label = `"Server-Side CORS REST Proxy Layer"`
7. **Arrow 2:** From Proxy down to `"Hierarchical Claim Decomposition Engine"`
8. **Sub-Nodes inside Decomposition Box:**
   - Node 1: `"Preamble Extractor (\mathcal{P})"`
   - Node 2: `"Transition Scope Classifier (\mathcal{T})"`
   - Node 3: `"Limitation Clause Dissecting (\mathcal{L}_1 \dots \mathcal{L}_n)"`
9. **Connecting Arrow to Right:** Pointing to `"Multi-Signal SBERT Dense Vector Engine"`
10. **Connecting Arrow to Right:** Pointing to `"Dual-Jurisdiction Statutory Screening Engine"`
11. **Bottom Box:** Label = `"Automated First Examination Report (FER) PDF Exporter"`

---

## FIGURE 2: DUAL-JURISDICTION STATUTORY ELIGIBILITY FLOWCHART BLUEPRINT

### Title in Paper
**Fig. 2. Statutory subject-matter eligibility screening decision flowchart combining India Patent Act Section 3(k) CRI Guidelines and US 35 U.S.C. § 101 Supreme Court Alice 2-step framework.**

### Canvas Layout Recommendation
- **Orientation:** Portrait or 2-Column Split (Left Column = India Sec 3(k), Right Column = US 35 U.S.C. § 101).

---

### Step-by-Step Node & Decision Tree Map

```
                               +----------------------------------+
                               |     START: TARGET CLAIM INPUT    |
                               +----------------------------------+
                                                |
                                                v
                               +----------------------------------+
                               |  Claim Element Decomposition &   |
                               |   Token Analysis Engine          |
                               +----------------------------------+
                                                |
                       +------------------------+------------------------+
                       |                                                 |
                       v                                                 v
        [ JURISDICTION 1: INDIA SEC 3(k) ]               [ JURISDICTION 2: US 35 U.S.C. § 101 ]
                       |                                                 |
                       v                                                 v
       +-------------------------------+                 +-------------------------------+
       | Decision 1 (Diamond):         |                 | Decision 1 (Diamond):         |
       | Does claim recite Software    |                 | Is claim in Statutory Category|
       | per se / Math Method?         |                 | (Process/Machine/Manufacture)?|
       +-------------------------------+                 +-------------------------------+
         | YES                       | NO                  | NO                        | YES
         v                           v                     v                           v
+------------------+       +-------------------+  +------------------+       +-------------------+
| Statutory        |       | Proceed to        |  | INELIGIBLE       |       | Proceed to        |
| Risk Flagged     |       | Hardware Test     |  | (35 U.S.C. § 101)|       | Step 2A           |
+------------------+       +-------------------+  +------------------+       +-------------------+
         |                           |                                                 |
         v                           v                                                 v
+--------------------------------------+                                 +-------------------------------+
| Decision 2 (Diamond):                |                                 | Decision 2A (Diamond):        |
| Is software bound to specific        |                                 | Is claim directed to Judicial |
| concrete physical Hardware Apparatus?|                                 | Exception (Abstract Idea)?    |
+--------------------------------------+                                 +-------------------------------+
         | NO                        | YES                                 | YES                       | NO
         v                           v                                     v                           v
+------------------+       +-------------------+                     +-------------------+       +---------------+
| INELIGIBLE       |       | Decision 3:       |                     | Proceed to        |       | STATUTORILY   |
| (Sec 3(k) CRI)   |       | Technical Effect? |                     | Step 2B           |       | ELIGIBLE      |
+------------------+       +-------------------+                     +-------------------+       +---------------+
                                     | YES                                 |
                                     v                                     v
                           +-------------------+                     +-------------------------------+
                           | STATUTORILY       |                     | Decision 2B (Diamond):        |
                           | ELIGIBLE (INDIA)  |                     | Does claim recite "Significantly|
                           +-------------------+                     | More" (Inventive Concept)?    |
                                                                     +-------------------------------+
                                                                       | NO                        | YES
                                                                       v                           v
                                                             +-------------------+       +---------------+
                                                             | INELIGIBLE        |       | STATUTORILY   |
                                                             | (Alice Step 2B)   |       | ELIGIBLE (US) |
                                                             +-------------------+       +---------------+
```

### Exact Text Labels & Logic for Flowchart Nodes
1. **Top Node:** Rectangle -> `"Target Claim Text Input"`
2. **Split Box:** Rectangle -> `"Statutory Jurisdiction Splitter"`
3. **Left Column (India Patent Act Section 3(k)):**
   - **Diamond 1:** `"Is the claim a computer program per se, mathematical method, or algorithm?"`
     - Branch `YES`: Go to Diamond 2.
     - Branch `NO`: `"Statutorily Eligible (Not Sec 3(k) subject matter)"`.
   - **Diamond 2 (Hardware Binding Test):** `"Is the method explicitly bound to physical hardware components (processor, sensor, controller)?"`
     - Branch `NO`: `"REJECTED: Excluded under Sec 3(k) CRI Guidelines"`.
     - Branch `YES`: Go to Diamond 3.
   - **Diamond 3 (Technical Contribution Test):** `"Does the hardware-software combination produce a concrete technical effect?"`
     - Branch `YES`: `"ELIGIBLE: Valid Indian Patent Subject Matter"`.
     - Branch `NO`: `"REJECTED: Lack of Technical Effect"`.
4. **Right Column (US 35 U.S.C. § 101 - Supreme Court Alice 2-Step):**
   - **Diamond 1 (Step 1 Statutory Category):** `"Does claim fall into process, machine, manufacture, or composition of matter?"`
     - Branch `NO`: `"REJECTED under 35 U.S.C. § 101"`.
     - Branch `YES`: Go to Step 2A.
   - **Diamond 2 (Step 2A Judicial Exception):** `"Is claim directed to a judicial exception (abstract idea, algorithm, mental process)?"`
     - Branch `NO`: `"ELIGIBLE: Statutory Subject Matter"`.
     - Branch `YES`: Go to Step 2B.
   - **Diamond 3 (Step 2B Inventive Concept):** `"Do claim limitations recite 'significantly more' to transform exception into a practical application?"`
     - Branch `YES`: `"ELIGIBLE: Passed Alice Step 2B"`.
     - Branch `NO`: `"REJECTED: Abstract Idea without Inventive Concept"`.

---

## FIGURE 3: EMPIRICAL PERFORMANCE BENCHMARK GRAPH BLUEPRINT

### Title in Paper
**Fig. 3. Empirical retrieval performance benchmark comparing PatentIntel.AI against traditional Lexical BM25, Standard SBERT, and SOTA neural baselines on the PatentMatch 6.26M dataset.**

### Canvas Layout Recommendation
- **Type:** Clustered Column Bar Chart or Grouped Bar Chart.
- **X-Axis:** Model Architectures (5 Groups).
- **Y-Axis:** Percentage Score (Scale: 0% to 100%, Gridlines at every 10%).

---

### Exact Plotting Data Matrix for Drawing Graph

| Group / Architecture Name | Precision @ 10 (%) | Recall @ 10 (%) | MRR Score (0-1.0) | F1 Score (%) | Mean Latency (ms) |
|---|:---:|:---:|:---:|:---:|:---:|
| **1. Lexical BM25 Baseline** | 69.6% | 68.4% | 0.692 | 69.0% | 120ms |
| **2. Standard SBERT Embeddings** | 81.2% | 79.5% | 0.810 | 80.3% | 185ms |
| **3. BM25 + SBERT Hybrid** | 84.8% | 83.1% | 0.845 | 83.9% | 210ms |
| **4. PAI-NET RAG Baseline [12]** | 86.1% | 85.2% | 0.858 | 85.6% | 340ms |
| **5. PatentIntel.AI (Proposed)** | **91.2%** | **88.6%** | **0.904** | **89.8%** | **145ms** |

### Color Palette Recommendation for Custom Chart
- **Precision@10 Bar:** Dark Blue (`#1E3A8A`)
- **Recall@10 Bar:** Teal / Cyan (`#0D9488`)
- **MRR Score Bar:** Indigo (`#4F46E5`)
- **F1 Score Bar:** Emerald Green (`#059669`)

---

## FIGURE 4: MULTI-SIGNAL MATHEMATICAL SCORING WEIGHT BREAKDOWN BLUEPRINT

### Title in Paper
**Fig. 4. Mathematical multi-signal scoring weight breakdown and feature-level overlap matrix structure.**

### Canvas Layout Recommendation
- **Left Side:** Donut Chart or Pie Chart showing weight percentage allocation.
- **Right Side:** Feature-Level Overlap Matrix Table diagram showing grounded metadata provenance cells.

---

### Part A: Pie / Donut Chart Weight Breakdown

```
+------------------------------------------------------------------------+
| 5-SIGNAL COMPOSITE SCORE DISTRIBUTION (Total: 100 Points / 100%)       |
+------------------------------------------------------------------------+
| 1. [ 40% ] SBERT Dense Vector Cosine Similarity (S_Semantic)          |
| 2. [ 30% ] Clause Limitation Element Alignment (S_Claim)              |
| 3. [ 10% ] CPC Classification Taxonomy Depth (S_CPC)                  |
| 4. [ 10% ] Priority Date Chronology Gap (S_Priority)                  |
| 5. [ 10% ] Citation Lineage & Citation Strength (S_Citation)          |
+------------------------------------------------------------------------+
```

### Part B: Feature Overlap Provenance Matrix Cells

Draw a 4-Column Table Grid representing the visual diff output in PatentIntel.AI UI:

| Target Claim Limitation Clause ($\mathcal{L}_t$) | Prior-Art Matched Disclosure Passage ($\mathcal{L}_c$) | Grounded Evidence Provenance Metadata | Overlap Metrics & Visual Diff |
|---|---|---|---|
| *"1.1 A distributed server node..."* | *"Col. 3, Line 14: The cloud computing node..."* | Document: **US10984512B2**, Page 4, Sec: Detailed Description | **Sim:** 88.4%<br>**Lexical:** 74.2%<br>**Confidence:** 96% |
| *"1.2 ...executing a SBERT vector engine..."* | *"Col. 5, Line 8: ...utilizing dense transformer embeddings..."* | Document: **US10984512B2**, Page 6, Sec: Claims | **Sim:** 92.1%<br>**Lexical:** 68.0%<br>**Confidence:** 98% |
| *"1.3 ...evaluating Section 3(k) CRI hardware..."* | *"Col. 8, Line 22: ...binding software logic to hardware registers..."* | Document: **US10984512B2**, Page 9, Sec: Hardware Binding | **Sim:** 85.0%<br>**Lexical:** 81.5%<br>**Confidence:** 94% |

---

## SUMMARY CHECKLIST FOR DRAWING YOUR FIGURES

1. **Figure 1 (System Architecture):** Draw 4 horizontal layers: User UI -> Dual-Pipeline Router & Proxy -> 3 Analytic Engines -> FER PDF Exporter.
2. **Figure 2 (Statutory Flowchart):** Draw a 2-column flowchart split into **India Sec 3(k)** (left) and **US 35 U.S.C. § 101 Alice 2-Step** (right) with diamond decision nodes.
3. **Figure 3 (Performance Bar Graph):** Plot a grouped bar chart comparing the 5 model architectures using the exact data values (BM25: 69.0% vs. PatentIntel.AI: 89.8% F1 Score).
4. **Figure 4 (Multi-Signal Scoring):** Draw a pie/donut chart showing the 40/30/10/10/10 weight split alongside the 4-column feature overlap provenance matrix table.

---

### 979-8-3315-8242-5/26/$31.00 ©2026 IEEE
