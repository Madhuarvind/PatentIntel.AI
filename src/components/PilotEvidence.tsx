import type { Run } from '../pilotTypes';
export const readable = (s: string) => s.toLowerCase().replaceAll('_', ' ');
export function PilotEvidence({ run }: { run?: Run | null }) {
  if (!run) return <p className="empty">No comparison for this version. Confirm the technical features, add references, then run a comparison.</p>;
  return <section className="evidence-ledger"><p><span className="badge">{readable(run.status)}</span> · {run.method}</p>
    <p className="muted">{run.corpus.length} references searched · {run.corpus.filter(s => s.passages.length).length} with passages. Relevance is not novelty or patentability.</p>
    {run.error && <p role="alert">{run.error}</p>}
    {run.results.map(item => <article className="panel" key={item.feature.id}><h3>{item.feature.id} · {item.feature.text}</h3>
      {!item.matches.length && <p>Insufficient evidence in the searched collection.</p>}
      {item.matches.map((m, i) => <blockquote key={`${m.sourceId}-${i}`}><p>{m.text}</p><footer><strong>{m.sourceTitle}</strong> · {m.sourceKind} · {m.identifier}<br />
        {m.page ? `Page ${m.page} · ` : ''}{m.section ? `${m.section} · ` : ''}BM25 {m.score.toFixed(3)}<br />{m.provenance}<br />
        {m.url && <a href={m.url} target="_blank" rel="noreferrer">Inspect source ↗</a>}</footer></blockquote>)}
    </article>)}
  </section>;
}
