import type { 
  PatentDocument, 
  ClaimTranslationSession, 
  TerminologyItem,
  InnovationProject,
  InnovationDocument,
  NoveltyBenchmarkReport,
  InnovationVersion,
  PatentReviewSubmission,
  ReviewComment,
  ReviewDecision
} from '../types';
import {
  DEFAULT_PRESET_PROJECTS,
  DEFAULT_PRESET_REPORTS,
  DEFAULT_PRESET_SUBMISSIONS,
  DEFAULT_PRESET_COMMENTS
} from './presetSeedData';

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
  INNOVATION_PROJECTS: 'patentintel_db_innovation_projects',
  INNOVATION_DOCUMENTS: 'patentintel_db_innovation_documents',
  BENCHMARK_REPORTS: 'patentintel_db_benchmark_reports',
  INNOVATION_VERSIONS: 'patentintel_db_innovation_versions',
  REVIEW_SUBMISSIONS: 'patentintel_db_review_submissions',
  REVIEW_COMMENTS: 'patentintel_db_review_comments',
  REVIEW_DECISIONS: 'patentintel_db_review_decisions'
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
    this.seedDefaultInnovationData();
  }

  public seedDefaultInnovationData() {
    try {
      // 1. Projects: ensure all 6 preset projects exist and restore any stuck projects
      const existingProjects = this.getInnovationProjects();
      const updatedProjects = [...existingProjects];
      const deletedIds: string[] = JSON.parse(localStorage.getItem('patentintel_db_deleted_project_ids') || '[]');

      for (const preset of DEFAULT_PRESET_PROJECTS) {
        if (deletedIds.includes(preset.id)) continue;
        const existingIdx = updatedProjects.findIndex(
          p => p.id === preset.id || p.title.toLowerCase().trim() === preset.title.toLowerCase().trim()
        );
        if (existingIdx === -1) {
          updatedProjects.push(preset);
        } else {
          // If existing project was stuck in ANALYZING, recover it to preset's status
          if (updatedProjects[existingIdx].status === 'ANALYZING') {
            updatedProjects[existingIdx] = {
              ...updatedProjects[existingIdx],
              status: preset.status
            };
          }
        }
      }
      localStorage.setItem(DB_KEYS.INNOVATION_PROJECTS, JSON.stringify(updatedProjects));

      // 2. Benchmark Reports: ensure preset reports exist
      const existingReports = this.getBenchmarkReports();
      const updatedReports = [...existingReports];
      for (const presetRep of DEFAULT_PRESET_REPORTS) {
        const exists = updatedReports.some(
          r => r.id === presetRep.id || 
               r.innovationProjectId === presetRep.innovationProjectId || 
               r.ideaTitle.toLowerCase().trim() === presetRep.ideaTitle.toLowerCase().trim()
        );
        if (!exists) {
          updatedReports.push(presetRep);
        }
      }
      localStorage.setItem(DB_KEYS.BENCHMARK_REPORTS, JSON.stringify(updatedReports));

      // 3. Review Submissions: ensure preset review submissions exist
      const existingSubmissions = this.getReviewSubmissions();
      const updatedSubmissions = [...existingSubmissions];
      for (const presetSub of DEFAULT_PRESET_SUBMISSIONS) {
        const exists = updatedSubmissions.some(
          s => s.id === presetSub.id || s.innovationProjectId === presetSub.innovationProjectId
        );
        if (!exists) {
          updatedSubmissions.push(presetSub);
        }
      }
      localStorage.setItem(DB_KEYS.REVIEW_SUBMISSIONS, JSON.stringify(updatedSubmissions));

      // 4. Review Comments: ensure preset comments exist
      const existingComments = JSON.parse(localStorage.getItem(DB_KEYS.REVIEW_COMMENTS) || '[]');
      const updatedComments = [...existingComments];
      for (const presetComm of DEFAULT_PRESET_COMMENTS) {
        const exists = updatedComments.some((c: any) => c.id === presetComm.id);
        if (!exists) {
          updatedComments.push(presetComm);
        }
      }
      localStorage.setItem(DB_KEYS.REVIEW_COMMENTS, JSON.stringify(updatedComments));
    } catch (e) {
      console.warn('[DB STORE] Error initializing preset seed data:', e);
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

  // --- INNOVATION PROJECTS PERSISTENCE ---
  public getInnovationProjects(ownerId?: string): InnovationProject[] {
    const data = localStorage.getItem(DB_KEYS.INNOVATION_PROJECTS);
    if (!data) return [];
    try {
      const all: InnovationProject[] = JSON.parse(data);
      if (!ownerId) return all;
      return all.filter(p => p.ownerId === ownerId || p.ownerId === 'usr_demo_101' || !p.ownerId);
    } catch {
      return [];
    }
  }

  public getInnovationProjectById(id: string): InnovationProject | null {
    const all = this.getInnovationProjects();
    return all.find(p => p.id === id) || null;
  }

  public saveInnovationProject(project: InnovationProject): InnovationProject {
    const all = this.getInnovationProjects();
    const idx = all.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      all[idx] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      all.unshift(project);
    }
    localStorage.setItem(DB_KEYS.INNOVATION_PROJECTS, JSON.stringify(all));
    this.notifyListeners();
    return project;
  }

  public archiveInnovationProject(id: string): InnovationProject | null {
    const all = this.getInnovationProjects();
    const idx = all.findIndex(p => p.id === id);
    if (idx === -1) return null;
    all[idx] = {
      ...all[idx],
      isArchived: true,
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(DB_KEYS.INNOVATION_PROJECTS, JSON.stringify(all));
    this.notifyListeners();
    return all[idx];
  }

  public restoreInnovationProject(id: string): InnovationProject | null {
    const all = this.getInnovationProjects();
    const idx = all.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const restored = { ...all[idx], isArchived: false, updatedAt: new Date().toISOString() };
    delete restored.archivedAt;
    all[idx] = restored;
    localStorage.setItem(DB_KEYS.INNOVATION_PROJECTS, JSON.stringify(all));
    this.notifyListeners();
    return all[idx];
  }

  public renameInnovationProject(id: string, newTitle: string): InnovationProject | null {
    const all = this.getInnovationProjects();
    const idx = all.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const trimmed = newTitle.trim();
    if (!trimmed) return null;
    all[idx] = {
      ...all[idx],
      title: trimmed,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(DB_KEYS.INNOVATION_PROJECTS, JSON.stringify(all));

    // Synchronize linked benchmark report title
    try {
      const reports = this.getBenchmarkReports();
      let repChanged = false;
      reports.forEach(r => {
        if (r.innovationProjectId === id) {
          r.ideaTitle = trimmed;
          repChanged = true;
        }
      });
      if (repChanged) {
        localStorage.setItem(DB_KEYS.BENCHMARK_REPORTS, JSON.stringify(reports));
      }
    } catch {}

    this.notifyListeners();
    return all[idx];
  }

  public duplicateInnovationProject(id: string, user?: UserAccount): InnovationProject | null {
    const source = this.getInnovationProjectById(id);
    if (!source) return null;

    const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const duplicatedProject: InnovationProject = {
      id: newId,
      ownerId: user?.id || source.ownerId || 'usr_demo_101',
      ownerName: user?.name || source.ownerName || 'Dr. Alex Vance',
      workspaceId: source.workspaceId,
      title: `${source.title} (Copy)`,
      description: source.description,
      domain: source.domain,
      technicalProblem: source.technicalProblem,
      proposedSolution: source.proposedSolution,
      expectedTechnicalEffect: source.expectedTechnicalEffect,
      status: 'DRAFT', // Duplicated projects strictly start as fresh DRAFT
      currentVersionNumber: 1,
      createdAt: now,
      updatedAt: now,
      isArchived: false
    };

    // Save duplicated project
    this.saveInnovationProject(duplicatedProject);

    // Copy extracted technical features to new clean v1.0 version trail
    try {
      const sourceVersions = this.getInnovationVersions(id);
      const latestVer = sourceVersions.length > 0 ? sourceVersions[0] : null;
      const latestFeatures = latestVer ? latestVer.features : [];
      this.saveInnovationVersion({
        id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        innovationProjectId: newId,
        versionNumber: 1,
        title: duplicatedProject.title,
        description: duplicatedProject.description || 'Duplicated proposal baseline version',
        features: latestFeatures.map(f => ({ ...f, id: `feat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` })),
        relationships: latestVer?.relationships || [],
        recommendations: [],
        author: user?.name || duplicatedProject.ownerName || 'R&D Engineer',
        createdAt: now
      });
    } catch {}

    this.notifyListeners();
    return duplicatedProject;
  }

  public deleteInnovationProject(id: string) {
    // 1. Remove project from store
    const all = this.getInnovationProjects();
    const filtered = all.filter(p => p.id !== id);
    localStorage.setItem(DB_KEYS.INNOVATION_PROJECTS, JSON.stringify(filtered));

    // Track deleted ID so default preset seeder never resurrects it
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem('patentintel_db_deleted_project_ids') || '[]');
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('patentintel_db_deleted_project_ids', JSON.stringify(deletedIds));
      }
    } catch {}

    // 2. Cascade delete documents
    try {
      const docsRaw = localStorage.getItem(DB_KEYS.INNOVATION_DOCUMENTS);
      if (docsRaw) {
        const docs: InnovationDocument[] = JSON.parse(docsRaw);
        const filteredDocs = docs.filter(d => d.innovationProjectId !== id);
        localStorage.setItem(DB_KEYS.INNOVATION_DOCUMENTS, JSON.stringify(filteredDocs));
      }
    } catch {}

    // 3. Cascade delete benchmark reports
    try {
      const repsRaw = localStorage.getItem(DB_KEYS.BENCHMARK_REPORTS);
      if (repsRaw) {
        const reps: NoveltyBenchmarkReport[] = JSON.parse(repsRaw);
        const filteredReps = reps.filter(r => r.innovationProjectId !== id);
        localStorage.setItem(DB_KEYS.BENCHMARK_REPORTS, JSON.stringify(filteredReps));
      }
    } catch {}

    // 4. Cascade delete versions
    try {
      const versRaw = localStorage.getItem(DB_KEYS.INNOVATION_VERSIONS);
      if (versRaw) {
        const vers: InnovationVersion[] = JSON.parse(versRaw);
        const filteredVers = vers.filter(v => v.innovationProjectId !== id);
        localStorage.setItem(DB_KEYS.INNOVATION_VERSIONS, JSON.stringify(filteredVers));
      }
    } catch {}

    // 5. Cascade delete review submissions, comments, and decisions
    try {
      const subsRaw = localStorage.getItem(DB_KEYS.REVIEW_SUBMISSIONS);
      if (subsRaw) {
        const subs: PatentReviewSubmission[] = JSON.parse(subsRaw);
        const deletedSubIds = subs.filter(s => s.innovationProjectId === id).map(s => s.id);
        const filteredSubs = subs.filter(s => s.innovationProjectId !== id);
        localStorage.setItem(DB_KEYS.REVIEW_SUBMISSIONS, JSON.stringify(filteredSubs));

        const commsRaw = localStorage.getItem(DB_KEYS.REVIEW_COMMENTS);
        if (commsRaw) {
          const comms: ReviewComment[] = JSON.parse(commsRaw);
          const filteredComms = comms.filter(c => !deletedSubIds.includes(c.submissionId));
          localStorage.setItem(DB_KEYS.REVIEW_COMMENTS, JSON.stringify(filteredComms));
        }

        const decsRaw = localStorage.getItem(DB_KEYS.REVIEW_DECISIONS);
        if (decsRaw) {
          const decs: ReviewDecision[] = JSON.parse(decsRaw);
          const filteredDecs = decs.filter(d => !deletedSubIds.includes(d.submissionId));
          localStorage.setItem(DB_KEYS.REVIEW_DECISIONS, JSON.stringify(filteredDecs));
        }
      }
    } catch {}

    this.notifyListeners();
  }

  // --- INNOVATION DOCUMENTS PERSISTENCE ---
  public saveInnovationDocument(doc: InnovationDocument): InnovationDocument {
    const data = localStorage.getItem(DB_KEYS.INNOVATION_DOCUMENTS);
    let all: InnovationDocument[] = [];
    if (data) {
      try { all = JSON.parse(data); } catch {}
    }
    const idx = all.findIndex(d => d.id === doc.id);
    if (idx >= 0) {
      all[idx] = doc;
    } else {
      all.unshift(doc);
    }
    localStorage.setItem(DB_KEYS.INNOVATION_DOCUMENTS, JSON.stringify(all));
    return doc;
  }

  public getInnovationDocumentByProjectId(projectId: string): InnovationDocument | null {
    const data = localStorage.getItem(DB_KEYS.INNOVATION_DOCUMENTS);
    if (!data) return null;
    try {
      const all: InnovationDocument[] = JSON.parse(data);
      return all.find(d => d.innovationProjectId === projectId) || null;
    } catch {
      return null;
    }
  }

  // --- NOVELTY BENCHMARK REPORTS PERSISTENCE ---
  public getBenchmarkReports(projectId?: string): NoveltyBenchmarkReport[] {
    const data = localStorage.getItem(DB_KEYS.BENCHMARK_REPORTS);
    if (!data) return [];
    try {
      const all: NoveltyBenchmarkReport[] = JSON.parse(data);
      if (!projectId) return all;
      return all.filter(r => r.innovationProjectId === projectId);
    } catch {
      return [];
    }
  }

  public getBenchmarkReportById(id: string): NoveltyBenchmarkReport | null {
    const all = this.getBenchmarkReports();
    return all.find(r => r.id === id) || null;
  }

  public getLatestBenchmarkReport(projectId: string): NoveltyBenchmarkReport | null {
    const reports = this.getBenchmarkReports(projectId);
    if (reports.length > 0) {
      return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }
    // Fallback: match by project title or preset title
    const all = this.getBenchmarkReports();
    const proj = this.getInnovationProjectById(projectId);
    if (proj) {
      const match = all.find(r => 
        r.innovationProjectId === proj.id || 
        r.ideaTitle.toLowerCase().trim() === proj.title.toLowerCase().trim()
      );
      if (match) {
        match.innovationProjectId = proj.id;
        this.saveBenchmarkReport(match);
        return match;
      }
    }
    return null;
  }

  public saveBenchmarkReport(report: NoveltyBenchmarkReport): NoveltyBenchmarkReport {
    const all = this.getBenchmarkReports();
    const idx = all.findIndex(r => r.id === report.id);
    if (idx >= 0) {
      all[idx] = report;
    } else {
      all.unshift(report);
    }
    localStorage.setItem(DB_KEYS.BENCHMARK_REPORTS, JSON.stringify(all));
    this.notifyListeners();
    return report;
  }

  // --- INNOVATION VERSIONS PERSISTENCE ---
  public getInnovationVersions(projectId: string): InnovationVersion[] {
    const data = localStorage.getItem(DB_KEYS.INNOVATION_VERSIONS);
    if (!data) return [];
    try {
      const all: InnovationVersion[] = JSON.parse(data);
      return all.filter(v => v.innovationProjectId === projectId).sort((a, b) => b.versionNumber - a.versionNumber);
    } catch {
      return [];
    }
  }

  public saveInnovationVersion(version: InnovationVersion): InnovationVersion {
    const data = localStorage.getItem(DB_KEYS.INNOVATION_VERSIONS);
    let all: InnovationVersion[] = [];
    if (data) {
      try { all = JSON.parse(data); } catch {}
    }
    all.unshift(version);
    localStorage.setItem(DB_KEYS.INNOVATION_VERSIONS, JSON.stringify(all));
    this.notifyListeners();
    return version;
  }

  // --- PATENT REVIEW SUBMISSIONS & DECISIONS PERSISTENCE ---
  public getReviewSubmissions(statusFilter?: string): PatentReviewSubmission[] {
    const data = localStorage.getItem(DB_KEYS.REVIEW_SUBMISSIONS);
    if (!data) return [];
    try {
      const all: PatentReviewSubmission[] = JSON.parse(data);
      if (!statusFilter || statusFilter === 'ALL') return all;
      return all.filter(s => s.status === statusFilter);
    } catch {
      return [];
    }
  }

  public getReviewSubmissionById(id: string): PatentReviewSubmission | null {
    const all = this.getReviewSubmissions();
    return all.find(s => s.id === id) || null;
  }

  public getReviewSubmissionByProjectId(projectId: string): PatentReviewSubmission | null {
    const all = this.getReviewSubmissions();
    const direct = all.find(s => s.innovationProjectId === projectId);
    if (direct) return direct;

    const proj = this.getInnovationProjectById(projectId);
    if (proj) {
      const allProjects = this.getInnovationProjects();
      const match = all.find(s => {
        const subProj = allProjects.find(p => p.id === s.innovationProjectId);
        return subProj && subProj.title.toLowerCase().trim() === proj.title.toLowerCase().trim();
      });
      if (match) {
        match.innovationProjectId = proj.id;
        this.saveReviewSubmission(match);
        return match;
      }
    }
    return null;
  }

  public saveReviewSubmission(sub: PatentReviewSubmission): PatentReviewSubmission {
    const all = this.getReviewSubmissions();
    const idx = all.findIndex(s => s.id === sub.id);
    if (idx >= 0) {
      all[idx] = { ...sub, updatedAt: new Date().toISOString() };
    } else {
      all.unshift(sub);
    }
    localStorage.setItem(DB_KEYS.REVIEW_SUBMISSIONS, JSON.stringify(all));

    // Also sync InnovationProject status
    const project = this.getInnovationProjectById(sub.innovationProjectId);
    if (project) {
      project.status = sub.status;
      this.saveInnovationProject(project);
    }

    this.notifyListeners();
    return sub;
  }

  public saveReviewComment(comment: ReviewComment): ReviewComment {
    const data = localStorage.getItem(DB_KEYS.REVIEW_COMMENTS);
    let all: ReviewComment[] = [];
    if (data) {
      try { all = JSON.parse(data); } catch {}
    }
    all.push(comment);
    localStorage.setItem(DB_KEYS.REVIEW_COMMENTS, JSON.stringify(all));
    this.notifyListeners();
    return comment;
  }

  public getReviewComments(submissionId: string): ReviewComment[] {
    const data = localStorage.getItem(DB_KEYS.REVIEW_COMMENTS);
    if (!data) return [];
    try {
      const all: ReviewComment[] = JSON.parse(data);
      return all.filter(c => c.submissionId === submissionId);
    } catch {
      return [];
    }
  }

  public saveReviewDecision(decision: ReviewDecision): ReviewDecision {
    const data = localStorage.getItem(DB_KEYS.REVIEW_DECISIONS);
    let all: ReviewDecision[] = [];
    if (data) {
      try { all = JSON.parse(data); } catch {}
    }
    all.unshift(decision);
    localStorage.setItem(DB_KEYS.REVIEW_DECISIONS, JSON.stringify(all));

    // Update submission status based on decision
    const sub = this.getReviewSubmissionById(decision.submissionId);
    if (sub) {
      if (decision.decision === 'APPROVED_FOR_DRAFTING') {
        sub.status = 'APPROVED_FOR_DRAFTING';
      } else if (decision.decision === 'NEEDS_REVISION') {
        sub.status = 'NEEDS_REVISION';
      } else if (decision.decision === 'REJECTED') {
        sub.status = 'COMPLETED';
      }
      this.saveReviewSubmission(sub);
    }

    this.notifyListeners();
    return decision;
  }

  public getReviewDecisions(submissionId: string): ReviewDecision[] {
    const data = localStorage.getItem(DB_KEYS.REVIEW_DECISIONS);
    if (!data) return [];
    try {
      const all: ReviewDecision[] = JSON.parse(data);
      return all.filter(d => d.submissionId === submissionId);
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
