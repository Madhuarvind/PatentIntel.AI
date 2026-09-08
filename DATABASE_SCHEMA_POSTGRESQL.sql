-- =============================================================================
-- PATENTINTEL.AI — ENTERPRISE RELATIONAL DATABASE SCHEMA (POSTGRESQL + PGVECTOR)
-- =============================================================================
-- Source of Truth relational database schema for PatentIntel.AI.
-- Includes core domains: Auth, Workspaces, Patents, Claims, Decomposition,
-- Claim Mapping, Prior-Art Analysis, Statutory §102/103 Evaluations, Academic Papers,
-- Authors, Claim Synthesizer Versioning, AI Audit Runs, and Vector Embeddings.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- -----------------------------------------------------------------------------
-- 1. USERS & ORGANIZATIONS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'Patent Research Institute',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT 'Patent Examiner',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. WORKSPACES & WORKSPACE MEMBERS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'MEMBER',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 3. CANONICAL PATENTS & METADATA
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS patents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country VARCHAR(10) NOT NULL DEFAULT 'US',
    publication_number VARCHAR(100) NOT NULL,
    patent_number VARCHAR(100),
    kind_code VARCHAR(10) DEFAULT 'B1',
    title TEXT NOT NULL,
    abstract TEXT,
    filing_date DATE,
    publication_date DATE,
    grant_date DATE,
    priority_date DATE,
    raw_source_identifier VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_patent_pub UNIQUE (country, publication_number)
);

CREATE TABLE IF NOT EXISTS workspace_patents (
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    patent_id UUID REFERENCES patents(id) ON DELETE CASCADE,
    added_by UUID REFERENCES users(id),
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (workspace_id, patent_id)
);

CREATE TABLE IF NOT EXISTS patent_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patent_id UUID NOT NULL REFERENCES patents(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL, -- 'USPTO', 'EPO', 'WIPO', 'GOOGLE_PATENTS', 'PDF_UPLOAD'
    source_identifier VARCHAR(255) NOT NULL,
    source_url TEXT,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verification_status VARCHAR(50) DEFAULT 'VERIFIED',
    identity_confidence NUMERIC(4,3) DEFAULT 1.000
);

CREATE TABLE IF NOT EXISTS patent_assignees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patent_id UUID NOT NULL REFERENCES patents(id) ON DELETE CASCADE,
    assignee_name VARCHAR(255) NOT NULL,
    is_current BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS patent_inventors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patent_id UUID NOT NULL REFERENCES patents(id) ON DELETE CASCADE,
    inventor_name VARCHAR(255) NOT NULL,
    inventor_order INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS patent_classifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patent_id UUID NOT NULL REFERENCES patents(id) ON DELETE CASCADE,
    classification_type VARCHAR(20) NOT NULL, -- 'CPC', 'IPC'
    classification_code VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS patent_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patent_id UUID NOT NULL REFERENCES patents(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64) UNIQUE NOT NULL,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    storage_reference TEXT NOT NULL, -- Reference path or IndexedDB Blob key
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. CLAIMS & DECOMPOSITION ELEMENTS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS patent_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patent_id UUID NOT NULL REFERENCES patents(id) ON DELETE CASCADE,
    claim_number INT NOT NULL,
    claim_type VARCHAR(50) NOT NULL DEFAULT 'INDEPENDENT', -- 'INDEPENDENT', 'DEPENDENT'
    claim_text TEXT NOT NULL,
    parent_claim_id UUID REFERENCES patent_claims(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_patent_claim_number UNIQUE (patent_id, claim_number)
);

CREATE TABLE IF NOT EXISTS claim_elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES patent_claims(id) ON DELETE CASCADE,
    element_number INT NOT NULL,
    element_text TEXT NOT NULL,
    element_type VARCHAR(50) DEFAULT 'COMPONENT', -- 'COMPONENT', 'FUNCTION', 'RELATIONSHIP', 'CONSTRAINT', 'PROCESS'
    cpc_category VARCHAR(50),
    confidence NUMERIC(4,3) DEFAULT 0.950,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. CLAIM MAPPING & PRIOR ART SIMILARITY
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS claim_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_claim_id UUID NOT NULL REFERENCES patent_claims(id) ON DELETE CASCADE,
    target_claim_id UUID NOT NULL REFERENCES patent_claims(id) ON DELETE CASCADE,
    similarity_score NUMERIC(5,2) NOT NULL,
    mapping_type VARCHAR(50) DEFAULT 'HIGH_OVERLAP',
    algorithm VARCHAR(100) DEFAULT 'HYBRID_VECTOR_LEXICAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS element_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_mapping_id UUID NOT NULL REFERENCES claim_mappings(id) ON DELETE CASCADE,
    source_element_id UUID NOT NULL REFERENCES claim_elements(id) ON DELETE CASCADE,
    target_element_id UUID NOT NULL REFERENCES claim_elements(id) ON DELETE CASCADE,
    similarity_score NUMERIC(5,2) NOT NULL,
    evidence TEXT
);

