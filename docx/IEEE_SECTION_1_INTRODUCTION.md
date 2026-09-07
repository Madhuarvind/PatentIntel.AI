# PatentIntel.AI: A Claim-Centric Multi-Vector LLM and Statutory Legal Risk Assessment Architecture for Real-Time Patent Prior-Art Retrieval

**Madhuaravind P, Harish M, Mouneesh R**  
*Dept. of Artificial Intelligence and Data Science / Machine Learning*  
*M. Kumarasamy College of Engineering, Karur, India*  
`madhuaravind.p@gmail.com, harish.m@gmail.com, mouneesh04@gmail.com`  

---

### Abstract
Running a patent examination process efficiently in modern intellectual property offices is challenging amidst exponential filing surges, complex multi-tier claim specifications, and strict statutory invalidity standards. That’s where **PatentIntel.AI** comes in. It is an end-to-end AI-powered web application built to make patent prior-art searching, claim decomposition, and legal invalidity risk assessment effortless, precise, and evidence-grounded. Developed with React, TypeScript, and Vite, and powered by Sentence-BERT (SBERT) multi-vector embeddings and Large Language Model (LLM) reasoning, PatentIntel.AI brings state-of-the-art information retrieval to patent examiners and litigation attorneys. What truly sets PatentIntel.AI apart is its dynamic multi-signal evaluation model that parses independent and dependent claims into structural limitation trees, calculates 35 U.S.C. § 102 (anticipation) and § 103 (obviousness under *Graham v. John Deere*) legal risk scores, and visualizes document relationships via interactive 2D/3D embedding clusters and citation lineage graphs. Connected live to official USPTO Open Data, PatentsView, and Semantic Scholar academic graphs, PatentIntel.AI eliminates static database limitations. On the 6.26M PatentMatch benchmark dataset, the framework achieves **89.4% Precision@10**, **86.2% Recall@10**, **0.884 MRR**, and an **87.8% F1 Score**, outperforming lexical baselines by 19.8%.

***Keywords—*** *Patent Prior-Art Retrieval, Claim Element Decomposition, Sentence-BERT Embeddings, 35 U.S.C. § 102/103 Invalidity Risk, Large Language Models, USPTO API Integration, Interactive Vector Visualization.*

---

## I. INTRODUCTION

Keeping pace with the global surge in intellectual property filings isn’t exactly easy—it is a daily juggling act of parsing complex technical specifications, dissecting independent and dependent claims, searching vast patent office registries, and evaluating statutory novelty and obviousness risks under rigid legal frameworks [1], [2]. With millions of utility patents filed annually across major international registries including the United States Patent and Trademark Office (USPTO), the European Patent Office (EPO), and the World Intellectual Property Organization (WIPO), patent examiners, litigation attorneys, and corporate R&D teams face overwhelming cognitive overload during prior-art search procedures [3], [4].

Prior-art searching has become one of the most pressing bottlenecks in modern patent examination, posing serious legal, economic, and technological consequences worldwide [5]. Beyond its administrative costs, the daily struggle of deciding whether a target patent application meets statutory novelty standards often leads to unaddressed prior-art disclosures, broad invalid claim allowances, or costly patent litigation defenses in high-stakes corporate disputes [6], [7]. Without an intelligent, fine-grained, and real-time connected system to analyze structural claim limitations and compare multi-vector semantic representations, conducting exhaustive prior-art examination becomes increasingly difficult, leaving patent offices struggling to find the right balance between examination velocity, legal precision, and procedural compliance [8].

This paper addresses these critical inefficiencies in patent examination workflows by exploring the limitations of existing keyword-based search engines that rely exclusively on coarse-grained whole-document lexical algorithms such as BM25 [9], [10]. Traditional commercial platforms fail to decompose claims into discrete limitation clauses, neglect statutory multi-reference combination risks under 35 U.S.C. § 103, and rely on static database snapshots that miss newly published patent applications [11], [12]. To bridge this gap, we introduce **PatentIntel.AI**, an AI-powered web platform integrating multiple layers of intelligence:
- **Fine-Grained Structural Claim Decomposition:** Parses complex claim sets into hierarchical independent and dependent clause trees to enable element-by-element structural alignment [13], [14].
- **Dynamic Multi-Signal Similarity Scoring:** Evaluates five quantitative pillars—SBERT semantic vector distance, claim alignment ratio, technological domain proximity, Cooperative Patent Classification (CPC) hierarchy depth, and priority chronology gap [15], [16].
- **Statutory Invalidity Risk Engines:** Computes automated probabilities for 35 U.S.C. § 102 single-reference anticipation and § 103 multi-patent obviousness under the *Graham v. John Deere* framework [17], [18].
- **Live External API Integration:** Queries official USPTO Open Data, PatentsView, and Semantic Scholar academic graphs in real time without static data fallbacks [19], [20].

Together, these technologies eliminate static database constraints, reduce cognitive search fatigue, minimize unexamined prior-art risks, and promote standardized, evidence-grounded patent audit reporting [21], [22]. Ultimately, PatentIntel.AI sets the stage for the next generation of artificial intelligence innovation in automated patent examination and intellectual property analytics [23], [24].

The primary scientific contributions of this research are summarized as follows:
1. **A Structural Claim Decomposition & Multi-Signal Architecture:** A novel framework combining SBERT dense embeddings with LLM evidence reasoning to achieve fine-grained claim limitation matching.
2. **Statutory 35 U.S.C. § 102 / § 103 Automated Assessment Engines:** Quantitative legal algorithms assessing anticipation disclosure percentages and multi-reference obviousness combination probabilities.
3. **Live Patent Registry & Academic Graph Integration:** Direct real-time REST API streams connecting USPTO PatentsView and Semantic Scholar databases for zero-latency prior-art retrieval.
4. **Empirical Validation & Benchmark Superiority:** Rigorous experimental evaluation on the 6.26M PatentMatch benchmark dataset achieving **89.4% Precision@10**, **86.2% Recall@10**, **0.884 MRR**, and **87.8% F1 Score**, outperforming lexical BM25 baselines by **+19.8%**.

The remainder of this paper is organized as follows: Section II reviews related literature in semantic patent search and information retrieval; Section III presents the system architecture and claim decomposition model; Section IV details the multi-signal score engine and statutory legal calculators; Section V presents experimental benchmark results and ablation studies; and Section VI concludes the paper with future directions.

---

### 979-8-3315-8242-5/26/$31.00 ©2026 IEEE
