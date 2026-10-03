import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { authenticatedUser, safeUser } from './auth.mjs';
import { fail, readJson, text, send } from './http.mjs';
import { createMailer } from './mail.mjs';
import { analyzeFeatures, METHOD, rankPassages } from './evidence.mjs';
import { parseDocument, createDocumentStorage, MAX_DOCUMENT_BYTES } from './documents.mjs';
import { searchCrossref, importCrossref } from './sources.mjs';

const featuresInput = value => {
  if (!Array.isArray(value) || value.length > 80) throw fail(400, 'Provide at most 80 features.');
  const result = value.map((feature, index) => ({ id: `F${index + 1}`, text: text(feature?.text, 'Feature', 2000) }));
  return result;
};
const safeUrl = value => {
  if (!value) return '';
  const input = text(value, 'Source URL', 2000);
  try { if (!['https:', 'http:'].includes(new URL(input).protocol)) throw Error(); return input; } catch { throw fail(400, 'Use an HTTP or HTTPS source URL.'); }
};
const cleanSource = body => {
  if (!['PATENT', 'PAPER'].includes(body.kind)) throw fail(400, 'Choose Patent or Paper.');
  if (!Array.isArray(body.passages) || body.passages.length > 100) throw fail(400, 'Provide at most 100 passages.');
  return { kind: body.kind, identifier: text(body.identifier, 'Identifier', 250), title: text(body.title, 'Title', 500), url: safeUrl(body.url),
    publicationDate: text(body.publicationDate || '', 'Publication date', 30, false), provenance: 'User-supplied reference; independently unverified',
    passages: body.passages.map(p => ({ text: text(p?.text, 'Passage', 12000), section: text(p.section || '', 'Section', 250, false),
      ...(p.page === undefined ? {} : { page: Number.isInteger(p.page) && p.page > 0 ? p.page : (() => { throw fail(400, 'Invalid page number.'); })() }) })) };
};

