export type AuthMode = 'login' | 'register' | 'forgot';

export type ModuleView = 
  | 'dashboard'
  | 'workspace'
  | 'search'
  | 'claims'
  | 'mapping'
  | 'timeline'
  | 'ai-evidence'
  | 'analytics'
  | 'settings'
  | 'claim-synthesizer'
  | 'idea-novelty';

export interface PriorArtMatch {
  sourceType: 'PATENT' | 'PAPER';
  id: string;
  title: string;
  publicationNumber?: string;
  similarityScore: number;
  matchingExcerpt: string;
  sectionOrClaim?: string;
  sourceUrl?: string;
  legalStatus?: 'ACTIVE_MONOPOLY' | 'EXPIRED_PUBLIC_DOMAIN' | 'LAPSED_MAINTENANCE' | 'PENDING_APPLICATION';
  ftoRisk?: 'HIGH_COLLISION' | 'SAFE_PUBLIC_DOMAIN' | 'UNCERTAIN';
  figNumber?: string;
  diagramSnippet?: string;
}

export interface EvidenceReference {
  id: string;
  sourceDocumentId: string;
  sourceType: 'PATENT' | 'PAPER' | 'MANUSCRIPT';
  sourceIdentifier: string;
  title: string;
  pageNumber?: number;
  section?: string;
  passage: string;
  similarityScore: number;
  retrievalMethod?: string;
  createdAt: string;
}

export interface ExtractedIdeaComponent {
  id: string;
  innovationProjectId: string;
  featureCode: string;
  name: string;
  term: string;
  category: 
    | 'COMPONENT' 
    | 'FUNCTION' 
    | 'DATA' 
    | 'PROCESS' 
    | 'RELATIONSHIP' 
    | 'CONSTRAINT' 
    | 'INPUT' 
    | 'OUTPUT' 
    | 'TECHNICAL_EFFECT' 
    | 'OBJECTIVE' 
    | 'OTHER';
  description: string;
  importance: 'CORE' | 'SUPPORTING' | 'OPTIONAL';
  overlapStatus: 'KNOWN_PRIOR_ART' | 'PARTIAL_OVERLAP' | 'POTENTIALLY_DISTINCTIVE' | 'INSUFFICIENT_EVIDENCE';
  overlapConfidence: number;
  matchedPriorArt: PriorArtMatch[];
  supportingEvidence: EvidenceReference[];
  createdAt: string;
  updatedAt: string;
}

export interface ComponentRelationship {
  id: string;
  fromComponentId: string;
  toComponentId: string;
  fromTerm: string;
  toTerm: string;
  relationshipType: string;
  description: string;
  overlapStatus: 'KNOWN_PRIOR_ART' | 'PARTIAL_OVERLAP' | 'POTENTIALLY_DISTINCTIVE' | 'INSUFFICIENT_EVIDENCE';
}

