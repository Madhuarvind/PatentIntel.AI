import { useEffect, useState } from 'react';
import type { ProjectDetail, Version, Source, SearchResult, Report } from '../pilotTypes';
import type { SessionUser } from '../services/authClient';
import { pilotApi, downloadJson } from '../services/pilotClient';
import { PilotEvidence, readable } from './PilotEvidence';
import { draftKey, readDraft, saveDraft, removeDraft } from '../services/pilotDrafts';
import { PilotReport } from './PilotReport';

export type Act = (operation: () => Promise<void>, message?: string) => Promise<void>;
interface Props { detail: ProjectDetail; version: Version; user: SessionUser; users: SessionUser[]; sources: Source[]; act: Act; busy: boolean; updated: (newVersionId?: string) => Promise<void> }

export function ProposalEditor({ detail, version, user, users, act, busy, updated }: Props) {
  const key = draftKey(user.id, version.id);
  const restored = readDraft(key);
  const [title, setTitle] = useState(restored?.title ?? version.title), [proposal, setProposal] = useState(restored?.proposal ?? version.proposal);
  const [features, setFeatures] = useState(restored?.features ?? version.features.map(f => f.text).join('\n'));
  useEffect(() => { saveDraft(key, { title, proposal, features }); }, [key, title, proposal, features]);
  const [reviewer, setReviewer] = useState(detail.project.assigned_reviewer_id || '');
  const [compare, setCompare] = useState('');
  const dirty = title !== version.title || proposal !== version.proposal || features !== version.features.map(f => f.text).join('\n');
  useEffect(() => { const guard = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard); }, [dirty]);
  useEffect(() => { document.documentElement.dataset.pilotDirty = String(dirty); document.documentElement.dataset.pilotDraftKey = key; return () => { delete document.documentElement.dataset.pilotDirty; delete document.documentElement.dataset.pilotDraftKey; }; }, [dirty, key]);
  const current = version.number === detail.project.revision;
  const editable = detail.project.canEdit && current && !detail.project.archived;
  const frozen = detail.reviews.some(r => r.version_id === version.id);
  const previous = detail.versions.find(v => v.id === compare);
  async function upload(file?: File) {
    if (!file) return;
    await act(async () => {
      if (file.size > 20 * 1024 * 1024) throw Error('Choose a document smaller than 20 MB.');
      const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(Error('Could not read this file.')); reader.readAsDataURL(file); });
      await pilotApi('/documents', { versionId: version.id, name: file.name, base64 }); await updated();
    }, 'Document attached. Inspect the extracted text below before using it.');
  }
  return <><div className="panel"><div className="section-heading"><div><h2>Proposal workspace</h2><p className="muted">Every save creates a version. Review decisions stay with the version reviewed.</p></div><span className="badge">Version {version.number}</span></div>
    {frozen && <p className="notice">This submitted version is frozen. Saving creates a new draft that needs a fresh comparison.</p>}
    <form onSubmit={e => { e.preventDefault(); void act(async () => { const saved = await pilotApi<{ versionId: string }>(`/projects/${detail.project.id}/versions`, { revision: detail.project.revision, title, proposal, features: features.split('\n').map(t => t.trim()).filter(Boolean).map(text => ({ text })) }); removeDraft(key); document.documentElement.dataset.pilotDirty = 'false'; await updated(saved.versionId); }, 'New version saved. Run a new evidence comparison.'); }}>
      <label>Proposal title<input required maxLength={200} value={title} disabled={!editable} onChange={e => setTitle(e.target.value)} /></label>
      <label>Proposal text<textarea rows={11} required maxLength={100000} value={proposal} disabled={!editable} onChange={e => setProposal(e.target.value)} /></label>
      <label>Technical features · one per line<textarea rows={5} value={features} disabled={!editable} onChange={e => setFeatures(e.target.value)} placeholder="Describe each specific technical feature you want to compare." /></label>
      <p className="muted">Confirm these features yourself. The comparison uses these exact statements.</p>
      {editable && <button className="primary" disabled={busy || !dirty}>Save new version</button>}
      {dirty && <span className="save-state" role="status">Unsaved changes</span>}
    </form>
  </div><div className="panel"><h2>Documents</h2><p className="muted">TXT or text-based PDF · 20 MB · up to 100 pages. Scanned PDFs require OCR before upload.</p>
    {editable && !frozen && <label className="file-label">Attach document<input type="file" accept=".txt,.pdf" disabled={busy} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></label>}
    {detail.documents.filter(d => d.version_id === version.id).map(d => <details key={d.id}><summary>{d.name}</summary><a href={`/api/documents/${d.id}`}>Download original</a>{d.pages.map(p => <div key={p.page}><h4>Page {p.page}</h4><pre>{p.text}</pre></div>)}{editable && <button disabled={busy} onClick={() => setProposal(text => [text, ...d.pages.map(p => p.text)].filter(Boolean).join('\n\n'))}>Append extracted text to draft</button>}</details>)}
  </div><div className="panel"><h2>Version comparison</h2><label>Compare with<select value={compare} onChange={e => setCompare(e.target.value)}><option value="">Choose a saved version</option>{detail.versions.filter(v => v.id !== version.id).map(v => <option key={v.id} value={v.id}>Version {v.number}</option>)}</select></label>{previous && <div className="two-column"><div><h3>Version {previous.number} · {previous.title}</h3><pre>{previous.proposal}</pre>{previous.features.map(f => <p key={f.id}>{f.id}: {f.text}</p>)}</div><div><h3>Version {version.number} · {version.title}</h3><pre>{version.proposal}</pre>{version.features.map(f => <p key={f.id}>{f.id}: {f.text}</p>)}</div></div>}</div>
    {user.role === 'Administrator' && <div className="panel"><h2>Reviewer assignment</h2><form onSubmit={e => { e.preventDefault(); void act(async () => { await pilotApi(`/projects/${detail.project.id}`, { revision: detail.project.revision, reviewerId: reviewer }, 'PATCH'); await updated(); }, 'Reviewer assigned for the next submission.'); }}><label>Reviewer<select required value={reviewer} onChange={e => setReviewer(e.target.value)}><option value="">Select a reviewer</option>{users.filter(u => u.id !== detail.project.owner_id && ['Reviewer', 'Administrator'].includes(u.role)).map(u => <option key={u.id} value={u.id}>{u.name} · {u.email}</option>)}</select></label><button disabled={busy}>Assign reviewer</button></form></div>}
    {detail.project.canEdit && <button disabled={busy} onClick={() => void act(async () => { await pilotApi(`/projects/${detail.project.id}`, { revision: detail.project.revision, archived: !detail.project.archived }, 'PATCH'); await updated(); }, detail.project.archived ? 'Project restored.' : 'Project archived.')}>{detail.project.archived ? 'Restore project' : 'Archive project'}</button>}
  </>;
}

