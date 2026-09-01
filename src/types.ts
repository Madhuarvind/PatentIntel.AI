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
  | 'claim-synthesizer';

export interface RealtimeAcademicPaper {
  id: string;
  title: string;
  authors: string[];
  year: number | string;
  venue: string;
  doi?: string;
  citationCount: number;
  abstract: string;
  pdfUrl?: string;
  url?: string;
  bibtex: string;
  source: 'Semantic Scholar' | 'OpenAlex' | 'arXiv' | 'CrossRef';
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
  source: 'USPTO' | 'Google Patents' | 'OpenAlex' | 'EPO';
  sourceUrl: string;
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
  inventors?: string[];
  cpcCodes?: string[];
  filingDate?: string;
  issueDate?: string;
  abstract: string;
  claims?: Claim[];
  rawSourceIdentifier?: string;
  sourceIdentifier?: string;
  displayNumber?: string;
  sourceUrl?: string;
  retrievedAt?: string;
  source?: string;
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