export interface InnovationProject {
  id: string;
  ownerId: string;
  ownerName: string;
  workspaceId?: string;
  title: string;
  description: string;
  domain?: string;
  technicalProblem?: string;
  proposedSolution?: string;
  expectedTechnicalEffect?: string;
  status: 
    | 'DRAFT' 
    | 'ANALYZING' 
    | 'READY_FOR_REVIEW' 
    | 'SUBMITTED' 
    | 'UNDER_REVIEW' 
    | 'NEEDS_REVISION' 
    | 'APPROVED_FOR_DRAFTING' 
    | 'COMPLETED';
  currentVersionNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface InnovationDocument {
  id: string;
  innovationProjectId: string;
  fileName?: string;
  fileHash?: string;
  mimeType?: string;
  textContent?: string;
  storageReference?: string;
  pageCount?: number;
  extractedTextStatus: 'NOT_STARTED' | 'SUCCESS' | 'PARTIAL' | 'FAILED';
  createdAt: string;
}

export interface DifferentiatorRecommendation {
  id: string;
  innovationProjectId: string;
  title: string;
  description: string;
  relatedComponents: string[];
  priorArtGap: string;
  supportingEvidence: EvidenceReference[];
  confidence: number;
  status: 'SUGGESTED' | 'ACCEPTED' | 'REJECTED' | 'CUSTOMIZED';
  createdAt: string;
}

export type FeatureMatchRelationshipType = 
  | 'DIRECT_FUNCTIONAL_OVERLAP'
  | 'STRUCTURAL_OVERLAP'
  | 'CLAIM_ELEMENT_OVERLAP'
  | 'SEMANTIC_OVERLAP'
  | 'PARTIAL_OVERLAP'
  | 'COMBINATION_OVERLAP'
  | 'SAME_TECHNICAL_EFFECT'
  | 'SAME_PROBLEM_DIFFERENT_IMPLEMENTATION'
  | 'DIFFERENT_IMPLEMENTATION'
  | 'INSUFFICIENT_EVIDENCE';

export interface NoveltyEvidence {
  id: string;
  featureMatchId: string;
  sourceType: 'PATENT' | 'IEEE_JOURNAL' | 'IEEE_CONFERENCE' | 'RESEARCH_PAPER';
  sourceId: string; // e.g. "US1234567B2" or DOI/Paper ID
  canonicalId: string;
  evidenceType: 'CLAIM' | 'ABSTRACT' | 'DESCRIPTION' | 'ACADEMIC_PASSAGE';
  evidenceLocation: string; // e.g. "Claim 3", "Description para 0042"
  evidenceText: string;
  sourceUrl?: string;
  sourceTitle?: string;
  assigneeOrAuthors?: string;
  publicationDateOrYear?: string;
  retrievedAt: string;
}

export interface NoveltyComparison {
  id: string;
  featureMatchId: string;
  proposalFeature: string;
  priorArtFeature: string;
  matchedConcepts: string[];
  unmatchedConcepts: string[];
  overlapSummary: string;
  relationshipType: FeatureMatchRelationshipType;
}

export interface NoveltyFeatureMatch {
  id: string;
  runId: string;
  featureId: string;
  featureNumber: number;
  featureText: string;
  category: ExtractedIdeaComponent['category'];
  status: 'KNOWN_PRIOR_ART' | 'PARTIAL_OVERLAP' | 'POTENTIALLY_DISTINCTIVE' | 'INSUFFICIENT_EVIDENCE';
  matchedDocCount: number;
  strongestMatchingDocId: string;
  strongestMatchingDocTitle: string;
  strongestSourceType: 'PATENT' | 'IEEE_JOURNAL' | 'IEEE_CONFERENCE' | 'RESEARCH_PAPER';
  retrievalSimilarity: number; // 0 - 100%
  featureCoverage: string; // e.g. "4 / 5"
  claimOverlap: 'High' | 'Moderate' | 'Low' | 'None';
  evidenceStrength: 'Strong' | 'Moderate' | 'Weak' | 'Insufficient';
  relationshipType: FeatureMatchRelationshipType;
  whyClassifiedExplanation: string;
  proposalFeatureSnippet: string;
  priorArtDisclosureSnippet: string;
  matchedConcepts: string[];
  unmatchedConcepts: string[];
  evidences: NoveltyEvidence[];
  comparisons: NoveltyComparison[];
  matchedDocuments: {
    id: string;
    canonicalId: string;
    title: string;
    sourceType: 'PATENT' | 'IEEE_JOURNAL' | 'IEEE_CONFERENCE' | 'RESEARCH_PAPER';
    publicationNumberOrDoi?: string;
    assigneeOrAuthors?: string;
    publicationDateOrYear?: string;
    sourceUrl?: string;
    similarityScore: number;
    featureCoverageScore?: string;
    evidenceStrength: 'Strong' | 'Moderate' | 'Weak' | 'Insufficient';
    matchingExcerpt?: string;
    claimsText?: string;
  }[];
  // Feature Provenance Details
  sourceDocumentName?: string;
  proposalPageNumber?: number;
  proposalSection?: string;
  extractionRunId?: string;
  extractionConfidence?: number | 'High' | 'Medium' | 'Low';
  originalTextExcerpt?: string;
  lexicalOverlap?: number;
  semanticOverlap?: number;
  lexicalSimilarityScore?: number;
  semanticSimilarityScore?: number;
  combinationOverlap?: string;
  createdAt?: string;
}

export interface CombinationAnalysisResult {
  sharedWorkflowChain: string[];
  proposalSpecificElements: string[];
  potentialDifferentiator: string;
  evidenceGrounded: boolean;
}

export interface StatutoryEligibilityAnalysis {
  status: 'LIKELY_ELIGIBLE' | 'REVIEW_REQUIRED' | 'POTENTIAL_EXCLUSION';
  overallSummary: string;
  indiaSection3k: {
    screeningResult: 'LIKELY_ELIGIBLE' | 'REVIEW_REQUIRED' | 'POTENTIAL_EXCLUSION';
    plainEnglishExplanation: string;
    claimElementBreakdown: {
      elementName: string;
      elementType: 'PHYSICAL_HARDWARE' | 'COMPUTING_HARDWARE' | 'SOFTWARE_ALGORITHM' | 'SECURITY_MECHANISM' | 'DATA_STRUCTURE';
      statutoryRole: string;
    }[];
    whyThisResult: string;
    relevantStatutoryFactors: string[];
    evidencePassages: { claimOrSection: string; text: string }[];
  };
  usSection101: {
    screeningResult: 'LIKELY_ELIGIBLE' | 'REVIEW_REQUIRED' | 'POTENTIAL_EXCLUSION';
    statutoryCategory: 'APPARATUS' | 'SYSTEM' | 'PROCESS' | 'MANUFACTURE';
    step2aJudicialException: 'NO_EXCEPTION' | 'ABSTRACT_IDEA' | 'NATURAL_PHENOMENON' | 'LAW_OF_NATURE';
    step2bPracticalApplication: string;
    technicalImplementationIndicators: string[];
    plainEnglishExplanation: string;
    whyThisResult: string;
    reviewFlags: string[];
  };
  claimHighlighting?: {
    claimText: string;
    tokens: {
      text: string;
      category: 'PHYSICAL' | 'COMPUTING' | 'ALGORITHM' | 'TECHNICAL_EFFECT' | 'DATA_INPUT' | 'OUTPUT';
      explanation: string;
    }[];
  };
  humanReviewRecommendation: 'HIGH_CONFIDENCE' | 'MEDIUM_CONFIDENCE' | 'LOW_CONFIDENCE_HUMAN_REVIEW_REQUIRED';
  humanReviewNote: string;
  nonLegalDisclaimer: string;
}

export interface NoveltyBenchmarkReport {
  id: string;
  innovationProjectId: string;
  noveltyRunId: string;
  ideaTitle: string;
  priorArtConcern: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_EVIDENCE';
  overallNoveltyScore?: number; // legacy back-compat
  priorArtOverlapRisk?: 'HIGH' | 'MODERATE' | 'LOW'; // legacy back-compat
  reviewReadinessScore: number; // 0 - 100%
  directOverlapCount: number;
  partialOverlapCount: number;
  potentiallyDistinctiveCount: number;
  insufficientEvidenceCount: number;
  patentCandidatesReviewed: number;
  academicCandidatesReviewed: number;
  extractedComponents: ExtractedIdeaComponent[];
  componentRelationships: ComponentRelationship[];
  featureMatches?: NoveltyFeatureMatch[];
  combinationAnalysis?: CombinationAnalysisResult;
  topMatchedPatents: PatentDocument[];
  topMatchedPapers: RealtimeAcademicPaper[];
  recommendations: DifferentiatorRecommendation[];
  proposedSystemRecommendations?: string[]; // legacy back-compat
  statutoryEligibility?: {
    status: 'PASS' | 'WARNING' | 'NON_STATUTORY_RISK';
    sectionRef: string;
    reason: string;
    recommendations: string[];
  };
  statutoryEligibilityDetails?: StatutoryEligibilityAnalysis;
  multimodalSchematics?: {
    diagramCount: number;
    schematicMatches: {
      figureId: string;
      priorArtId: string;
      priorArtTitle: string;
      visualSimilarity: number;
      matchingBlocks: string[];
      diagramSnippet?: string;
    }[];
  };
  tsmObviousnessRisk?: {
    score: number; // 0-100%
    level: 'HIGH' | 'MODERATE' | 'LOW';
    combinedReferences: {
      ref1: string;
      ref2: string;
      motivationReason: string;
    }[];
  };
  searchScopeHealth: {
    patentSources: string[];
    academicSources: string[];
    patentStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED';
    academicStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED';
    queriesUsed: string[];
  };
  createdAt: string;
}

export interface NoveltyRun {
  id: string;
  innovationProjectId: string;
  startedBy: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  model: string;
  modelVersion: string;
  promptVersion: string;
  patentSearchQuery: string;
  academicSearchQuery: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface NoveltyCandidate {
  id: string;
  noveltyRunId: string;
  documentType: 'PATENT' | 'IEEE_JOURNAL' | 'IEEE_CONFERENCE' | 'RESEARCH_PAPER' | 'CONFERENCE_PAPER' | 'PREPRINT' | 'OTHER';
  documentId: string;
  rank: number;
  retrievalScore: number;
  source: string;
  createdAt: string;
}

export interface PatentReviewSubmission {
  id: string;
  innovationProjectId: string;
  submittedBy: string;
  submittedByName: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'NEEDS_REVISION' | 'APPROVED_FOR_DRAFTING' | 'COMPLETED';
  priorArtConcern: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_EVIDENCE';
  versionNumber: number;
  submittedAt: string;
  updatedAt: string;
}

export interface ReviewComment {
  id: string;
  submissionId: string;
  authorId: string;
  authorName: string;
  comment: string;
  componentId?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ReviewDecision {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewerName: string;
  decision: 'APPROVED_FOR_DRAFTING' | 'NEEDS_REVISION' | 'REJECTED' | 'MORE_INFORMATION_REQUIRED';
  reason: string;
  createdAt: string;
}

export interface InnovationVersion {
  id: string;
  innovationProjectId: string;
  versionNumber: number;
  title: string;
  description: string;
  features: ExtractedIdeaComponent[];
  relationships: ComponentRelationship[];
  recommendations: DifferentiatorRecommendation[];
  author: string;
  createdAt: string;
}

export interface AuthorProfile {
  id: string;
  displayName: string;
  worksCount: number;
  citationCount: number;
  hIndex?: number;
  institution?: string;
  orcid?: string;
  source: 'OpenAlex' | 'Semantic Scholar' | 'Crossref';
  profileUrl?: string;
}

export type AcademicDocType = 
  | 'RESEARCH_PAPER'
  | 'IEEE_JOURNAL'
  | 'IEEE_CONFERENCE'
  | 'CONFERENCE_PAPER'
  | 'REVIEW'
  | 'PREPRINT'
  | 'BOOK_CHAPTER'
  | 'DATASET'
  | 'OTHER';

export interface RealtimeAcademicPaper {
  id: string;
  title: string;
  authors: string[];
  authorObjects?: AuthorProfile[];
  year: number | string;
  venue: string;
  journal?: string;
  doi?: string;
  citationCount: number;
  abstract: string;
  pdfUrl?: string;
  url?: string;
  bibtex: string;
  source: 'Semantic Scholar' | 'OpenAlex' | 'arXiv' | 'CrossRef' | string;
  sources?: string[];
  documentType?: AcademicDocType;
  publicationDate?: string;
  publisher?: string;
  isOpenAccess?: boolean;
}

export type AcademicSearchMode = 'TOPIC' | 'AUTHOR' | 'TITLE' | 'DOI';

export interface AcademicSearchFilters {
  mode: AcademicSearchMode;
  query: string;
  selectedAuthor: AuthorProfile | null;
  yearFrom: number | null;
  yearTo: number | null;
  venue: string;
  pubType: string;
  minCitations: number;
  sortBy: 'relevance' | 'date_desc' | 'date_asc' | 'citations_desc';
  sourceFilter: 'ALL' | 'OpenAlex' | 'Semantic Scholar' | 'Crossref';
  page: number;
  pageSize: number;
}

export interface PatentClaim {
  claimNumber: number;
  text: string;
  type: 'independent' | 'dependent';
  dependsOn: number[];
  elements?: ClaimElement[];
}

export interface NormalizedPatent {
  id: string;
  patentNumber: string;
  publicationNumber: string;
  applicationNumber?: string;
  country: string;
  documentNumber?: string;
  kindCode?: string;
  displayNumber?: string;
  rawSourceIdentifier?: string;
  sourceIdentifier?: string;
  documentType?: string;
  title: string;
  abstract: string;
  description?: string;
  claims: PatentClaim[];
  claimsCount: number;
  inventors: string[];
  applicants?: string[];
  assignees: string[];
  assignee?: string;
  priorityDate?: string;
  filingDate?: string;
  publicationDate?: string;
  grantDate?: string;
  cpc: string[];
  ipc: string[];
  uspc?: string[];
  patentFamily?: string[];
  citations?: string[];
  source: 'USPTO' | 'Google Patents' | 'OpenAlex' | 'EPO' | 'Uploaded PDF Specification';
  sourceUrl: string;
  fileHash?: string;
  retrievedAt: string;
  importQuality: 'COMPLETE' | 'PARTIAL' | 'FAILED';
}

export interface Patent {
  id: string;
  patentNumber: string;
  publicationNumber?: string;
  applicationNumber?: string;
  country?: string;
  kindCode?: string;
  displayNumber?: string;
  documentType?: string;
  title: string;
  assignee: string;
  assignees?: string[];
  inventors: string[];
  publicationDate: string;
  filingDate?: string;
  grantDate?: string;
  priorityDate: string;
  cpcClass: string;
  cpc?: string[];
  ipc?: string[];
  abstract: string;
  description?: string;
  claimsCount: number;
  parsedClaims?: PatentClaim[];
  similarityScore?: number;
  source?: string;
  sourceUrl?: string;
  fileHash?: string;
  retrievedAt?: string;
  importQuality?: 'COMPLETE' | 'PARTIAL' | 'FAILED';
}

export interface ClaimElement {
  id: string;
  type?: 'component' | 'function' | 'process' | 'constraint';
  term?: string;
  description?: string;
  text?: string;
  cpcCategory?: string;
}

export interface Claim {
  claimNumber?: number;
  number?: number;
  isIndependent?: boolean;
  type?: 'independent' | 'dependent';
  text: string;
  elements: ClaimElement[];
}

export interface PatentDocument {
  id: string;
  title: string;
  assignee?: string;
  assignees?: string[];
  inventors?: string[];
  cpcCodes?: string[];
  cpc?: string[];
  ipc?: string[];
  filingDate?: string;
  issueDate?: string;
  publicationDate?: string;
  grantDate?: string;
  priorityDate?: string;
  publicationNumber?: string;
  patentNumber?: string;
  country?: string;
  kindCode?: string;
  documentType?: 'PATENT' | string;
  abstract: string;
  claims?: Claim[];
  claimsCount?: number;
  rawSourceIdentifier?: string;
  sourceIdentifier?: string;
  displayNumber?: string;
  sourceUrl?: string;
  retrievedAt?: string;
  source?: string;
  fileHash?: string;
  importQuality?: 'COMPLETE' | 'PARTIAL' | 'FAILED';
}

export interface ResearchDocument {
  documentType: 'RESEARCH_PAPER';
  id: string;
  title: string;
  authors: string[];
  doi?: string;
  journal?: string;
  publicationYear?: number | string;
  abstract: string;
  source: 'OpenAlex' | 'CrossRef' | 'IEEE' | string;
  sourceUrl: string;
}

export interface MappingPair {
  elementTarget: string;
  elementRetrieved: string;
  similarityScore: number;
  status: 'exact' | 'semantic' | 'partial' | 'difference';
  explanation: string;
  targetPassage: string;
  retrievedPassage: string;
}

// ==========================================
// CLAIM SYNTHESIZER TYPES
// ==========================================

export type SupportStatus = 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED';
export type ClaimStrategy = 'broad' | 'balanced' | 'narrow';
export type ClaimCategory = 'apparatus' | 'method' | 'computer-method' | 'crm' | 'device';

export interface TechnicalElementsModel {
  system: string;
  components: string[];
  modules: string[];
  inputs: string[];
  outputs: string[];
  functions: string[];
  processingSteps: string[];
  technicalRelationships: string[];
  constraints: string[];
  technicalEffects: string[];
  optionalFeatures: string[];
}

export interface ClaimEvidenceRef {
  elementText: string;
  sourceSection: string;
  paragraphRef: string;
  quote: string;
  supportScore: number;
  supportStatus: SupportStatus;
}

export interface GeneratedClaimElement {
  id: string;
  label: string;
  text: string;
  evidence: ClaimEvidenceRef;
  relationships: { targetId: string; relationLabel: string }[];
}

export interface GeneratedClaim {
  claimNumber: number;
  category: ClaimCategory;
  isIndependent: boolean;
  dependsOn: number[];
  text: string;
  elements: GeneratedClaimElement[];
  whySelected?: string;
  addedLimitations?: string[];
}

export interface ClaimQuality {
  technicalCoverage: number;   // 0-100
  evidenceSupport: number;     // 0-100
  unsupportedElements: number;
  dependencyErrors: number;
  terminologyConflicts: number;
  missingCoreElements: string[];
  redundantElements: string[];
  warnings: string[];
}

export interface ClaimCandidate {
  id: 'A' | 'B' | 'C';
  strategy: ClaimStrategy;
  label: string;
  coverage: number;
  independentClaims: GeneratedClaim[];
  dependentClaims: GeneratedClaim[];
  quality: ClaimQuality;
  technicalElements: TechnicalElementsModel;
}

export interface ClaimVersion {
  versionId: string;
  versionNumber: number;
  label: string;
  createdAt: string;
  strategy: ClaimStrategy;
  promptVersion: string;
  modelUsed: string;
  inputSource: string;
  claimsSnapshot: GeneratedClaim[];
  changes?: string;
}

export interface ClaimDraft {
  draftId: string;
  sourceText: string;
  sourcePatentId?: string;
  technicalElements: TechnicalElementsModel;
  selectedCandidateId: 'A' | 'B' | 'C';
  candidates: ClaimCandidate[];
  activeClaimsEdited: GeneratedClaim[];
  quality: ClaimQuality;
  versions: ClaimVersion[];
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface ClaimSynthesisRequest {
  sourceText: string;
  strategy: ClaimStrategy;
  claimCategories: ClaimCategory[];
  dependentClaimCount: number;
  sourcePatentId?: string;
  technologyDomain?: string;
  targetJurisdiction?: string;
}

// ==========================================
// WIPO CLAIM TRANSLATOR TYPES
// ==========================================

export type SourceLanguage = 'auto' | 'zh' | 'ja' | 'de' | 'fr' | 'en';
export type TargetLanguage = 'en' | 'zh' | 'ja' | 'de' | 'fr';
export type ClaimLanguageCode = 'zh' | 'ja' | 'de' | 'fr' | 'en' | 'unknown';

export interface LanguageDetectionResult {
  language: ClaimLanguageCode;
  label: string;
  confidence: number;
  isLowConfidence: boolean;
  warning?: string;
}

export type TerminologyCategory = 'Technical' | 'Patent Term' | 'Engineering' | 'Standardized' | 'Component';

export interface TerminologyItem {
  id: string;
  original: string;
  english: string;
  category: TerminologyCategory;
  confidence: number;
  isLocked?: boolean;
  status: 'accepted' | 'edited' | 'ambiguous';
  alternatives?: string[];
  sourceElement?: string;
}

export interface ClassificationCandidate {
  code: string;
  title: string;
  type: 'IPC' | 'CPC';
  reason: string;
  confidence: number;
  source: 'Verified (WIPO/EPO)' | 'AI-suggested classification candidates';
  verifiedDefinition?: string;
}

export interface QualityMetrics {
  languageDetectionConfidence: number;
  terminologyConsistency: number;
  numericPreservation: number;
  claimStructurePreservation: number;
  semanticConsistency: number;
  overallQuality: number;
  warnings: string[];
  potentialMeaningDrift?: string;
  driftSectionCount?: number;
}

export interface ClaimElementAlignment {
  elementNumber: number;
  label: string;
  originalText: string;
  translatedText: string;
  isAmbiguous?: boolean;
  alternatives?: string[];
}

export interface AmbiguityItem {
  id: string;
  originalTerm: string;
  recommendedTranslation: string;
  alternatives: string[];
  confidence: number;
  userChoice?: string;
  isResolved?: boolean;
}

export interface ClaimTranslationSession {
  id: string;
  patent_id?: string;
  claim_id?: string;
  claim_number?: number;
  source_language: string;
  target_language: string;
  original_text: string;
  translated_text: string;
  terminology_map: TerminologyItem[];
  classifications: ClassificationCandidate[];
  quality_metrics: QualityMetrics;
  alignments: ClaimElementAlignment[];
  ambiguities: AmbiguityItem[];
  model: string;
  prompt_version: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  dependsOn?: number[];
  claimType?: 'independent' | 'dependent';
}

export interface BatchTranslationItem {
  id: string;
  claimNumber: number;
  originalText: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: ClaimTranslationSession;
  errorMsg?: string;
}


export interface ConsistencyMatrixItem {
  sourceTerm: string;
  claimTranslations: Record<number, string>;
  isConsistent: boolean;
}

// ==========================================
// REAL-TIME PATENT IMPORT STATE MACHINE TYPES
// ==========================================

export type ImportStatus =
  | 'idle'
  | 'validating'
  | 'connecting'
  | 'fetching_metadata'
  | 'fetching_claims'
  | 'normalizing'
  | 'saving'
  | 'completed'
  | 'failed'
  | 'timeout'
  | 'cancelled';

export type ImportErrorCode =
  | 'INVALID_PATENT_ID'
  | 'PATENT_NOT_FOUND'
  | 'SOURCE_TIMEOUT'
  | 'SOURCE_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'PARSER_ERROR'
  | 'DATABASE_ERROR'
  | 'IDENTITY_MISMATCH'
  | 'CANCELLED';

export interface ImportTimings {
  validationMs: number;
  sourceMs: number;
  metadataMs: number;
  claimsMs: number;
  normalizationMs: number;
  databaseMs: number;
  totalMs: number;
}

export interface ImportProgressState {
  requestId: string;
  status: ImportStatus;
  progress: number;
  stepNumber: number;
  message: string;
  detail?: string;
  elapsedSeconds: number;
  timings?: ImportTimings;
  error?: {
    code: ImportErrorCode;
    message: string;
    suggestedAction?: string;
  };
}

export interface PatentImportResult {
  success: boolean;
  requestId: string;
  status: ImportStatus;
  patent?: NormalizedPatent;
  timings?: ImportTimings;
  error?: {
    code: ImportErrorCode;
    message: string;
  };
}


