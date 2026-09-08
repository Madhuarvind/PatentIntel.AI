# PatentIntel.AI: Formal Problem Statement

**Authors:** Madhuaravind P, Harish M, Mouneesh R  
**Department:** Department of Artificial Intelligence and Data Science / Machine Learning  
**Institution:** M. Kumarasamy College of Engineering, Karur, Tamil Nadu, India  

---

## PROBLEM STATEMENT

Despite recent advancements in natural language processing and dense neural embeddings, contemporary patent prior-art examination frameworks face five critical architectural and statutory limitations that severely compromise examination velocity, legal precision, and procedural compliance in global intellectual property (IP) offices:

---

### 1. Cross-Domain Data Contamination & Browser-Level CORS Bottlenecks
Web-based patent retrieval interfaces routinely attempt client-side HTTP fetch calls to heterogeneous external registries (e.g., USPTO PatentsView, Google Patents, and Semantic Scholar). These requests frequently fail due to browser Cross-Origin Resource Sharing (CORS) security policies. In response, conventional tools fall back on unvalidated static database snapshots or unrouted search queries that blend natural-language academic literature with formal patent claim specifications. This cross-domain data contamination degrades search precision, introduces non-patent prior art into statutory novelty determinations, and disrupts real-time patent office workflows [1], [9], [13].

---

### 2. Coarse-Grained Lexical Retrieval & Vocabulary Obfuscation
Traditional commercial search engines rely on coarse-grained lexical matching algorithms such as Okapi BM25 and Term Frequency-Inverse Document Frequency (TF-IDF), which treat patent specifications as monolithic text blocks [9], [10]. Patent applicants routinely employ "lexical obfuscation"—deliberately substituting standard technical terminology with custom nomenclature, functional legalese, or broad abstractions to avoid keyword detection by prior-art filters [1]. Lexical matching systems cannot resolve semantic equivalence, fail to decompose multi-tier claims into discrete limitation clauses, and yield high false-negative rates during novelty examination [1], [11].

---

### 3. "Black-Box" Aggregation & Absence of Feature-Level Provenance
Existing semantic search engines return aggregate scalar similarity scores (e.g., "82% overall match") without providing granular, auditable evidence provenance [8], [15]. Patent examiners and litigation attorneys cannot verify which specific claim limitation clause aligns with a cited prior-art passage. Current tools lack element-by-element textual diff visualizers, extraction confidence metrics, page/section location metadata, and quantitative lexical versus semantic overlap breakdowns. This "black box" aggregation forces examiners to manually re-read full prior-art specifications to locate cited disclosures, inducing severe cognitive fatigue [4], [14].

---

### 4. Absence of Dual-Jurisdiction Statutory Subject-Matter Pre-Screening
Existing prior-art discovery platforms focus exclusively on textual vector distance while completely omitting statutory subject-matter eligibility pre-screening under rigid statutory legal frameworks [6], [12], [16]. Specifically, platforms fail to evaluate:
- **India Patent Act Section 3(k) (CRI Guidelines):** Statutory exclusion of computer programs *per se*, mathematical methods, and business algorithms unless bound to a specific physical hardware apparatus that yields a novel technical contribution or technical effect.
- **US 35 U.S.C. § 101 (Alice 2-Step Framework):** Judicial exception screening under Step 1 (statutory category), Step 2A (directed to an abstract idea, mathematical concept, or mental process), and Step 2B (evaluating whether claim limitations recite significantly more to transform the exception into a patent-eligible practical application).

Without automated statutory eligibility screening, patent offices risk issuing invalid patents that are vulnerable to post-grant opposition, inter partes review (IPR), or costly litigation [12], [16].

---

### 5. Manual Synthesis Burden for 35 U.S.C. §§ 102, 103, and 112 Invalidity Analysis
Determining single-reference anticipation under 35 U.S.C. § 102 and multi-reference obviousness combinations under 35 U.S.C. § 103 (*Graham v. John Deere* framework) currently requires manual synthesis across disparate patent references [17]. Examiners lack automated multi-signal legal risk calculators that integrate claim alignment ratios, domain taxonomy depth (CPC/IPC), and priority chronology gaps into standardized, audit-ready First Examination Reports (FER) [17].

---

### Formal Mathematical Problem Definition

Let $\mathcal{C} = \{c_1, c_2, \dots, c_m\}$ represent a target patent application containing $m$ structural claim limitation clauses, and let $\mathcal{D} = \{D_1, D_2, \dots, D_N\}$ represent a repository of prior-art patent disclosures retrieved via a server-side CORS-bypass proxy.

The objective of **PatentIntel.AI** is to construct a deterministic, multi-signal mapping function $\Phi(\mathcal{C}, D_j)$ that minimizes cross-domain retrieval error $\epsilon$ and maximizes evidence provenance transparency:

$$\max_{\Phi} \sum_{i=1}^{m} \left( \alpha \cdot \text{Sim}_{\text{SBERT}}(c_i, p_{j,k}) + \beta \cdot \text{Overlap}_{\text{Lexical}}(c_i, p_{j,k}) + \gamma \cdot \text{Align}_{\text{CPC}}(c_i, D_j) \right) - \lambda \cdot \mathbf{1}_{\text{CORS\_Failure}}$$

subject to statutory eligibility constraint:

$$\Omega_{\text{Statutory}}(c_i) = \begin{cases} 
1 & \text{if } \text{Section3k}(c_i) = \text{Eligible} \wedge \text{Sec101Alice}(c_i) = \text{Eligible} \\
0 & \text{otherwise}
\end{cases}$$

where $p_{j,k}$ denotes the $k$-th grounded disclosure passage within prior-art document $D_j$, $\text{Sim}_{\text{SBERT}}$ is the dense semantic vector cosine similarity, $\text{Overlap}_{\text{Lexical}}$ is the clause-level token overlap score, $\text{Align}_{\text{CPC}}$ is the Cooperative Patent Classification hierarchy proximity, and $\Omega_{\text{Statutory}}$ guarantees dual-jurisdiction legal eligibility compliance.

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
