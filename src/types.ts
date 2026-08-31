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

export interface Patent {
  id: string;
  patentNumber: string;
  title: string;
  assignee: string;
  inventors: string[];
  publicationDate: string;
  priorityDate: string;
  cpcClass: string;
  abstract: string;
  claimsCount: number;
  similarityScore?: number;
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
