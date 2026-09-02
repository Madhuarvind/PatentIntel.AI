import React, { useState } from 'react';
import { Key, Save } from 'lucide-react';
import { getStoredSettings, saveStoredSettings } from '../services/llmService';

export const SettingsView: React.FC = () => {
  const initialSettings = getStoredSettings();
  const [llmProvider, setLlmProvider] = useState(initialSettings.provider || 'gemini');
  const [similarityCutoff, setSimilarityCutoff] = useState(initialSettings.similarityCutoff || 0.75);
  const [vectorEngine, setVectorEngine] = useState(initialSettings.vectorEngine || 'faiss');
  const [apiKey, setApiKey] = useState(initialSettings.apiKey || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredSettings({
      provider: llmProvider,
      apiKey: apiKey.trim(),
      similarityCutoff,
      vectorEngine
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
          Platform System & AI Settings
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Configure LLM reasoning provider, vector retrieval indexing parameters, and candidate filtering thresholds.
        </p>
      </div>

      <form onSubmit={handleSave} className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
            LLM Reasoning Provider
          </label>
          <select
            value={llmProvider}
            onChange={(e) => setLlmProvider(e.target.value)}
            className="input-field"
            style={{ background: 'var(--bg-input)' }}
          >
            <option value="gemini">Google Gemini 1.5 Pro (Recommended - 1M Context Window)</option>
            <option value="gpt4">OpenAI GPT-4o (Strict RAG Evidence Mode)</option>
            <option value="claude">Anthropic Claude 3.5 Sonnet</option>
            <option value="local">Local Ollama Llama-3-70B (Offline Mode)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
            LLM API Key
          </label>
          <div style={{ position: 'relative' }}>
            <Key size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Similarity Candidate Retrieval Threshold
            </label>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {(similarityCutoff * 100).toFixed(0)}% Match Cutoff
            </span>
          </div>
          <input 
            type="range"
            min="0.50"
            max="0.95"
            step="0.05"
            value={similarityCutoff}
            onChange={(e) => setSimilarityCutoff(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
            Vector Search Index Engine
          </label>
          <select
            value={vectorEngine}
            onChange={(e) => setVectorEngine(e.target.value)}
            className="input-field"
            style={{ background: 'var(--bg-input)' }}
          >
            <option value="faiss">FAISS IndexFlatIP (Meta AI High Performance)</option>
            <option value="pgvector">PostgreSQL pgvector Extension</option>
            <option value="chroma">ChromaDB Local Vector Storage</option>
          </select>
        </div>

        <button type="submit" className="btn-primary" style={{ width: 'fit-content', padding: '12px 24px', fontSize: '0.92rem' }}>
          <Save size={18} /> {saved ? 'Configuration Saved!' : 'Save System Settings'}
        </button>
      </form>
    </div>
  );
};
