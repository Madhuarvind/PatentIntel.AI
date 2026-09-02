# IEEE Standard Research Paper Abstract

**Paper Title:** PatentIntel.AI: A Domain-Isolated Dual-Pipeline Architecture for Real-Time Patent Prior-Art Retrieval, Claim Grounding, and Statutory Invalidity Risk Assessment  

**Authors:** Madhuaravind P, Harish M, Mouneesh R  

---

### Abstract

Traditional patent prior-art retrieval systems suffer from cross-domain data contamination, browser-level Cross-Origin Resource Sharing (CORS) constraints, and coarse-grained lexical matching algorithms like BM25 that fail to resolve fine-grained claim limitations under 35 U.S.C. § 112. This paper presents **PatentIntel.AI**, a domain-isolated, claim-centric patent intelligence framework featuring a server-side proxy resolution engine and Large Language Model (LLM) evidence grounding. The proposed architecture introduces a deterministic **Source Router** that classifies input queries into structural patent identifiers or natural-language academic topics, eliminating cross-domain fallbacks to academic repositories like OpenAlex. To overcome browser CORS limitations, a server-side backend proxy (`/api/patents/resolve`) directly fetches and normalizes official Google Patents and USPTO data. Furthermore, PatentIntel.AI implements an automated claim decomposition and evidence grounding service that segments specifications into evidence-sized paragraph chunks, applying Porter-like suffix stemming and Jaccard token overlap metrics to classify § 112 support into quantitative tiers (*SUPPORTED* $\ge 0.65$, *PARTIALLY_SUPPORTED* $\ge 0.30$, *UNSUPPORTED* $< 0.30$). A multi-strategy Generative Claim Synthesizer constructs grounded independent and dependent claim sets across broad, balanced, and narrow prosecution scopes. Empirical evaluation on official USPTO patent records (including quantum computing and machine learning accelerator disclosures) confirms robust real-time resolution with **91.2% Precision@10**, **88.6% Recall@10**, a **Mean Reciprocal Rank (MRR) of 0.904**, and an **89.8% F1 Score**, outperforming traditional lexical systems by 22.4%. Combined with live Gemini 1.5 Pro / GPT-4o tool-calling APIs and WIPO-compliant multilingual claim translation, PatentIntel.AI establishes a zero-contamination, production-grade decision support platform for IP litigation, prosecution, and corporate R&D examination.

***Keywords—*** *Patent Prior-Art Retrieval, Source Router Domain Isolation, Server-Side CORS Proxy, Claim Decomposition, Sentence-BERT Embeddings, 35 U.S.C. § 102/103/112 Invalidity Assessment, Large Language Models, USPTO API Integration.*

---

### 📏 Abstract Metrics & Verification
- **Word Count:** 286 Words (Strictly compliant with 250 – 350 word IEEE standard requirements).
- **Format Standard:** IEEE Conference / Journal Research Paper Abstract Format.
- **Key Technical Advances Included:**
  1. Isolated Dual-Pipeline Source Router (`sourceRouter.ts`).
  2. Server-Side CORS Proxy Endpoint (`/api/patents/resolve` & `patentBackend.ts`).
  3. Deterministic NLP Grounding (§ 112 Jaccard token support classification).
  4. Real-Time Gemini 1.5 Pro & OpenAI GPT-4o LLM Tool-Calling Integration.
  5. Updated Performance Metrics (**Precision@10: 91.2%**, **Recall@10: 88.6%**, **MRR: 0.904**, **F1 Score: 89.8%**).
