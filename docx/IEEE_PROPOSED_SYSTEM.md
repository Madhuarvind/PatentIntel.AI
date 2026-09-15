# PatentIntel.AI: Section III. Proposed System Architecture & Methodology

**Authors:** Madhuaravind P, Harish M, Mouneesh R  
**Department:** Department of Artificial Intelligence and Data Science / Machine Learning  
**Institution:** M. Kumarasamy College of Engineering, Karur, Tamil Nadu, India  

---

## III. PROPOSED SYSTEM ARCHITECTURE & METHODOLOGY

To resolve the critical inefficiencies, cross-domain contamination, and lack of statutory screening in existing prior-art tools, we present **PatentIntel.AI**—an enterprise-grade, claim-centric patent intelligence platform. PatentIntel.AI combines deterministic source routing, server-side CORS proxying, hierarchical claim decomposition, multi-signal SBERT dense embeddings, dual-jurisdiction statutory legal screening, and multimodal drawing topology verification into a unified, audit-ready framework.

---

### A. High-Level System Architecture & Flowchart

Fig. 2 illustrates the end-to-end multi-tier system architecture of PatentIntel.AI:

```
+-----------------------------------------------------------------------------------+
|                            PATENTINTEL.AI USER INTERFACE                         |
|   (React 18 + TypeScript + Tailwind CSS + Lucide Icons + Vite Production Build)   |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|               DETERMINISTIC DUAL-PIPELINE SOURCE ROUTER & CORS PROXY              |
|   ( segregates Patent Identifier Queries from Natural Language Academic Queries )  |
+-----------------------------------------------------------------------------------+
          |                               |                               |
          v                               v                               v
+-------------------+           +-------------------+           +-------------------+
|   USPTO LIVE API  |           | GOOGLE PATENTS /  |           | SEMANTIC SCHOLAR  |
|   PATENTSVIEW     |           | EPO REST PROXY    |           | ACADEMIC GRAPH    |
+-------------------+           +-------------------+           +-------------------+
          |                               |                               |
          +-------------------------------+-------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                   HIERARCHICAL CLAIM DECOMPOSITION ENGINE                         |
|      Preamble Parsing  |  Transitional Phrase Classifier  |  Body Limitations     |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                 MULTI-SIGNAL SEMANTIC SIMILARITY & PROVENANCE MATRIX              |
|  - SBERT Vector Distance   - Lexical Clause Overlap   - CPC Taxonomy Depth    |
|  - Feature Overlap Matrix  - Page/Section Metadata    - Visual Textual Diff       |
+-----------------------------------------------------------------------------------+
          |                                                               |
          v                                                               v
+-----------------------------------+           +-----------------------------------+
| DUAL-JURISDICTION STATUTORY ENGINE|           | COLPALI MULTIMODAL TOPOLOGY ENGINE|
| - India Sec 3(k) CRI Guidelines   |           | - Vision-Language Drawings Matching|
| - US 35 U.S.C. § 101 Alice 2-Step |           | - Schematic Block Diagram Verification|
+-----------------------------------+           +-----------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                 AUTOMATED FIRST EXAMINATION REPORT (FER) GENERATOR               |
|      (35 U.S.C. § 102 Anticipation | § 103 Obviousness | 1-Click Executive PDF Exporter)  |
+-----------------------------------------------------------------------------------+
```

---

### B. Domain-Isolated Dual-Pipeline Source Router & Server-Side CORS Proxy

To eliminate cross-domain data contamination and bypass browser-level CORS security blocks, PatentIntel.AI incorporates a deterministic query classification engine and dedicated backend proxy layer:

1. **Deterministic Pipeline Router:** The query classifier evaluates incoming user input $Q$ using regular expressions and Abstract Syntax Tree (AST) pattern matching. Queries containing canonical patent identifiers (e.g., `US11234567B2`, `EP3456789A1`, `WO2023012345`) are routed to the **Patent Registry Pipeline**, while free-form technical natural-language queries are dispatched to the **Academic Literature Pipeline**.
2. **Server-Side REST Proxy:** Direct browser requests to official endpoints (such as `api.uspto.gov`) are intercepted by a server-side proxy module. The proxy appends required API tokens, manages rate limiting, handles TLS handshakes, and strips restricted CORS headers, returning sanitized JSON payload streams to the client without falling back on static database snapshots [1], [9].

---

### C. Hierarchical Structural Claim Decomposition Engine

Unlike existing tools that evaluate patents as monolithic text blocks, PatentIntel.AI parses independent patent claims into structured limitation clause trees:

$$\mathcal{C}_{\text{claim}} \rightarrow \{ \mathcal{P}_{\text{preamble}}, \mathcal{T}_{\text{transitional}}, \{\mathcal{L}_1, \mathcal{L}_2, \dots, \mathcal{L}_n\} \}$$

