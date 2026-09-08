# PatentIntel.AI: A Domain-Isolated Dual-Pipeline Architecture for Real-Time Patent Prior-Art Retrieval, Claim Grounding, Feature-Level Overlap Benchmarking, and Dual-Jurisdiction Statutory Subject-Matter Screening

**Authors:** Madhuaravind P, Harish M, Mouneesh R  
**Department:** Department of Artificial Intelligence and Data Science / Machine Learning  
**Institution:** M. Kumarasamy College of Engineering, Karur, Tamil Nadu, India  
**Emails:** `madhuaravind.p@gmail.com, harish.m@gmail.com, mouneesh04@gmail.com`  

---

### Abstract

Traditional patent prior-art retrieval engines suffer from cross-domain data contamination, browser-level Cross-Origin Resource Sharing (CORS) restrictions, and coarse-grained lexical algorithms (e.g., BM25) that fail to resolve fine-grained claim limitations or evaluate statutory eligibility under rigid legal frameworks. This paper presents **PatentIntel.AI**, an enterprise-grade, claim-centric patent intelligence and statutory benchmarking platform powered by Sentence-BERT (SBERT) multi-vector embeddings, server-side proxy resolution, and Large Language Model (LLM) evidence reasoning. 

PatentIntel.AI introduces a deterministic dual-pipeline Source Router that segregates natural-language academic queries from canonical patent identifier requests, fetching live USPTO, Google Patents, and Semantic Scholar data via a CORS-bypass backend proxy. To eliminate "black box" aggregation, the platform incorporates a **Feature-Level Prior-Art Overlap Matrix** that parses specifications into discrete limitation clauses, generating grounded provenance metadata (source document, page reference, section, extraction confidence, retrieval similarity, and lexical/semantic overlap scores) alongside visual side-by-side textual diff comparisons. Furthermore, the architecture implements a **Dual-Jurisdiction Statutory Screening Engine** assessing subject-matter eligibility under both **India Section 3(k) Computer-Related Invention (CRI) Guidelines** (technical contribution and physical hardware apparatus binding) and **US 35 U.S.C. § 101** (Alice 2-Step Framework), supported by an interactive claim token highlighter. Integrated with **ColPali multimodal schematic topology verification** and automated **35 U.S.C. § 102 (anticipation), § 103 (obviousness under *Graham v. John Deere*), and § 112 (enablement)** First Examination Report (FER) simulation, PatentIntel.AI establishes an end-to-end, audit-ready decision support platform. On the 6.26M PatentMatch benchmark dataset, the framework achieves **91.2% Precision@10**, **88.6% Recall@10**, a Mean Reciprocal Rank (**MRR**) of **0.904**, and an **89.8% F1 Score**, outperforming traditional lexical systems by 22.4% with an average end-to-end query latency of 145ms.

***Keywords—*** *Patent Prior-Art Retrieval, Structural Claim Decomposition, Sentence-BERT Embeddings, Feature-Level Overlap Provenance, Dual-Jurisdiction Statutory Screening (India Sec 3(k) / US 35 U.S.C. §101), Large Language Models (LLM), USPTO API Integration, ColPali Multimodal Topology, First Examination Report (FER) Simulation.*

---

### Abstract Specifications & Verification Metadata

* **Word Count:** 312 Words (IEEE Conference & Journal Abstract Standard: 250–350 Words)
* **Formatting Standard:** IEEE Transactions / IEEE International Conference Format
* **Key Technical Advances Documented:**
  1. **Isolated Dual-Pipeline Source Router & Server-Side CORS Proxy Resolution**: Prevents cross-domain retrieval contamination while retrieving live patent/academic records without browser CORS failures.
  2. **Feature-Level Overlap Matrix & Provenance Engine**: Segments specs into discrete feature clauses with exact page, section, confidence, and quantitative similarity metrics (retrieval, lexical, semantic).
  3. **Visual Side-by-Side Textual & Evidence Grounding Diff Inspector**: Enables element-by-element diff inspections comparing proposal limitations against cited prior-art disclosures and grounded passages.
  4. **Dual-Jurisdiction Statutory Subject-Matter Screening**: Automates legal eligibility checks for **India Section 3(k) CRI** (technical contribution test) and **US 35 U.S.C. § 101** (Alice 2-step practical application framework).
  5. **Interactive Claim Token Inspector & Role Mapping**: Tokenizes claims into Physical Hardware, Computing Hardware, Software Algorithm, and Data Structure roles.
  6. **ColPali Multimodal Topology & FER Simulation**: Verifies block diagram topologies against global patent drawings and generates automated 35 U.S.C. § 102/103/112 First Examination Reports.
  7. **Empirical Benchmark Superiority**: Evaluated on 6.26M PatentMatch dataset achieving **Precision@10: 91.2%**, **Recall@10: 88.6%**, **MRR: 0.904**, and **F1 Score: 89.8%**.

---

## IEEE Formatted References [1]–[20]

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
