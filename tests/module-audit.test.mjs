import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let server, store, Analytics, Settings, settings, exporter, translator;
const memory = new Map();
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
before(async () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: key => memory.delete(key)
  }});
  server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom', esbuild: { jsx: 'automatic' } });
  store = (await server.ssrLoadModule('/src/services/workspaceStore.ts')).workspaceStore;
  Analytics = (await server.ssrLoadModule('/src/components/AnalyticsView.tsx')).AnalyticsView;
  Settings = (await server.ssrLoadModule('/src/components/SettingsView.tsx')).SettingsView;
  settings = await server.ssrLoadModule('/src/services/llmService.ts');
  exporter = await server.ssrLoadModule('/src/services/translationExporter.ts');
  translator = await server.ssrLoadModule('/src/services/claimTranslatorService.ts');
});
after(async () => {
  await server?.close();
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
});

test('benchmark metrics are unmeasured for both empty and populated workspaces', () => {
  const getPatents = store.getPatents;
  try {
    for (const patents of [[], [{ id: 'TEST', claims: [{ text: 'An optical detector.' }] }]]) {
      store.getPatents = () => patents;
      const html = renderToStaticMarkup(React.createElement(Analytics));
      assert.equal((html.match(/<strong>Not measured<\/strong>/g) || []).length, 4);
      assert.doesNotMatch(html, /85%|82\.4|SBERT Multi-Vector|Baseline \(100%\)/);
      assert.match(html, new RegExp(`${patents.length} patents`));
    }
  } finally { store.getPatents = getPatents; }
});

test('unsupported settings controls cannot imply enabled integrations', () => {
  const html = renderToStaticMarkup(React.createElement(Settings));
  assert.match(html, /No vector index backend is connected/);
  assert.match(html, /type="range" disabled=""/);
  assert.equal((html.match(/type="checkbox" disabled=""/g) || []).length, 3);
  assert.doesNotMatch(html, /checked=""/);
});

test('settings persistence round trip and storage failure are distinguishable', () => {
  settings.saveStoredSettings({ provider: 'local', customModelName: 'audit-model' });
  assert.equal(settings.getStoredSettings().customModelName, 'audit-model');
  const setItem = localStorage.setItem;
  localStorage.setItem = () => { throw new Error('Quota exceeded'); };
  try { assert.throws(() => settings.saveStoredSettings({ provider: 'gpt4' }), /could not be persisted/); }
  finally { localStorage.setItem = setItem; }
  assert.equal(settings.getStoredSettings().provider, 'local');
});

test('translation downloads retain source Unicode and the active translated text', () => {
  const session = { original_text: '一种传感器，20 kHz', translated_text: 'A sensor operating at 20 kHz.', terminology_map: [] };
  const txt = exporter.createTranslationExport(session, 'txt');
  assert.equal(txt.filename, 'claim-translation.txt');
  assert.match(txt.content, /一种传感器，20 kHz/);
  assert.match(txt.content, /A sensor operating at 20 kHz\./);
  assert.match(txt.mimeType, /text\/plain/);
  const json = exporter.createTranslationExport(session, 'json');
  assert.deepEqual(JSON.parse(json.content), session);
  assert.equal(json.filename, 'claim-translation.json');
});

test('translation export rejects empty results', () => {
  assert.throws(() => exporter.createTranslationExport({ translated_text: ' ' }, 'txt'), /Translate a claim/);
});

test('English sensor claims are not classified as German and unknown languages stay unknown', () => {
  const service = new translator.ClaimTranslatorService();
  assert.equal(service.detectLanguage('A system comprising a sensor and a communication module.').language, 'en');
  assert.equal(service.detectLanguage('Eine Vorrichtung umfassend einen Sensor.').language, 'de');
  assert.equal(service.detectLanguage('xyzzy plugh frobnicator quux').language, 'unknown');
});

test('same-language translation preserves the original text exactly', async () => {
  const provider = new translator.GeminiTranslationProvider();
  const source = '1. A sensor comprising a magnetic housing operating at 20 kHz.';
  assert.equal(await provider.translateText(source, 'en', 'en', ''), source);
});

test('foreign translation rejects rule-engine prose after provider failure', async () => {
  settings.saveStoredSettings({ provider: 'gemini', apiKey: '' });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('', { status: 503 });
  try {
    await assert.rejects(new translator.GeminiTranslationProvider().translateText('一种传感器', 'zh', 'en', ''), /Translation unavailable/);
  } finally { globalThis.fetch = originalFetch; }
});