export async function createPilotHandler(db, env = process.env, options = {}) {
  const storage = options.storage || createDocumentStorage(env);
  await storage.ready?.();
  const deliver = options.deliver || createMailer(env);
  const origin = new URL(env.APP_ORIGIN || 'http://localhost:5173').origin;
  // A run is committed before computation. Crashed runs must never appear completed.
  await db.query("UPDATE analysis_runs SET status='INTERRUPTED',error='Server restarted. Run the analysis again.' WHERE status='RUNNING'");
  let parsing = false;
  async function project(tx, id, user, write = false, lock = false) {
    const { rows } = await tx.query(`SELECT * FROM projects p WHERE p.id=$1 AND (p.owner_id=$2 OR $3 OR EXISTS(SELECT 1 FROM reviews r WHERE r.project_id=p.id AND r.reviewer_id=$2))${lock ? ' FOR UPDATE' : ''}`, [id, user.id, user.role === 'Administrator']);
    const p = rows[0];
    if (!p || write && p.owner_id !== user.id && user.role !== 'Administrator') throw fail(404, 'Project not found.');
    return p;
  }
  async function version(tx, id, user) {
    const { rows } = await tx.query(`SELECT v.* FROM project_versions v JOIN projects p ON p.id=v.project_id WHERE v.id=$1 AND
      (p.owner_id=$2 OR $3 OR EXISTS(SELECT 1 FROM reviews r WHERE r.version_id=v.id AND r.reviewer_id=$2))`, [id, user.id, user.role === 'Administrator']);
    if (!rows[0]) throw fail(404, 'Version not found.');
    return rows[0];
  }
  async function review(tx, id, user, lock = false) {
    const { rows } = await tx.query(`SELECT r.*,p.owner_id FROM reviews r JOIN projects p ON p.id=r.project_id WHERE r.id=$1 AND (p.owner_id=$2 OR r.reviewer_id=$2 OR $3)${lock ? ' FOR UPDATE OF r' : ''}`, [id, user.id, user.role === 'Administrator']);
    if (!rows[0]) throw fail(404, 'Review not found.');
    return rows[0];
  }
  async function details(id, user) {
    const p = await project(db, id, user);
    const canEdit = p.owner_id === user.id || user.role === 'Administrator';
    const versions = (await db.query(`SELECT v.* FROM project_versions v WHERE v.project_id=$1 AND ($2 OR EXISTS(SELECT 1 FROM reviews r WHERE r.version_id=v.id AND r.reviewer_id=$3)) ORDER BY number DESC`, [id, canEdit, user.id])).rows;
    const runs = (await db.query(`SELECT a.* FROM analysis_runs a WHERE a.project_id=$1 AND ($2 OR EXISTS(SELECT 1 FROM reviews r WHERE r.run_id=a.id AND r.reviewer_id=$3)) ORDER BY created_at DESC`, [id, canEdit, user.id])).rows;
    const reviews = (await db.query(`SELECT r.*,u.name AS reviewer_name FROM reviews r JOIN auth_users u ON u.id=r.reviewer_id WHERE r.project_id=$1 AND ($2 OR r.reviewer_id=$3) ORDER BY r.created_at DESC`, [id, canEdit, user.id])).rows;
    const comments = (await db.query(`SELECT c.*,u.name AS author_name FROM review_comments c JOIN reviews r ON r.id=c.review_id JOIN auth_users u ON u.id=c.author_id WHERE r.project_id=$1 AND ($2 OR r.reviewer_id=$3) ORDER BY c.created_at`, [id, canEdit, user.id])).rows;
    const decisions = (await db.query(`SELECT d.* FROM review_decisions d JOIN reviews r ON r.id=d.review_id WHERE r.project_id=$1 AND ($2 OR r.reviewer_id=$3) ORDER BY d.created_at`, [id, canEdit, user.id])).rows;
    const documents = (await db.query(`SELECT d.id,d.version_id,d.name,d.mime,d.byte_size,d.sha256,d.pages,d.created_at FROM documents d WHERE d.project_id=$1 AND ($2 OR EXISTS(SELECT 1 FROM reviews r WHERE r.version_id=d.version_id AND r.reviewer_id=$3)) ORDER BY d.created_at`, [id, canEdit, user.id])).rows;
    return { project: { ...p, title: versions[0]?.title || '', revision: canEdit ? p.revision : versions[0]?.number, canEdit }, versions, runs, reviews, comments, decisions, documents };
  }
  async function snapshot(versionId, user) {
    const v = await version(db, versionId, user);
    const detail = await details(v.project_id, user);
    const reviews = detail.reviews.filter(r => r.version_id === v.id);
    const selectedReview = reviews[0];
    const run = selectedReview ? detail.runs.find(r => r.id === selectedReview.run_id) : detail.runs.find(r => r.version_id === v.id && r.status === 'COMPLETED');
    return { schemaVersion: 1, generatedAt: new Date().toISOString(), title: v.title, version: v,
      analysis: run || null, reviews, comments: detail.comments.filter(c => reviews.some(r => r.id === c.review_id)),
      decisions: detail.decisions.filter(d => reviews.some(r => r.id === d.review_id)),
      limitations: ['BM25 relevance is lexical overlap, not novelty or patentability.', 'Sources may be incomplete or user-supplied; inspect every cited passage.', 'Approval is an internal decision for drafting, not a patent-office determination.', 'No semantic, vision or generative model was used.'] };
  }
  return async (req, res) => {
    try {
      const user = await authenticatedUser(db, req, env);
      if (!user) throw fail(401, 'Sign in to continue.');
      const url = new URL(req.url, origin); const path = url.pathname; const method = req.method;
      if (!['GET', 'POST', 'PATCH'].includes(method)) throw fail(405, 'Method not allowed.');
      if (method !== 'GET' && req.headers.origin !== origin) throw fail(403, 'Request origin is not allowed.');
      const body = method === 'GET' ? {} : await readJson(req, path === '/api/documents' ? Math.ceil(MAX_DOCUMENT_BYTES * 4 / 3) + 8192 : 2 * 1024 * 1024);
      if (path === '/api/projects' && method === 'GET') {
        const projects = (await db.query(`SELECT p.*,u.name AS owner_name FROM projects p JOIN auth_users u ON u.id=p.owner_id WHERE p.owner_id=$1 OR $2 OR EXISTS(SELECT 1 FROM reviews r WHERE r.project_id=p.id AND r.reviewer_id=$1) ORDER BY p.updated_at DESC LIMIT 100`, [user.id, user.role === 'Administrator'])).rows;
        for (const p of projects) {
          const own = p.owner_id === user.id || user.role === 'Administrator';
          const latest = (await db.query(`SELECT v.id,v.title,v.number,(SELECT status FROM reviews r WHERE r.version_id=v.id) AS review_status FROM project_versions v WHERE v.project_id=$1 AND ($2 OR EXISTS(SELECT 1 FROM reviews r WHERE r.version_id=v.id AND r.reviewer_id=$3)) ORDER BY v.number DESC LIMIT 1`, [p.id, own, user.id])).rows[0];
          Object.assign(p, { title: latest?.title, revision: latest?.number, latestVersionId: latest?.id, status: latest?.review_status || 'DRAFT', canEdit: own });
        }
        return send(res, 200, { projects });
      }
      if (path === '/api/projects' && method === 'POST') {
        const title = text(body.title, 'Title', 200), proposal = text(body.proposal || '', 'Proposal', 100000, false), features = featuresInput(body.features || []);
        const id = randomUUID(), versionId = randomUUID();
        await db.transaction(async tx => {
          await tx.query('INSERT INTO projects(id,owner_id,title) VALUES ($1,$2,$3)', [id, user.id, title]);
          await tx.query('INSERT INTO project_versions(id,project_id,number,title,proposal,features) VALUES ($1,$2,1,$3,$4,$5)', [versionId, id, title, proposal, JSON.stringify(features)]);
        });
        return send(res, 201, { id, versionId });
      }
      let match = path.match(/^\/api\/projects\/([^/]+)$/);
      if (match && method === 'GET') return send(res, 200, await details(match[1], user));
      if (match && method === 'PATCH') {
        await db.transaction(async tx => {
          const p = await project(tx, match[1], user, true, true);
          if (body.revision !== p.revision) throw fail(409, 'Project changed. Reload before saving.');
          if (body.reviewerId !== undefined) {
            if (user.role !== 'Administrator') throw fail(403, 'Only administrators assign reviewers.');
            const reviewer = (await tx.query("SELECT id FROM auth_users WHERE id=$1 AND role IN ('Reviewer','Administrator')", [body.reviewerId])).rows[0];
            if (!reviewer || reviewer.id === p.owner_id) throw fail(400, 'Assign another reviewer, not the author.');
            await tx.query('UPDATE projects SET assigned_reviewer_id=$1,updated_at=CURRENT_TIMESTAMP WHERE id=$2', [reviewer.id, p.id]);
          } else {
            if (typeof body.archived !== 'boolean') throw fail(400, 'Provide the archive state.');
            await tx.query('UPDATE projects SET archived=$1,updated_at=CURRENT_TIMESTAMP WHERE id=$2', [body.archived, p.id]);
          }
        });
        return send(res, 200, { ok: true });
      }
      match = path.match(/^\/api\/projects\/([^/]+)\/versions$/);
      if (match && method === 'POST') {
        const title = text(body.title, 'Title', 200), proposal = text(body.proposal, 'Proposal', 100000), features = featuresInput(body.features);
        const versionId = randomUUID();
        await db.transaction(async tx => {
          const p = await project(tx, match[1], user, true, true);
          if (p.archived) throw fail(409, 'Restore the project before editing.');
          if (p.revision !== body.revision) throw fail(409, 'A newer version exists. Reload before saving.');
          await tx.query('INSERT INTO project_versions(id,project_id,number,title,proposal,features) VALUES ($1,$2,$3,$4,$5,$6)', [versionId, p.id, p.revision + 1, title, proposal, JSON.stringify(features)]);
          const previousDocuments = (await tx.query('SELECT d.* FROM documents d JOIN project_versions v ON v.id=d.version_id WHERE v.project_id=$1 AND v.number=$2', [p.id, p.revision])).rows;
          for (const d of previousDocuments) await tx.query('INSERT INTO documents(id,project_id,version_id,name,mime,byte_size,sha256,storage_key,pages) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [randomUUID(), p.id, versionId, d.name, d.mime, d.byte_size, d.sha256, d.storage_key, JSON.stringify(d.pages)]);
          await tx.query('UPDATE projects SET title=$1,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=$2', [title, p.id]);
        });
        return send(res, 201, { versionId });
      }
      if (path === '/api/sources' && method === 'GET') {
        await project(db, url.searchParams.get('projectId'), user, true);
        return send(res, 200, { sources: (await db.query('SELECT * FROM sources WHERE project_id=$1 ORDER BY retrieved_at DESC', [url.searchParams.get('projectId')])).rows });
      }
      if (path === '/api/sources' && method === 'POST') {
        const p = await project(db, body.projectId, user, true);
        if (p.archived) throw fail(409, 'Restore the project first.');
        const source = body.crossrefDoi ? await importCrossref(body.crossrefDoi, options.fetcher) : cleanSource(body);
        const id = randomUUID();
        try { await db.query('INSERT INTO sources(id,project_id,kind,identifier,title,url,publication_date,passages,provenance) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, p.id, source.kind, source.identifier, source.title, source.url, source.publicationDate, JSON.stringify(source.passages), source.provenance]); }
        catch (error) { if (error.code === '23505') throw fail(409, 'That reference is already in this project.'); throw error; }
        return send(res, 201, { id });
      }
      if (path === '/api/sources/search' && method === 'POST') {
        await project(db, body.projectId, user, true);
        const query = text(body.query, 'Search query', 500);
        const library = (await db.query('SELECT * FROM sources WHERE project_id=$1', [body.projectId])).rows;
        const local = rankPassages(query, library.map((s, index) => ({ text: `${s.title} ${s.identifier} ${s.passages.map(p => p.text).join(' ')}`, sourceId: s.id, index }))).map(rank => ({ ...library.find(s => s.id === rank.sourceId), score: rank.score }));
        const live = body.live === true ? await searchCrossref(query, options.fetcher) : { provider: 'Crossref', status: 'NOT_REQUESTED', records: [] };
        return send(res, 200, { library: local, live, patentProvider: { status: 'NOT_CONFIGURED', message: 'Patent search covers your imported library. Add patent references with source passages; no global patent search is claimed.' }, method: METHOD });
      }
      if (path === '/api/analysis-runs' && method === 'POST') {
        const v = await version(db, body.versionId, user); const p = await project(db, v.project_id, user, true);
        if (p.archived || v.number !== p.revision) throw fail(409, 'Analyze the current editable version.');
        if (!v.features.length || !v.proposal.trim()) throw fail(400, 'Save proposal text and confirm at least one feature first.');
        const corpus = (await db.query('SELECT * FROM sources WHERE project_id=$1 ORDER BY id', [p.id])).rows;
        const id = randomUUID();
        await db.query("INSERT INTO analysis_runs(id,project_id,version_id,status,method,corpus) VALUES ($1,$2,$3,'RUNNING',$4,$5)", [id, p.id, v.id, METHOD, JSON.stringify(corpus)]);
        try {
          const results = analyzeFeatures(v.features, corpus);
          await db.query("UPDATE analysis_runs SET status='COMPLETED',results=$1,finished_at=CURRENT_TIMESTAMP WHERE id=$2", [JSON.stringify(results), id]);
        } catch { await db.query("UPDATE analysis_runs SET status='FAILED',error='Analysis could not complete.' WHERE id=$1", [id]); throw fail(503, 'Analysis failed. Retry.'); }
        return send(res, 201, { id });
      }
      if (path === '/api/documents' && method === 'POST') {
        const v = await version(db, body.versionId, user); const p = await project(db, v.project_id, user, true);
        if (p.archived || v.number !== p.revision) throw fail(409, 'Upload to the current version.');
        if ((await db.query('SELECT id FROM reviews WHERE version_id=$1', [v.id])).rows.length) throw fail(409, 'Submitted versions are frozen. Save a new version before uploading.');
        const name = text(body.name, 'Filename', 200);
        if (typeof body.base64 !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(body.base64)) throw fail(400, 'Invalid document encoding.');
        if (parsing) throw fail(503, 'Another document is being processed. Retry shortly.');
        parsing = true;
        let key;
        try {
          const bytes = Buffer.from(body.base64, 'base64'); const parsed = await parseDocument(name, bytes);
          if ((await db.query('SELECT id FROM documents WHERE version_id=$1 AND sha256=$2', [v.id, parsed.sha256])).rows.length) throw fail(409, 'This document is already attached to this version.');
          const id = randomUUID(); key = await storage.put(user.id, bytes, parsed.mime);
          await db.transaction(async tx => {
            const latest = await project(tx, p.id, user, true, true);
            if (latest.archived || latest.revision !== v.number || (await tx.query('SELECT id FROM reviews WHERE version_id=$1', [v.id])).rows.length) throw fail(409, 'Version changed, was archived or was submitted during upload.');
            await tx.query('INSERT INTO documents(id,project_id,version_id,name,mime,byte_size,sha256,storage_key,pages) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, p.id, v.id, name, parsed.mime, bytes.length, parsed.sha256, key, JSON.stringify(parsed.pages)]);
          });
          return send(res, 201, { id, pages: parsed.pages, name });
        } catch (error) { if (key) { try { await storage.remove(key); } catch { console.error('Orphan document cleanup requires operator attention.'); } } throw error; }
        finally { parsing = false; }
      }
      match = path.match(/^\/api\/documents\/([^/]+)$/);
      if (match && method === 'GET') {
        const d = (await db.query('SELECT * FROM documents WHERE id=$1', [match[1]])).rows[0];
        if (!d) throw fail(404, 'Document not found.'); await version(db, d.version_id, user);
        const bytes = await storage.get(d.storage_key);
        res.setHeader('Content-Type', d.mime); res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(d.name)}`); res.end(bytes); return;
      }
      if (path === '/api/reviews' && method === 'GET') {
        return send(res, 200, { reviews: (await db.query(`SELECT r.*,v.title,v.number,u.name AS owner_name FROM reviews r JOIN project_versions v ON v.id=r.version_id JOIN projects p ON p.id=r.project_id JOIN auth_users u ON u.id=p.owner_id WHERE r.reviewer_id=$1 OR p.owner_id=$1 OR $2 ORDER BY r.updated_at DESC`, [user.id, user.role === 'Administrator'])).rows });
      }
      if (path === '/api/reviews' && method === 'POST') {
        const id = randomUUID();
        await db.transaction(async tx => {
          const v = await version(tx, body.versionId, user); const p = await project(tx, v.project_id, user, true, true);
          if (p.owner_id !== user.id) throw fail(403, 'Only the author can submit a proposal.');
          if (p.archived || p.revision !== v.number) throw fail(409, 'Submit the current active version.');
          if (!p.assigned_reviewer_id || p.assigned_reviewer_id === user.id) throw fail(409, 'Ask an administrator to assign another reviewer first.');
          const run = (await tx.query("SELECT id FROM analysis_runs WHERE id=$1 AND version_id=$2 AND status='COMPLETED'", [body.runId, v.id])).rows[0];
          if (!run) throw fail(400, 'Complete an analysis for this version first.');
          const previous = (await tx.query('SELECT status FROM reviews WHERE project_id=$1 ORDER BY created_at DESC LIMIT 1', [p.id])).rows[0];
          if (previous && ['SUBMITTED','RESUBMITTED','UNDER_REVIEW'].includes(previous.status)) throw fail(409, 'The previous submission is still being reviewed.');
          await tx.query('INSERT INTO reviews(id,project_id,version_id,run_id,reviewer_id,status) VALUES ($1,$2,$3,$4,$5,$6)', [id, p.id, v.id, run.id, p.assigned_reviewer_id, previous ? 'RESUBMITTED' : 'SUBMITTED']);
        });
        return send(res, 201, { id });
      }
      match = path.match(/^\/api\/reviews\/([^/]+)\/(start|comments|decision)$/);
      if (match && method === 'POST') {
        await db.transaction(async tx => {
          const r = await review(tx, match[1], user, true);
          if (!['SUBMITTED','RESUBMITTED','UNDER_REVIEW'].includes(r.status)) throw fail(409, 'This review is closed. Submit a new version to continue.');
          if (match[2] === 'comments') {
            const v = await version(tx, r.version_id, user);
            if (body.featureId && !v.features.some(f => f.id === body.featureId)) throw fail(400, 'Feature is not part of the submitted version.');
            await tx.query('INSERT INTO review_comments(id,review_id,author_id,feature_id,body) VALUES ($1,$2,$3,$4,$5)', [randomUUID(), r.id, user.id, body.featureId || null, text(body.comment, 'Comment', 5000)]);
          } else {
            if (r.reviewer_id !== user.id || r.owner_id === user.id || !['Reviewer','Administrator'].includes(user.role)) throw fail(403, 'Only the assigned reviewer can decide this submission.');
            if (match[2] === 'start') await tx.query("UPDATE reviews SET status='UNDER_REVIEW',updated_at=CURRENT_TIMESTAMP WHERE id=$1", [r.id]);
            else {
              if (!['NEEDS_REVISION','APPROVED_FOR_DRAFTING','REJECTED'].includes(body.decision)) throw fail(400, 'Choose a review decision.');
              await tx.query('INSERT INTO review_decisions(id,review_id,author_id,decision,reason) VALUES ($1,$2,$3,$4,$5)', [randomUUID(), r.id, user.id, body.decision, text(body.reason, 'Decision reason', 5000)]);
              await tx.query('UPDATE reviews SET status=$1,updated_at=CURRENT_TIMESTAMP WHERE id=$2', [body.decision, r.id]);
            }
          }
        });
        return send(res, 200, { ok: true });
      }
      match = path.match(/^\/api\/reports\/([^/]+)$/);
      if (match && method === 'GET') return send(res, 200, await snapshot(match[1], user));
      if (path === '/api/admin/users' && method === 'GET') {
        if (user.role !== 'Administrator') throw fail(403, 'Administrator access required.');
        return send(res, 200, { users: (await db.query('SELECT * FROM auth_users ORDER BY name LIMIT 500')).rows.map(safeUser) });
      }
      if (path === '/api/admin/invitations' && method === 'POST') {
        if (user.role !== 'Administrator') throw fail(403, 'Administrator access required.');
        const email = text(body.email, 'Email', 254).toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['Researcher','Reviewer'].includes(body.role)) throw fail(400, 'Enter a valid email and role.');
        if (!deliver) throw fail(503, 'Invitation email delivery is not configured.');
        const token = randomBytes(32).toString('hex'), hash = createHash('sha256').update(token).digest('hex');
        await db.query("INSERT INTO account_tokens(token_hash,email,purpose,role,expires_at) VALUES ($1,$2,'invite',$3,$4)", [hash, email, body.role, new Date(Date.now() + 86400000)]);
        try { await deliver(email, `${origin}/?invite=${token}`, 'invite'); }
        catch { await db.query('DELETE FROM account_tokens WHERE token_hash=$1', [hash]); throw fail(503, 'Invitation delivery failed. Retry.'); }
        return send(res, 201, { message: env.NODE_ENV === 'production' || env.RESEND_API_KEY ? 'Invitation sent.' : 'Invitation saved to the local mail outbox.' });
      }
      throw fail(404, 'Endpoint not found.');
    } catch (error) {
      const status = error.code === '23505' ? 409 : error.status || 503;
      if (!error.status && error.code !== '23505') console.error('Pilot request failed:', error.code || 'INTERNAL');
      send(res, status, { error: error.status ? error.message : error.code === '23505' ? 'This record already exists. Reload to see the latest state.' : 'The workspace service is unavailable. Please retry.' });
    }
  };
}