export function SourcesPanel({ detail, version, sources, act, busy, updated }: Props) {
  const [query, setQuery] = useState(''), [live, setLive] = useState(false), [result, setResult] = useState<SearchResult | null>(null);
  const [kind, setKind] = useState('PATENT'), [title, setTitle] = useState(''), [identifier, setIdentifier] = useState(''), [url, setUrl] = useState(''), [passage, setPassage] = useState(''), [page, setPage] = useState(''), [section, setSection] = useState('');
  const review = detail.reviews.find(r => r.version_id === version.id);
  const run = review ? detail.runs.find(r => r.id === review.run_id) : detail.runs.find(r => r.version_id === version.id);
  const editable = detail.project.canEdit && !detail.project.archived;
  return <>{editable && <><div className="panel"><h2>Find related work</h2><p className="muted">Search your imported library. Optionally send your search query to Crossref for academic references. Patent search covers imported references only.</p>
    <form onSubmit={e => { e.preventDefault(); void act(async () => setResult(await pilotApi<SearchResult>('/sources/search', { projectId: detail.project.id, query, live }))); }}><label>Search query<input required maxLength={500} value={query} onChange={e => setQuery(e.target.value)} /></label><label className="check"><input type="checkbox" checked={live} onChange={e => setLive(e.target.checked)} />Include live Crossref search</label><button disabled={busy}>Search references</button></form>
    {result && <div><h3>Search results</h3><p>{result.library.length} matches in the imported library.</p>{result.library.map(s => <p key={s.id}>{s.kind} · {s.title}</p>)}<p>Crossref: {readable(result.live.status)}. {result.live.message}</p>{result.live.records.map(s => <article className="search-result" key={s.identifier}><div><strong>{s.title}</strong><p>{s.identifier} · {s.passages.length ? 'Abstract available' : 'Metadata only'}</p></div><button disabled={busy} onClick={() => void act(async () => { await pilotApi('/sources', { projectId: detail.project.id, crossrefDoi: s.identifier }); await updated(); }, 'Reference imported.')}>Import reference</button></article>)}<p className="muted">{result.patentProvider.message}</p></div>}
  </div><details className="panel"><summary>Add a reference manually</summary><form onSubmit={e => { e.preventDefault(); void act(async () => { await pilotApi('/sources', { projectId: detail.project.id, kind, title, identifier, url, passages: passage.trim() ? [{ text: passage, section, ...(page ? { page: Number(page) } : {}) }] : [] }); setTitle(''); setIdentifier(''); setUrl(''); setPassage(''); setPage(''); setSection(''); await updated(); }, 'Reference added to the project library.'); }}><div className="two-column"><label>Source type<select value={kind} onChange={e => setKind(e.target.value)}><option value="PATENT">Patent</option><option value="PAPER">Academic paper</option></select></label><label>Publication number or DOI<input required maxLength={250} value={identifier} onChange={e => setIdentifier(e.target.value)} /></label></div><label>Title<input required maxLength={500} value={title} onChange={e => setTitle(e.target.value)} /></label><label>Original source URL<input type="url" value={url} onChange={e => setUrl(e.target.value)} /></label><label>Exact source passage<textarea rows={4} maxLength={12000} value={passage} onChange={e => setPassage(e.target.value)} /></label><div className="two-column"><label>Page (optional)<input type="number" min={1} value={page} onChange={e => setPage(e.target.value)} /></label><label>Section (optional)<input maxLength={250} value={section} onChange={e => setSection(e.target.value)} /></label></div><p className="muted">User-supplied references are not independently verified. A record without a passage cannot support a comparison.</p><button disabled={busy}>Add reference</button></form></details></>}
    {detail.project.canEdit && <div className="panel"><h2>Reference library · {sources.length}</h2>{!sources.length && <p className="empty">No references yet. Import a paper or add a patent and its exact passage.</p>}{sources.map(s => <details key={s.id}><summary>{s.kind === 'PATENT' ? 'Patent' : 'Paper'} · {s.title}</summary><p>{s.identifier} · {s.provenance}</p>{s.url && <a href={s.url} target="_blank" rel="noreferrer">Inspect original ↗</a>}{s.passages.length ? s.passages.map((p, i) => <blockquote key={i}>{p.text}<footer>{p.page ? `Page ${p.page}` : ''} {p.section}</footer></blockquote>) : <p>Metadata only · no supporting passage.</p>}</details>)}</div>}
    <div className="section-heading"><div><h2>Evidence ledger</h2><p className="muted">Version {version.number} · Exact passages linked to confirmed features</p></div>{editable && !review && version.number === detail.project.revision && <button className="primary" disabled={busy} onClick={() => void act(async () => { await pilotApi('/analysis-runs', { versionId: version.id }); await updated(); }, 'Comparison saved. Inspect coverage and limitations before submission.')}>Run comparison</button>}</div><PilotEvidence run={run} />
  </>;
}

