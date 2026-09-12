# PatentIntel.AI: Existing System Architecture & Limitation Analysis

**Authors:** Madhuaravind P, Harish M, Mouneesh R  
**Department:** Department of Artificial Intelligence and Data Science / Machine Learning  
**Institution:** M. Kumarasamy College of Engineering, Karur, Tamil Nadu, India  

---

## EXISTING SYSTEM ANALYSIS

Current enterprise patent analysis platforms, commercial patent search portals (e.g., legacy USPTO search, Espacenet, and basic Google Patents interfaces), and first-generation neural retrieval tools represent the benchmark against which modern patent intelligence platforms are measured. This section provides a comprehensive technical dissection of the existing system architecture, operational workflow, and key structural deficiencies.

---

### A. Architectural Overview of Existing Systems

The existing patent search and prior-art evaluation paradigm relies primarily on a traditional three-tier client-server architecture:

1. **Query Construction Layer:** Users (patent examiners, attorneys, or R&D researchers) manually formulate complex Boolean search queries consisting of technical keywords, Boolean operators (`AND`, `OR`, `NOT`, `NEAR`), and field restriction tags (e.g., `TTL/` for title, `ABST/` for abstract, `ACLM/` for claims).
2. **Lexical Retrieval Engine:** The query is dispatched to a database backend powered by inverted index data structures running Okapi BM25 or Term Frequency-Inverse Document Frequency (TF-IDF) scoring algorithms.
3. **Monolithic Neural Vector Aggregator:** In first-generation AI-assisted tools, pre-trained language models (such as vanilla BERT or Sentence-BERT) convert the query string and target patent abstracts into single dense vector representations, computing scalar cosine similarity across a vector index.

---

### B. Workflow of Existing Patent Examination

Fig. 1 (Simulated Baseline Workflow) illustrates the operational lifecycle of prior-art discovery in existing commercial platforms:

```
+-----------------------------------------------------------------------------------+
|                           EXISTING SYSTEM WORKFLOW                                |
+-----------------------------------------------------------------------------------+
|  1. Manual Boolean Query Formulation  -->  (High risk of query omission)         |
|  2. Direct Browser HTTP Fetch Call    -->  (Fails due to CORS Policy Errors)      |
|  3. Unrouted Cross-Domain Querying    -->  (Mixes Academic Papers with Patent Claims)|
|  4. BM25 / Monolithic Vector Search   -->  (Treats 50-page specs as single block) |
|  5. Aggregate Scalar Output ("84%")   -->  (Black-Box, zero page/section diff)    |
|  6. Manual Examiner Re-Reading       -->  (High Cognitive Fatigue & Slow Velocity)|
|  7. Statutory Eligibility Omitted     -->  (No India Sec 3(k) or US §101 Screening)|
+-----------------------------------------------------------------------------------+
```

---

### C. Technical Deficiencies & Architectural Limitations

Detailed technical analysis reveals five major architectural bottlenecks inherent in existing patent examination systems:

#### 1. Direct Browser Client Fetching & CORS Proxy Failures
Existing web-based patent search portals rely on direct client-side JavaScript `fetch()` or `axios` HTTP requests from the browser to public APIs (e.g., USPTO REST APIs or Semantic Scholar). Because external endpoints strictly enforce Cross-Origin Resource Sharing (CORS) security headers, these requests fail at the browser layer. To bypass CORS errors without backend proxies, existing platforms fall back on static, outdated database snapshots or unrouted query endpoints. Consequently, natural-language queries intended for official patent databases leak into generic academic repositories, causing cross-domain data contamination where academic journal articles are incorrectly evaluated alongside statutory patent claims [1], [9], [13].

#### 2. Monolithic Document Processing & Lexical Obfuscation Vulnerability
Existing retrieval engines treat patent specifications—which often span tens of thousands of words across multiple independent and dependent claims—as monolithic, unstructured text blocks [9], [10]. Lexical algorithms calculate global term frequencies without isolating independent claim preamble, transition phrases, or body limitations. Furthermore, patent applicants intentionally employ "lexical obfuscation"—deliberately substituting standard technical nomenclature with functional legalese or broad abstractions. Because lexical engines cannot resolve semantic equivalences and monolithic vector models dilute clause-level signals, existing systems suffer high false-negative rates [1], [11].

