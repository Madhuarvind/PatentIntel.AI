import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePilotRoute, pilotHash, selectedVersion } from '../src/services/pilotNavigation.ts';
import { draftKey, saveDraft, readDraft, clearDrafts } from '../src/services/pilotDrafts.ts';
test('version links round trip across all proposal views and missing versions never select latest', () => {
  const versions = [{ id: 'v3', number: 3 }, { id: 'v1', number: 1 }];
  for (const view of ['proposals', 'sources', 'reviews', 'reports']) {
    const route = parsePilotRoute(pilotHash(view, 'project', 'v1'));
    assert.equal(route.view, view); assert.equal(selectedVersion(versions, route.version).number, 1);
  }
  assert.equal(selectedVersion(versions, 'missing'), undefined);
  assert.equal(selectedVersion(versions, '').number, 3);
});
test('unsaved proposal text stays scoped to the same account and version', () => {
  const draft = { title: 'Unsaved', proposal: 'Private text', features: 'feature' };
  saveDraft(draftKey('owner', 'v1'), draft);
  assert.deepEqual(readDraft(draftKey('owner', 'v1')), draft);
  assert.equal(readDraft(draftKey('another-user', 'v1')), undefined);
  assert.equal(readDraft(draftKey('owner', 'v2')), undefined);
  clearDrafts(); assert.equal(readDraft(draftKey('owner', 'v1')), undefined);
});
