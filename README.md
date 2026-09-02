# ⚖️ PatentIntel.AI — Claim-Centric LLM Prior-Art Retrieval & Patent Intelligence Engine

> **PatentIntel.AI** is an advanced, production-grade patent intelligence platform engineered for IP attorneys, patent examiners, and corporate R&D teams. It combines **deterministic NLP grounding**, **vector-based prior-art search**, **server-side official USPTO/Google Patents resolution**, and **Generative LLM reasoning** (Google Gemini 1.5 Pro / OpenAI GPT-4o) to deliver high-precision patent claim analysis and invalidity assessment.

---

## 🌟 Key Features & Core Modules

### 1. 📂 Patent Document Workspace & Real-Time Parser
- **Live USPTO / Google Patents Direct Fetcher**: Resolves patent identifiers (e.g., `US11650869B2`, `US11954112B2`) in real-time server-side without browser CORS constraints.
- **Drag & Drop PDF Specification Parser**: Client-side and hybrid binary parsing using `pdfjs-dist` to extract claims, abstract, filing dates, and assignees directly from PDF specification disclosures.
- **Canonical Identity Validation**: Verifies document publication numbers and kind codes against requested identifiers.

### 2. 🔀 Isolated Dual-Pipeline Source Router
- **Domain-Specific Classification**: Prevents cross-domain contamination by classifying inputs into `PATENT` identifiers vs. `ACADEMIC` prior-art keywords.
- **Zero Fallback Contamination**: Patent identifier lookups query official USPTO/Google Patents channels exclusively, ensuring OpenAlex academic papers are never returned for a patent identifier.

### 3. 🔍 Hybrid Prior-Art Retrieval Engine (BM25 + SBERT)
- Combined lexical (BM25) and dense semantic embedding (Sentence-BERT / FAISS) scoring over official patent databases.
- Multi-vector scoring across CPC classification categories, claims similarity, and abstract disclosures.

### 4. 🧩 Claim Decomposition & Element Alignment
- Automatically breaks down complex independent claims into discrete structural components, system functions, inputs, outputs, and operational constraints.
- Provides target-to-retrieved element mapping to evaluate novelty (35 U.S.C. § 102) and non-obviousness (35 U.S.C. § 103).

### 5. 📜 AI Evidence Reasoning & § 112 Grounding Engine
- **Text Chunking & Tokenization**: Paragraph-level source specification chunking.
- **Porter-like Stemming & Jaccard Overlap**: Calculates exact evidence support scores:
  - `SUPPORTED` (Score $\ge 0.65$)
  - `PARTIALLY_SUPPORTED` (Score $\ge 0.30$)
  - `UNSUPPORTED` (Score $< 0.30$)

### 6. ⚡ Strategic AI Claim Synthesizer
Synthesizes grounded independent and dependent claims across 3 distinct patent prosecution strategies:
- 🛡️ **Broad Supported Claim**: Maximizes claim scope while maintaining traceable specification disclosure.
- ⚖️ **Balanced Claim**: Standard commercial specification protection.
- 🔬 **Narrow Technical Defense**: High-density feature constraints for defensive patent filing.

### 7. 🌐 WIPO-Compliant Multilingual Patent Translator
- Patent-aware translation for foreign claims (Chinese `zh`, Japanese `ja`, German `de`, French `fr`).
- Preserves technical terminology, claim dependency chains, and numerical unit formatting.

---

## 🏗️ Technical Architecture & Tech Stack

```
                                  ┌───────────────────────────┐
                                  │   React 19 Frontend UI    │
                                  └─────────────┬─────────────┘
                                                │
                                    isPatentIdentifier(query)
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       │                                                 │
                [RETURNS TRUE]                                    [RETURNS FALSE]
                       │                                                 │
                       ▼                                                 ▼
             PATENT PIPELINE ROUTE                             ACADEMIC PIPELINE ROUTE
             ─────────────────────                             ───────────────────────
           • Node.js Proxy (/api/patents/resolve)            • OpenAlex API
           • USPTO PatentsView REST API                      • CrossRef / IEEE
           • Official Patent Record                          • Research Paper Record
```

### Stack Specification

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **React 19** (`react` `^19.2.8`) | Component framework with concurrent features and clean state management. |
| **Type Safety** | **TypeScript 5.x/6.0** (`~6.0.2`) | Strict typing across all data interfaces (`PatentDocument`, `PatentClaim`, `ResearchDocument`). |
| **Build System** | **Vite 8.2** (`vite` `^8.2.2`) | Ultra-fast HMR dev server and Rolldown/SWC production bundler. |
| **Backend Server**| **Node.js ESM Middleware** | Embedded Vite middleware for server-side scraping and proxy endpoints. |
| **Icons & UI** | **Lucide React** (`^1.37.0`) | Modern SVG icon set. |
| **PDF Engine** | **PDF.js (`pdfjs-dist`)** | Extract text and metadata from PDF files in browser or server. |
| **Styling** | **Vanilla CSS Tokens** | Custom HSL design tokens with dark-mode aesthetic (`#0B0F19`), grid layouts, and glassmorphism. |

---

## ⚙️ API & LLM Configuration

**PatentIntel.AI** supports both direct **Google Gemini 1.5** / **OpenAI API** live completions and internal dynamic NLP engines.

### Setting Up API Keys in the UI:
1. Open the application and click **System Settings** in the left sidebar.
2. Select your preferred reasoning provider (**Google Gemini 1.5 Pro** or **OpenAI GPT-4o**).
3. Paste your API Key into the **LLM API Key** field and click **Save System Settings**.
4. The system immediately routes live completions directly to your API endpoint!

### Setting Up via Environment Variables (`.env`):
Create a `.env` file in the project root directory:
```env
VITE_GEMINI_API_KEY="AIzaSyB..."
VITE_OPENAI_API_KEY="sk-proj-..."
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Madhuarvind/PatentIntel.AI.git
cd "Major Project 2"
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```
Generates production bundle in `dist/`.

---

## 🧪 Testing Live Patent Import

Try importing the following official USPTO patent numbers in the **Patent Workspace**:

- `US11650869B2` — *Quantum computing service with local edge devices supporting multiple quantum computing technologies* (Amazon Technologies Inc)
- `US11954112B2` — *Intelligent control vector generation for machine learning accelerators*
- `US11594127B1` — *Autonomous collision warning system with V2X roadside unit telemetry*

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more details.
