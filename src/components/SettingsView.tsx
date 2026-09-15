import React, { useState } from 'react';
import { Key, Save, Cpu, Globe } from 'lucide-react';
import { getStoredSettings, saveStoredSettings } from '../services/llmService';

export const SettingsView: React.FC = () => {
  const initialSettings = getStoredSettings();
  const [llmProvider, setLlmProvider] = useState(initialSettings.provider || 'gemini');
  const [similarityCutoff, setSimilarityCutoff] = useState(initialSettings.similarityCutoff || 0.75);
  const [vectorEngine, setVectorEngine] = useState(initialSettings.vectorEngine || 'faiss');
  const [apiKey, setApiKey] = useState(initialSettings.apiKey || '');
  const [customEndpoint, setCustomEndpoint] = useState(initialSettings.customEndpoint || 'http://localhost:11434/api/generate');
  const [customModelName, setCustomModelName] = useState(initialSettings.customModelName || 'patentintel-llama3');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredSettings({
      provider: llmProvider,
      apiKey: apiKey.trim(),
      similarityCutoff,
      vectorEngine,
      customEndpoint: customEndpoint.trim(),
      customModelName: customModelName.trim()
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
          Platform System & AI Model Settings
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Configure LLM reasoning provider, custom fine-tuned self-hosted model endpoints, vector retrieval indexing parameters, and candidate filtering thresholds.
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
            <option value="huggingface">Hugging Face Inference API / Dedicated Endpoint (HF Hub Model)</option>
            <option value="custom_model">Custom Fine-Tuned AI Model (Ollama / vLLM / Local Endpoint)</option>
            <option value="local">Local Ollama Llama-3-70B (Offline Mode)</option>
          </select>
        </div>

        {(llmProvider === 'huggingface' || llmProvider === 'custom_model' || llmProvider === 'local') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(99, 102, 241, 0.08)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-indigo)', marginBottom: '6px' }}>
                {llmProvider === 'huggingface' ? 'Hugging Face Inference Endpoint URL' : 'Custom AI Server Endpoint URL'}
              </label>
              <div style={{ position: 'relative' }}>
                <Globe size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-indigo)' }} />
                <input
                  type="text"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  placeholder={llmProvider === 'huggingface' ? "https://api-inference.huggingface.co/models/madhuaravind21/patentintel-llama3-1m" : "http://localhost:11434/api/generate"}
                  className="input-field"
                  style={{ paddingLeft: '34px', fontSize: '0.82rem' }}
                />
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                {llmProvider === 'huggingface' ? 'Format: https://api-inference.huggingface.co/models/your-username/your-model' : 'Ollama: http://localhost:11434/api/generate | vLLM: http://localhost:8000/v1/chat/completions'}
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-indigo)', marginBottom: '6px' }}>
                {llmProvider === 'huggingface' ? 'Hugging Face Model ID' : 'Custom Model Identifier'}
              </label>
              <div style={{ position: 'relative' }}>
                <Cpu size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-indigo)' }} />
                <input
                  type="text"
                  value={customModelName}
                  onChange={(e) => setCustomModelName(e.target.value)}
                  placeholder={llmProvider === 'huggingface' ? "madhuaravind21/patentintel-llama3-1m" : "patentintel-llama3"}
                  className="input-field"
                  style={{ paddingLeft: '34px', fontSize: '0.82rem' }}
                />
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                {llmProvider === 'huggingface' ? 'e.g. madhuaravind21/patentintel-llama3-1m' : 'Name of your fine-tuned model (e.g. patentintel-llama3:8b)'}
              </span>
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
            {llmProvider === 'huggingface' ? 'Hugging Face User Access Token (Write/Read)' : 'LLM API Key (Optional for Local Models)'}
          </label>
          <div style={{ position: 'relative' }}>
            <Key size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={llmProvider === 'huggingface' ? "Paste your Hugging Face Access Token (hf_...)" : "Paste your Gemini or OpenAI API Key..."}
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

        {/* Advanced AI Innovations Panel */}
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)', marginTop: '8px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚡ Advanced AI Engine Capabilities
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: '#10b981' }} />
              DeepSeek-R1 Chain-of-Thought (&lt;think&gt;)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: '#10b981' }} />
              ColPali Multi-Modal Vision AI
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: '#10b981' }} />
              Self-Reflective RAG Self-Correction
            </label>
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ width: 'fit-content', padding: '12px 24px', fontSize: '0.92rem' }}>
          <Save size={18} /> {saved ? 'Configuration Saved!' : 'Save System Settings'}
        </button>
      </form>
    </div>
  );
};
