export interface Feature { id: string; text: string }
export interface Project { id: string; owner_id: string; owner_name?: string; assigned_reviewer_id?: string; title: string; revision: number; archived: boolean; canEdit: boolean; status?: string; latestVersionId?: string; updated_at: string }
export interface Version { id: string; project_id: string; number: number; title: string; proposal: string; features: Feature[]; created_at: string }
export interface Passage { text: string; page?: number; section?: string }
export interface Source { id: string; kind: 'PATENT' | 'PAPER'; identifier: string; title: string; url: string; publication_date?: string; passages: Passage[]; provenance: string; retrieved_at?: string }
export interface EvidenceMatch extends Passage { sourceId: string; sourceTitle: string; sourceKind: string; identifier: string; url: string; provenance: string; score: number; matchedTerms: string[] }
export interface Run { id: string; version_id: string; status: string; method: string; results: { feature: Feature; matches: EvidenceMatch[]; status: string }[]; corpus: Source[]; error?: string; created_at: string }
export interface Review { id: string; project_id: string; version_id: string; run_id: string; reviewer_id: string; reviewer_name?: string; status: string; title?: string; number?: number; owner_name?: string; created_at: string }
export interface Comment { id: string; review_id: string; author_name: string; feature_id?: string; body: string; created_at: string }
export interface Decision { id: string; review_id: string; decision: string; reason: string; created_at: string }
export interface DocumentRecord { id: string; version_id: string; name: string; mime: string; byte_size: number; pages: { page: number; text: string }[] }
export interface ProjectDetail { project: Project; versions: Version[]; runs: Run[]; reviews: Review[]; comments: Comment[]; decisions: Decision[]; documents: DocumentRecord[] }
export interface Report { schemaVersion: number; generatedAt: string; title: string; version: Version; analysis: Run | null; reviews: Review[]; comments: Comment[]; decisions: Decision[]; limitations: string[] }
export interface SearchResult { library: Source[]; live: { provider: string; status: string; records: { kind: 'PAPER'; identifier: string; title: string; url: string; passages: Passage[] }[]; message?: string }; patentProvider: { status: string; message: string }; method: string }