- **Preamble Parsing ($\mathcal{P}_{\text{preamble}}$):** Extracts the technical field and broad category of the invention (e.g., *"A computer-implemented system for..."*).
- **Transitional Phrase Classification ($\mathcal{T}_{\text{transitional}}$):** Classifies the legal scope as open (*"comprising"*), closed (*"consisting of"*), or hybrid (*"consisting essentially of"*).
- **Limitation Extraction ($\mathcal{L}_i$):** Dissects the claim body into individual technical clauses representing distinct hardware components, software methods, or structural relationships.

---

### D. Multi-Signal Semantic Similarity & Feature-Level Overlap Provenance Matrix

To compute auditable, high-precision similarity scores, PatentIntel.AI combines five quantitative signals into a multi-vector similarity matrix:

$$\text{Score}_{\text{Combined}}(c_i, D_j) = w_1 \cdot \text{Sim}_{\text{SBERT}}(c_i, D_j) + w_2 \cdot \text{Overlap}_{\text{Lexical}}(c_i, D_j) + w_3 \cdot \text{Prox}_{\text{CPC}}(c_i, D_j) + w_4 \cdot \text{Gap}_{\text{Priority}}(c_i, D_j) + w_5 \cdot \text{Ratio}_{\text{Align}}(c_i, D_j)$$

- **SBERT Dense Embedding Distance ($\text{Sim}_{\text{SBERT}}$):** Converts limitation clauses into 768-dimensional SBERT vector representations [18] and computes cosine distance:
$$\text{Sim}_{\text{SBERT}}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}$$
- **Lexical Overlap Score ($\text{Overlap}_{\text{Lexical}}$):** Measures clause-level token overlap using Jaccard and n-gram overlap.
- **CPC Taxonomy Proximity ($\text{Prox}_{\text{CPC}}$):** Calculates tree depth similarity across Cooperative Patent Classification codes.
- **Feature Overlap Provenance Matrix:** For every matched prior-art reference, the system outputs an audit-ready provenance record detailing:
  - Source document ID and title.
  - Specific section header (e.g., *"Detailed Description, Col. 4, Line 12"*).
  - Page reference and extraction confidence score (0–100%).
  - Side-by-side visual textual diff highlighting additions, deletions, and semantic substitutions.

---

### E. Dual-Jurisdiction Statutory Subject-Matter Screening Engine

PatentIntel.AI is the first platform to integrate automated statutory legal screening into the prior-art retrieval workflow across two major patent jurisdictions:

```
+-----------------------------------------------------------------------------------+
|               DUAL-JURISDICTION STATUTORY ELIGIBILITY FLOWCHART                   |
+-----------------------------------------------------------------------------------+
|  TARGET APPLICATION CLAIM INPUT  -->  [ Statutory Screening Engine ]              |
|                                                                                   |
|  [ INDIA SECTION 3(k) PIPELINE ]              [ US 35 U.S.C. § 101 ALICE PIPELINE]|
|  1. Software per se Exclusion Check           1. Step 1: Statutory Category Check |
|  2. Concrete Hardware Binding Test            2. Step 2A: Judicial Exception Check|
|  3. Technical Effect / Contribution           3. Step 2B: Inventive Concept Check |
|                                                                                   |
|  ==> ELIGIBILITY RATING: [HIGH / MODERATE / CRITICAL STATUTORY RISK]              |
+-----------------------------------------------------------------------------------+
```

#### 1. India Patent Act Section 3(k) Engine (CRI Guidelines)
Screens software-related claims against Indian Patent Office Guidelines for Computer-Related Inventions (CRIs):
- **Hardware Apparatus Binding:** Verifies whether software method steps are structurally tied to specific physical hardware components (e.g., processors, sensors, memory controllers).
- **Technical Contribution / Technical Effect:** Evaluates whether the claimed invention achieves a concrete technical effect (e.g., reduced memory consumption, enhanced data security, hardware acceleration) beyond generic data processing.

#### 2. US 35 U.S.C. § 101 Engine (*Alice* 2-Step Framework)
Automates the Supreme Court *Alice Corp. v. CLS Bank* two-step test:
- **Step 1 (Statutory Category):** Validates whether claims fall into a statutory category (process, machine, manufacture, or composition of matter).
- **Step 2A (Judicial Exception):** Identifies whether claims are directed to an abstract idea, mathematical algorithm, or mental process.
- **Step 2B (Inventive Practical Application):** Analyzes whether claim limitations introduce "significantly more" to transform abstract concepts into a patent-eligible practical application, supported by an interactive claim token inspector.

---

### F. ColPali Multimodal Topology Verification & Automated FER Generation

1. **Multimodal Drawing Topology Matching:** Integrates ColPali vision-language embeddings to index visual patent schematic drawings and block diagrams [5]. The system compares claim structural topologies against retrieved drawing figures to verify physical component layouts.
2. **Automated First Examination Report (FER) Simulation:** Aggregates multi-signal prior-art disclosures and statutory screening scores to simulate official office actions under:
   - **35 U.S.C. § 102:** Single-reference anticipation rejections.
   - **35 U.S.C. § 103:** Multi-reference obviousness combinations under the *Graham v. John Deere* framework.
   - **35 U.S.C. § 112:** Enablement and written description compliance.
   - **1-Click Audit Export:** Generates downloadable executive audit dossiers in PDF, Markdown, and BibTeX formats.

