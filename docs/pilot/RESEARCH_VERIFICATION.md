# Research verification register

Verified against primary records on 24 September 2026. Bibliographic existence is not proof that this application implements a paper or reproduces its results.

| Proposal claim | Primary evidence | Disposition |
|---|---|---|
| BM25 ranking | Robertson & Zaragoza, The Probabilistic Relevance Framework: BM25 and Beyond, 2009: https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf | Implement formula; test on an explicit corpus. No accuracy claim without relevance labels. |
| SBERT embeddings | Reimers & Gurevych, EMNLP-IJCNLP 2019, 3982–3992, DOI 10.18653/v1/D19-1410: https://aclanthology.org/D19-1410/ | Paper verified. Pilot has no SBERT inference; remove semantic-model performance claims from delivered scope. |
| PatentMatch evaluation | PatentMatch: A Dataset for Matching Patent Claims & Prior Art, arXiv:2012.13919: https://arxiv.org/abs/2012.13919 | Dataset publication verified. No local reproducible run establishes the draft's reported metrics. |
| ColPali visual verification | ColPali: Efficient Document Retrieval with Vision Language Models, arXiv:2407.01449: https://arxiv.org/abs/2407.01449 | Publication verified; not implemented or evaluated by pilot. Hide visual match scores. |
| 91.2% precision, 88.6% recall, 145ms, examiner time reduction | No experiment manifest, split, labels, raw predictions or timed trial establishes these numbers | Withdraw as empirical application results. Existing figures are unverified illustrative drafts. |
| Statutory compliance guarantees, FTO clearance, novelty improvements | No legal determination or calibrated evaluation supplied | Remove from product claims; reviewer decisions describe internal drafting workflow only. |
| Other numbered references in legacy drafts | Not independently established in this checkpoint | Unverified; not included in pilot bibliography or used as evidence for product claims. |

Original papers explain methods, not this product's accuracy. A future benchmark must record dataset/license, exclusions, document-level split, model revision, parameters, raw predictions, relevance judgements, P@k/recall@k, latency hardware and run timestamp. Do not use demo records as evaluation ground truth.

Existing IEEE manuscripts remain historical drafts and are labelled accordingly. They must not be submitted as validated results without a separate bibliographic and experimental review.
