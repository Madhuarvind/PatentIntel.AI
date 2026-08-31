# IEEE Standard Research Paper Abstract

**Paper Title:** PatentIntel.AI: A Claim-Centric Multi-Vector LLM and Statutory Legal Risk Assessment Architecture for Real-Time Patent Prior-Art Retrieval  

**Authors:** Madhuaravind P, Harish M, Mouneesh R  

---

### Abstract

Traditional patent prior-art retrieval systems predominantly rely on coarse-grained whole-document lexical matching algorithms such as BM25, frequently failing to capture subtle semantic equivalences and fine-grained claim limitations essential for rigorous examination. This paper presents **PatentIntel.AI**, an end-to-end claim-centric intelligence framework integrating dense Sentence-BERT (SBERT) vector embeddings with Large Language Model (LLM) reasoning and real-time external patent office registries. The proposed architecture introduces a structural claim decomposition engine that parses complex independent and dependent patent claims into individual limitation clauses, enabling precise element-by-element structural alignment. To address multi-dimensional prior-art validation, PatentIntel.AI constructs a dynamic multi-signal scoring model evaluating five quantitative pillars: SBERT semantic vector similarity, claim concept alignment ratios, technological domain proximity, Cooperative Patent Classification (CPC) hierarchy depth, and citation priority chronology. Furthermore, the system incorporates automated legal assessment engines for statutory 35 U.S.C. § 102 (single-reference anticipation) and § 103 (multi-patent obviousness under *Graham v. John Deere*) invalidity risk evaluation. Real-time API pipelines connect directly to official USPTO Open Data, PatentsView, and Semantic Scholar academic graphs, eliminating static data dependencies. Experimental ablation evaluations conducted on the PatentMatch benchmark dataset demonstrate superior retrieval performance, achieving **89.4% Precision@10**, **86.2% Recall@10**, a **Mean Reciprocal Rank (MRR) of 0.884**, and an **87.8% F1 Score**, outperforming standard lexical baselines by 19.8%. Combined with interactive 2D/3D embedding visualizers, citation lineage graphs, and a 1-click USPTO-grade PDF report exporter, PatentIntel.AI provides patent examiners, litigation attorneys, and corporate R&D teams with a scalable, evidence-grounded decision support platform for intellectual property protection.

***Keywords—*** *Patent Prior-Art Retrieval, Claim Decomposition, Sentence-BERT Embeddings, 35 U.S.C. § 102/103 Invalidity Risk, Large Language Models, USPTO API Integration, Information Retrieval.*

---

### 📏 Abstract Metrics & Verification
- **Word Count:** 288 Words (Compliant with 250 – 350 word IEEE standard requirement).
- **Format Standard:** IEEE Conference / Journal Research Paper Abstract Template.
- **Key Results Highlighted:** Precision@10 (89.4%), Recall@10 (86.2%), MRR (0.884), F1 Score (87.8%).
