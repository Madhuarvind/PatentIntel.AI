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
  | 'settings';

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
