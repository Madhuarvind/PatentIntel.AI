import type { PatentDocument, ClaimTranslationSession, TerminologyItem } from '../types';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  organization?: string;
  createdAt: string;
  lastLogin: string;
}

export interface StoredEvaluation {
  id: string;
  targetPatentId: string;
  candidatePatentId: string;
  section102Risk: number;
  section103Risk: number;
  totalRisk: number;
  timestamp: string;
}

const DB_KEYS = {
  USERS: 'patentintel_db_users',
  CURRENT_USER: 'patentintel_db_current_user',
  PATENTS: 'patentintel_db_patents',
  EVALUATIONS: 'patentintel_db_evaluations',
  SEARCH_HISTORY: 'patentintel_db_search_history',
  TRANSLATIONS: 'patentintel_db_claim_translations',
  TERMINOLOGY_MEMORY: 'patentintel_db_terminology_memory',
};

class CloudDatabaseService {
  private listeners: (() => void)[] = [];

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    // Ensure default initial structures exist
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      const defaultUser: UserAccount = {
        id: 'usr_demo_101',
        name: 'Dr. Alex Vance',
        email: 'alex.vance@uspto-research.gov',
        role: 'Lead Patent Examiner',
        organization: 'USPTO R&D Division',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify([defaultUser]));
    }
  }

  // --- USER ACCOUNT MANAGEMENT ---
  public registerUser(name: string, email: string, role: string, organization?: string): UserAccount {
    const users = this.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existing) {
      existing.lastLogin = new Date().toISOString();
      this.saveUsers(users);
      this.setCurrentUser(existing);
      return existing;
    }

    const newUser: UserAccount = {
      id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name,
      email,
      role,
      organization: organization || 'Patent Research Institute',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser);
    return newUser;
  }

  public authenticateUser(email: string): UserAccount | null {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      user.lastLogin = new Date().toISOString();
      this.saveUsers(users);
      this.setCurrentUser(user);
      return user;
    }
    return null;
  }

  public getCurrentUser(): UserAccount | null {
    const data = localStorage.getItem(DB_KEYS.CURRENT_USER);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  public setCurrentUser(user: UserAccount | null) {
    if (user) {
      localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(DB_KEYS.CURRENT_USER);
    }
    this.notifyListeners();
  }

  public logoutUser() {
    this.setCurrentUser(null);
  }

  public getUsers(): UserAccount[] {
    const data = localStorage.getItem(DB_KEYS.USERS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private saveUsers(users: UserAccount[]) {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    this.notifyListeners();
  }

  // --- PATENT WORKSPACE PERSISTENCE ---
  public getStoredPatents(): PatentDocument[] {
    const data = localStorage.getItem(DB_KEYS.PATENTS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public saveStoredPatents(patents: PatentDocument[]) {
    localStorage.setItem(DB_KEYS.PATENTS, JSON.stringify(patents));
    this.notifyListeners();
  }

  // --- EVALUATION RECORDS PERSISTENCE ---
  public saveEvaluationRecord(rec: Omit<StoredEvaluation, 'id' | 'timestamp'>): StoredEvaluation {
    const records = this.getEvaluationRecords();
    const newRecord: StoredEvaluation = {
      ...rec,
      id: `eval_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    records.push(newRecord);
    localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify(records));
    this.notifyListeners();
    return newRecord;
  }

  public getEvaluationRecords(): StoredEvaluation[] {
    const data = localStorage.getItem(DB_KEYS.EVALUATIONS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  // --- CLAIM TRANSLATIONS PERSISTENCE ---
  public saveClaimTranslation(session: ClaimTranslationSession): ClaimTranslationSession {
    const translations = this.getClaimTranslations();
    const existingIdx = translations.findIndex(t => t.id === session.id);
    if (existingIdx >= 0) {
      translations[existingIdx] = session;
    } else {
      translations.unshift(session);
    }
    localStorage.setItem(DB_KEYS.TRANSLATIONS, JSON.stringify(translations));
    this.notifyListeners();
    return session;
  }

  public getClaimTranslations(): ClaimTranslationSession[] {
    const data = localStorage.getItem(DB_KEYS.TRANSLATIONS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public getTranslationHistory(patentId?: string): ClaimTranslationSession[] {
    const all = this.getClaimTranslations();
    if (!patentId) return all;
    return all.filter(t => t.patent_id === patentId);
  }

  public restoreTranslationSession(id: string): ClaimTranslationSession | null {
    const all = this.getClaimTranslations();
    return all.find(t => t.id === id) || null;
  }

  public saveTerminologyMemory(familyId: string, terms: TerminologyItem[]) {
    const memData = localStorage.getItem(DB_KEYS.TERMINOLOGY_MEMORY);
    let memStore: Record<string, TerminologyItem[]> = {};
    if (memData) {
      try { memStore = JSON.parse(memData); } catch {}
    }
    memStore[familyId] = terms;
    localStorage.setItem(DB_KEYS.TERMINOLOGY_MEMORY, JSON.stringify(memStore));
  }

  public getTerminologyMemory(familyId: string): TerminologyItem[] {
    const memData = localStorage.getItem(DB_KEYS.TERMINOLOGY_MEMORY);
    if (!memData) return [];
    try {
      const memStore = JSON.parse(memData);
      return memStore[familyId] || [];
    } catch {
      return [];
    }
  }

  // --- SUBSCRIPTION LISTENERS ---
  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l());
  }
}

export const dbStore = new CloudDatabaseService();
