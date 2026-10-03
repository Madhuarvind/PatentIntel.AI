import type { Report } from '../pilotTypes';
import { PilotEvidence, readable } from './PilotEvidence';
const stamp = (value?: string) => value ? new Date(value).toISOString().replace('T', ' ').replace('.000Z', ' UTC') : 'Not recorded';
export function PilotReport({ report }: { report: Report }) {
  const { version, analysis } = report;
  return <article className="pilot-report panel">
    <p className="eyebrow">PATENTINTEL.AI · REVIEW REPORT</p><h1>{version.title}</h1>
    <p>Version {version.number} · Saved {stamp(version.created_at)}<br />Version ID: {version.id}<br />Export prepared {stamp(report.generatedAt)}</p>
    <h2>Proposal</h2><pre>{version.proposal}</pre>
    <h2>Confirmed technical features</h2>{version.features.length ? version.features.map(f => <p key={f.id}><strong>{f.id}</strong>: {f.text}</p>) : <p>No technical features confirmed.</p>}
    <h2>Evidence and method</h2>{analysis && <p>Analysis {analysis.id} · Run {stamp(analysis.created_at)}</p>}<PilotEvidence run={analysis} />
    <h2>Missing evidence</h2>{!analysis ? <p>All features remain unassessed because this version has no completed comparison.</p> : <>
      {analysis.results.filter(r => !r.matches.length).map(r => <p key={r.feature.id}>{r.feature.id}: No related passage in the searched collection.</p>)}
      {analysis.corpus.filter(s => !s.passages.length).map(s => <p key={s.id}>{s.identifier}: Metadata only; supporting text was unavailable.</p>)}
      <p>Lexical matches do not establish complete technical support. Coverage is limited to the recorded corpus below; no comprehensive patent search or legal determination is claimed.</p>
    </>}
    <h2>Searched source collection</h2>{!analysis?.corpus.length && <p>No source records in this comparison.</p>}
    {analysis?.corpus.map(s => <section key={s.id} className="report-source"><h3>{s.kind === 'PATENT' ? 'Patent' : 'Academic paper'} · {s.title}</h3>
      <p>Identifier: {s.identifier}<br />Publication date: {s.publication_date || 'Not recorded'}<br />Retrieved/imported: {stamp(s.retrieved_at)}<br />{s.provenance}</p>
      {s.url && <p><a href={s.url} target="_blank" rel="noreferrer">Original source</a></p>}
      {s.passages.map((p, i) => <blockquote key={i}>{p.text}<footer>Page: {p.page ?? 'Not recorded'} · Section: {p.section || 'Not recorded'}</footer></blockquote>)}
      {!s.passages.length && <p>No supporting passage available.</p>}
    </section>)}
    <h2>Review history</h2>{!report.reviews.length && <p>Not submitted for review.</p>}
    {report.reviews.map(r => <section key={r.id}><h3>{readable(r.status)}</h3><p>Reviewer: {r.reviewer_name || r.reviewer_id}<br />Submitted: {stamp(r.created_at)}<br />Review ID: {r.id}</p>
      {report.comments.filter(c => c.review_id === r.id).map(c => <blockquote key={c.id}>{c.body}<footer>{c.author_name} · {c.feature_id || 'Whole proposal'} · {stamp(c.created_at)}</footer></blockquote>)}
      {report.decisions.filter(d => d.review_id === r.id).map(d => <p key={d.id}><strong>{readable(d.decision)}</strong>: {d.reason}<br />Recorded: {stamp(d.created_at)}</p>)}
    </section>)}
    <h2>Limitations</h2><ul>{report.limitations.map(l => <li key={l}>{l}</li>)}</ul>
  </article>;
}
