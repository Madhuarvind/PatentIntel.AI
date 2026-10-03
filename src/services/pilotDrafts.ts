// Only in-memory, scoped by authenticated account. Never put private drafts in shared browser storage.
export interface ProposalDraft { title: string; proposal: string; features: string }
const drafts = new Map<string, ProposalDraft>();
export const draftKey = (userId: string, versionId: string) => `${userId}:${versionId}`;
export const readDraft = (key: string) => drafts.get(key);
export const saveDraft = (key: string, draft: ProposalDraft) => drafts.set(key, draft);
export const removeDraft = (key: string) => drafts.delete(key);
export const clearDrafts = () => drafts.clear();