-- -----------------------------------------------------------------------------
-- 6. STATUTORY 35 U.S.C. §102 / §103 EVALUATIONS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    target_patent_id UUID NOT NULL REFERENCES patents(id) ON DELETE CASCADE,
    candidate_patent_id UUID NOT NULL REFERENCES patents(id) ON DELETE CASCADE,
    section_102_risk NUMERIC(5,2) NOT NULL,
    section_103_risk NUMERIC(5,2) NOT NULL,
    total_risk NUMERIC(5,2) NOT NULL,
    model_used VARCHAR(100) DEFAULT 'InvalidityCalculator-v2.1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. ACADEMIC LITERATURE & AUTHOR SEARCH ENGINE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS academic_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type VARCHAR(50) NOT NULL DEFAULT 'RESEARCH_PAPER',
    title TEXT NOT NULL,
    abstract TEXT,
    doi VARCHAR(255),
    publication_year INT,
    publication_date DATE,
    journal VARCHAR(255),
    venue VARCHAR(255),
    citation_count INT DEFAULT 0,
    source VARCHAR(50) NOT NULL, -- 'OpenAlex', 'Semantic Scholar', 'Crossref', 'IEEE'
    source_identifier VARCHAR(255) NOT NULL,
    source_url TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_academic_source UNIQUE (source, source_identifier)
);

CREATE TABLE IF NOT EXISTS academic_authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL,
    source_author_id VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    affiliation TEXT,
    works_count INT DEFAULT 0,
    citation_count INT DEFAULT 0,
    h_index INT DEFAULT 0,
    profile_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_author_source UNIQUE (source, source_author_id)
);

CREATE TABLE IF NOT EXISTS academic_document_authors (
    document_id UUID REFERENCES academic_documents(id) ON DELETE CASCADE,
    author_id UUID REFERENCES academic_authors(id) ON DELETE CASCADE,
    author_order INT DEFAULT 1,
    PRIMARY KEY (document_id, author_id)
);

CREATE TABLE IF NOT EXISTS academic_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    search_mode VARCHAR(50) DEFAULT 'live',
    author_id VARCHAR(255),
    from_year INT,
    to_year INT,
    venue VARCHAR(255),
    publication_type VARCHAR(100),
    min_citations INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. AI CLAIM SYNTHESIZER & VERSIONING
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS claim_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    source_patent_id UUID REFERENCES patents(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    strategy VARCHAR(100) DEFAULT 'broad',
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claim_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID NOT NULL REFERENCES claim_drafts(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    strategy VARCHAR(100) NOT NULL,
    change_summary TEXT,
    claims_snapshot_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. AI AUDIT RUNS, EVIDENCE REASONING & TRANSLATIONS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    workspace_id UUID REFERENCES workspaces(id),
    module VARCHAR(100) NOT NULL, -- 'DECOMPOSITION', 'MAPPING', 'TRANSLATION', 'SYNTHESIS'
    model_name VARCHAR(100) NOT NULL,
    prompt_version VARCHAR(50) NOT NULL,
    input_reference TEXT,
    output_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS translation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    patent_id UUID REFERENCES patents(id),
    source_language VARCHAR(10) NOT NULL DEFAULT 'EN',
    target_language VARCHAR(10) NOT NULL,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS terminology_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id VARCHAR(100) NOT NULL,
    source_term VARCHAR(255) NOT NULL,
    translated_term VARCHAR(255) NOT NULL,
    domain VARCHAR(100) DEFAULT 'PATENT_CLAIMS',
    usage_count INT DEFAULT 1,
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 10. SYSTEM AUDIT LOGS & VECTOR EMBEDDINGS (PGVECTOR)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- 'PATENT_CLAIM', 'RESEARCH_PAPER'
    entity_id UUID NOT NULL,
    model_name VARCHAR(100) NOT NULL DEFAULT 'text-embedding-3-large',
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- INDEXES FOR FAST SEARCH & QUERY OPTIMIZATION
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_patents_pub_num ON patents(publication_number);
CREATE INDEX IF NOT EXISTS idx_patent_claims_patent ON patent_claims(patent_id);
CREATE INDEX IF NOT EXISTS idx_claim_elements_claim ON claim_elements(claim_id);
CREATE INDEX IF NOT EXISTS idx_academic_docs_doi ON academic_documents(doi);
CREATE INDEX IF NOT EXISTS idx_academic_searches_user ON academic_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
