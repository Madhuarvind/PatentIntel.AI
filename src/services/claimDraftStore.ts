/**
 * claimDraftStore.ts
 *
 * Persistent storage for claim synthesizer drafts and version history.
 * Uses the same localStorage pattern as dbStore.ts and workspaceStore.ts.
 */

import type { ClaimDraft, ClaimVersion, GeneratedClaim, ClaimStrategy } from '../types';

const STORAGE_KEYS = {
  DRAFTS: 'patentintel_claim_drafts',
};

const PROMPT_VERSION = 'claim-synthesizer-v1';

class ClaimDraftStore {
  private listeners: (() => void)[] = [];

  // ---------------------------------------------------------------------------
  // Draft CRUD
  // ---------------------------------------------------------------------------

  public getDrafts(): ClaimDraft[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DRAFTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ClaimDraft[];
    } catch {
      return [];
    }
  }

  public getDraftById(id: string): ClaimDraft | null {
    return this.getDrafts().find(d => d.draftId === id) ?? null;
  }

  public saveDraft(draft: ClaimDraft): ClaimDraft {
    const all = this.getDrafts();
    const idx = all.findIndex(d => d.draftId === draft.draftId);
    const now = new Date().toISOString();
    const updated = { ...draft, updatedAt: now };

    if (idx >= 0) {
      all[idx] = updated;
    } else {
      all.unshift(updated);
    }

    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(all.slice(0, 50)));
    this.notify();
    return updated;
  }

  public deleteDraft(draftId: string): void {
    const all = this.getDrafts().filter(d => d.draftId !== draftId);
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(all));
    this.notify();
  }

  // ---------------------------------------------------------------------------
  // Version Management
  // ---------------------------------------------------------------------------

  /**
   * Snapshot the current active claims as a new version on the given draft.
   */
  public createVersion(
    draftId: string,
    activeClaims: GeneratedClaim[],
    strategy: ClaimStrategy,
    inputSource: string,
    changes?: string
  ): ClaimVersion | null {
    const draft = this.getDraftById(draftId);
    if (!draft) return null;

    const existingVersions = draft.versions || [];
    const versionNumber = existingVersions.length + 1;

    const version: ClaimVersion = {
      versionId: `ver_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      versionNumber,
      label: `Claim Set v${versionNumber}`,
      createdAt: new Date().toISOString(),
      strategy,
      promptVersion: PROMPT_VERSION,
      modelUsed: 'ClaimSynthesizer-Heuristic-v1 (LLM-Ready)',
      inputSource,
      claimsSnapshot: activeClaims,
      changes: changes || `Version ${versionNumber} — ${strategy} strategy`,
    };

    const updatedDraft: ClaimDraft = {
      ...draft,
      versions: [...existingVersions, version],
      updatedAt: new Date().toISOString(),
    };

    this.saveDraft(updatedDraft);
    return version;
  }

  /**
   * Restore a specific version's claims as the active editable claims.
   */
  public restoreVersion(draftId: string, versionId: string): ClaimDraft | null {
    const draft = this.getDraftById(draftId);
    if (!draft) return null;

    const version = draft.versions.find(v => v.versionId === versionId);
    if (!version) return null;

    const restored: ClaimDraft = {
      ...draft,
      activeClaimsEdited: version.claimsSnapshot,
      updatedAt: new Date().toISOString(),
    };

    return this.saveDraft(restored);
  }

  // ---------------------------------------------------------------------------
  // Factory: Create a new blank draft
  // ---------------------------------------------------------------------------

  public createNewDraft(partial: Partial<ClaimDraft>): ClaimDraft {
    const now = new Date().toISOString();
    const draft: ClaimDraft = {
      draftId: `draft_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
      sourceText: '',
      technicalElements: {
        system: '', components: [], modules: [], inputs: [], outputs: [],
        functions: [], processingSteps: [], technicalRelationships: [],
        constraints: [], technicalEffects: [], optionalFeatures: [],
      },
      selectedCandidateId: 'B',
      candidates: [],
      activeClaimsEdited: [],
      quality: {
        technicalCoverage: 0, evidenceSupport: 0, unsupportedElements: 0,
        dependencyErrors: 0, terminologyConflicts: 0,
        missingCoreElements: [], redundantElements: [], warnings: [],
      },
      versions: [],
      createdAt: now,
      updatedAt: now,
      ...partial,
    };
    return this.saveDraft(draft);
  }

  // ---------------------------------------------------------------------------
  // Subscription
  // ---------------------------------------------------------------------------

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }
}

export const claimDraftStore = new ClaimDraftStore();
export { PROMPT_VERSION };