export function ReviewPanel({ detail, version, user, act, busy, updated }: Props) {
  const [comment, setComment] = useState(''), [feature, setFeature] = useState(''), [reason, setReason] = useState(''), [decision, setDecision] = useState('NEEDS_REVISION');
  const review = detail.reviews.find(r => r.version_id === version.id), run = review ? detail.runs.find(r => r.id === review.run_id) : detail.runs.find(r => r.version_id === version.id && r.status === 'COMPLETED');
  const open = review && ['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(review.status);
  const canDecide = review?.reviewer_id === user.id && detail.project.owner_id !== user.id;
  return <><div className="panel"><h2>Review · version {version.number}</h2>{!review ? <><p>Submitting freezes this version and its comparison for the assigned reviewer.</p>{!detail.project.assigned_reviewer_id && <p className="notice">An administrator must assign a reviewer in the proposal workspace before submission.</p>}{!run && <p>Run an evidence comparison for this version first.</p>}{user.id === detail.project.owner_id && version.number === detail.project.revision && !detail.project.archived && <button className="primary" disabled={busy || !run || !detail.project.assigned_reviewer_id} onClick={() => void act(async () => { await pilotApi('/reviews', { versionId: version.id, runId: run?.id }); await updated(); }, 'Submitted to the assigned reviewer.')}>Submit for review</button>}</> : <><p><span className="badge">{readable(review.status)}</span> · Reviewer: {review.reviewer_name}</p>{canDecide && ['SUBMITTED', 'RESUBMITTED'].includes(review.status) && <button disabled={busy} onClick={() => void act(async () => { await pilotApi(`/reviews/${review.id}/start`, {}); await updated(); })}>Start review</button>}
      {detail.comments.filter(c => c.review_id === review.id).map(c => <blockquote key={c.id}><p>{c.body}</p><footer>{c.author_name} · {c.feature_id || 'Whole proposal'} · {new Date(c.created_at).toLocaleString()}</footer></blockquote>)}
      {open && <form onSubmit={e => { e.preventDefault(); void act(async () => { await pilotApi(`/reviews/${review.id}/comments`, { comment, featureId: feature || null }); setComment(''); await updated(); }, 'Feedback recorded.'); }}><label>Link feedback to<select value={feature} onChange={e => setFeature(e.target.value)}><option value="">Whole proposal</option>{version.features.map(f => <option key={f.id} value={f.id}>{f.id}: {f.text}</option>)}</select></label><label>Comment<textarea required maxLength={5000} value={comment} onChange={e => setComment(e.target.value)} /></label><button disabled={busy}>Add comment</button></form>}
      {detail.decisions.filter(d => d.review_id === review.id).map(d => <div className="notice" key={d.id}><strong>{readable(d.decision)}</strong><p>{d.reason}</p><p className="muted">{new Date(d.created_at).toLocaleString()}</p></div>)}
      {open && canDecide && <form className="decision-form" onSubmit={e => { e.preventDefault(); void act(async () => { await pilotApi(`/reviews/${review.id}/decision`, { decision, reason }); setReason(''); await updated(); }, 'Review decision recorded.'); }}><h3>Record your decision</h3><label>Decision<select value={decision} onChange={e => setDecision(e.target.value)}><option value="NEEDS_REVISION">Needs revision</option><option value="APPROVED_FOR_DRAFTING">Approved for drafting</option><option value="REJECTED">Rejected</option></select></label><label>Reason<textarea required maxLength={5000} value={reason} onChange={e => setReason(e.target.value)} /></label><p className="muted">This closes the review. Approval is an internal drafting decision.</p><button className="primary" disabled={busy}>Record decision</button></form>}</>}
  </div><PilotEvidence run={run} /></>;
}

export function ReportPanel({ version }: Props) {
  const [report, setReport] = useState<Report | null>(null), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  useEffect(() => { let active = true; setReport(null); setError(''); pilotApi<Report>(`/reports/${version.id}`).then(r => { if (active) setReport(r); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [version.id, attempt]);
  if (error) return <p role="alert">{error} <button onClick={() => setAttempt(a => a + 1)}>Retry report</button></p>;
  if (!report) return <p role="status">Preparing version report…</p>;
  return <><div className="report-actions"><button onClick={() => downloadJson(report, `proposal-v${version.number}.json`)}>Download JSON</button><button className="primary" onClick={() => window.print()}>Print / save PDF</button></div><PilotReport report={report} /></>;
}