#### 3. Black-Box Similarity Scoring & Missing Provenance Evidence
Commercial AI patent tools generate aggregate scalar similarity scores (e.g., "78% match") without providing verifiable, element-by-element evidence provenance [8], [15]. These systems lack:
- Fine-grained claim limitation clause breakdown trees.
- Section-level and page-level disclosure metadata.
- Extraction confidence percentages and side-by-side textual diff visualizers.
- Quantitative separation between lexical keyword overlap and semantic vector proximity.

As a result, patent examiners cannot determine which specific claim limitation clause is disclosed by a cited prior-art passage, requiring hours of manual specification re-reading and inducing severe cognitive fatigue [4], [14].

#### 4. Total Omission of Statutory Subject-Matter Eligibility Screening
Existing prior-art tools operate strictly as text retrieval engines, completely ignoring statutory legal eligibility pre-screening under jurisdiction-specific patent acts [6], [12], [16]. Specifically, existing tools provide zero support for:
- **India Patent Act Section 3(k) (CRI Guidelines):** Screening whether computer-implemented claims are bound to a concrete physical hardware apparatus or produce a tangible technical contribution beyond software *per se*.
- **US 35 U.S.C. § 101 (Alice 2-Step Framework):** Evaluating whether software claims are directed to judicial exceptions (abstract ideas, mathematical algorithms, mental processes under Step 2A) and identifying inventive concepts that transform claims into patent-eligible practical applications (Step 2B).

Issuing patents without statutory pre-screening exposes patent applicants and patent offices to immediate post-grant invalidation, inter partes review (IPR) challenges, or expensive litigation [12], [16].

#### 5. Absence of Automated Multi-Signal Legal Invalidity Engines (35 U.S.C. §§ 102 & 103)
Existing platforms do not automate legal invalidity calculations for single-reference anticipation (35 U.S.C. § 102) or multi-reference obviousness combinations (35 U.S.C. § 103 under the *Graham v. John Deere* framework) [17]. Examiners must manually aggregate disclosures across multiple prior-art documents, calculate priority chronology gaps, and assess CPC classification depth without automated First Examination Report (FER) simulation tools [17].

---

### D. Architectural Comparison: Existing vs. Proposed System

Table II summarizes the architectural transition from existing traditional patent tools to the proposed **PatentIntel.AI** platform.

**TABLE II: TECHNICAL COMPARISON OF EXISTING AND PROPOSED SYSTEM ARCHITECTURES**

| Dimension / Architectural Layer | Existing Patent Systems [9], [10], [12] | Proposed PatentIntel.AI System |
|---|---|---|
| **API Connectivity & Security** | Direct browser fetch (CORS failures / static fallbacks) | **Server-Side CORS Proxy & Deterministic Router** |
| **Data Scope & Pipeline Isolation** | Unrouted queries (Cross-domain contamination) | **Domain-Isolated Dual-Pipeline (Patent vs Academic)** |
| **Claim Processing Granularity** | Monolithic document text block | **Hierarchical Limitation Clause Decomposition Tree** |
| **Similarity Representation** | Single scalar score ("82% match", Black Box) | **Multi-Signal Overlap Matrix (SBERT + Lexical + CPC)** |
| **Evidence Provenance & Transparency** | None (Requires manual spec re-reading) | **Grounded Page/Section Metadata & Visual Textual Diff** |
| **Statutory Legal Pre-Screening** | Completely Omitted (0% statutory check) | **Dual-Jurisdiction (India Sec 3(k) & US 35 U.S.C. §101)** |
| **Multimodal Topology Verification** | Text-only (Ignores schematic diagrams) | **ColPali Vision-Language Drawing Topology Matching** |
| **Legal Report Generation** | Manual writing by examiner | **Automated Statutory First Examination Report (FER)** |

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