---

### IEEE Formatted References [1]–[20]

[1] F. Wang, et al., "A semantic query expansion-based patent retrieval approach," in *Proc. IEEE 10th Int. Conf. Fuzzy Syst. Knowl. Discov. (FSKD)*, IEEE, 2013, pp. 1021–1025.  
[2] A. H. Roudsari, et al., "Comparison and analysis of embedding methods for patent documents," in *Proc. IEEE Int. Conf. Big Data Smart Comput. (BigComp)*, IEEE, 2021, pp. 210–214.  
[3] Z. Qiu and Z. Wang, "Patent citation network simplification and similarity evaluation based on technological inheritance," *IEEE Trans. Eng. Manage.*, vol. 70, no. 12, pp. 4144–4161, Dec. 2021.  
[4] A. Hafner, N. Damij, and D. Modic, "Augmented intelligence for state-of-the-art patent search," in *Proc. IEEE Technol. Eng. Manage. Conf. (TEMSCON EUROPE)*, IEEE, 2022, pp. 1–6.  
[5] M. Kucer, et al., "DeepPatent: Large scale patent drawing recognition and retrieval," in *Proc. IEEE/CVF Winter Conf. Appl. Comput. Vis. (WACV)*, IEEE, 2022, pp. 2320–2329.  
[6] K. Vaish, et al., "Artificial intelligence reducing the intricacies of patent prior art search," in *Proc. Int. Conf. Comput. Intell. Sustain. Eng. Solut. (CISES)*, IEEE, 2023, pp. 412–418.  
[7] M. Li, et al., "Exploiting patent documents for cross-domain knowledge transfer in innovative engineering design: A Doc2Vec-GAT-based approach," in *Proc. IEEE 19th Int. Conf. Autom. Sci. Eng. (CASE)*, IEEE, 2023, pp. 1–6.  
[8] Z. Lin and Y. Shen, "Patent plagiarism identification model based on multi-dimensional similarity fusion using multi-sim SBERT," in *Proc. 2nd Int. Conf. Mechatronics, IoT Ind. Informatics (ICMIII)*, IEEE, 2024, pp. 105–110.  
[9] A. C. S. Sheela and C. Jayakumar, "Comparative study of syntactic search engine and semantic search engine: A survey," in *Proc. 5th Int. Conf. Sci. Technol. Eng. Math. (ICONSTEM)*, vol. 1, IEEE, 2019, pp. 182–187.  
[10] M. B. Weighted TF-IDF, "BERT for Improving Semantic Search," in *Proc. 2nd Int. Conf. Adv. Res. Comput. (ICARC)*, IEEE, 2022, pp. 45–50.  
[11] K. Vowinckel and V. D. Hähnke, "SEARCHFORMER: Semantic patent embeddings by siamese transformers for prior art search," *World Patent Information*, vol. 73, p. 102192, Jun. 2023.  
[12] K.-Y. Lee and J. Bai, "PAI-NET: Retrieval-augmented generation patent network using prior art information," *Systems*, vol. 13, no. 4, p. 259, Apr. 2025.  
[13] H. Bekamiri, D. S. Hain, and R. Jurowetzki, "PatentsBERTa: A deep NLP based hybrid model for patent distance and classification using augmented SBERT," *Technol. Forecast. Soc. Change*, vol. 206, p. 123536, Sep. 2024.  
[14] M. Freunek and A. Bodmer, "BERT based patent novelty search by training claims to their own description," *arXiv preprint arXiv:2103.01126*, Mar. 2021.  
[15] V. Stamatis, "End to end neural retrieval for patent prior art search," in *Proc. Eur. Conf. Inf. Retrieval (ECIR)*, Cham: Springer, 2022, pp. 315–322.  
[16] Z. Elmi, et al., "CPC-aware neural patent retrieval with LLM-assisted query expansion," *Journal of Data, Information and Management*, pp. 1–17, 2026.  
[17] J. Risch, et al., "PatentMatch: A dataset for matching patent claims & prior art," *arXiv preprint arXiv:2012.13919*, Dec. 2020.  
[18] N. Reimers and I. Gurevych, "Sentence-BERT: Sentence embeddings using siamese BERT-networks," in *Proc. Conf. Empir. Methods Nat. Lang. Process. (EMNLP-IJCNLP)*, Nov. 2019, pp. 3982–3992.  
[19] J.-S. Lee and J. Hsiang, "PatentBERT: Patent classification with fine-tuning a pre-trained BERT model," *arXiv preprint arXiv:1906.02124*, Jun. 2019.  
[20] A. Trappey, C. V. Trappey, and A. Hsieh, "An intelligent patent recommender adopting machine learning approach for natural language processing: A case study for smart machinery technology mining," *Technol. Forecast. Soc. Change*, vol. 164, p. 120511, Mar. 2021.  

---

### 979-8-3315-8242-5/26/$31.00 ©2026 IEEE
