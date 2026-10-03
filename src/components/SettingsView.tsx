import React from 'react';
import { getStoredSettings } from '../services/llmService';
export const SettingsView: React.FC = () => {
  getStoredSettings();
  return <section className="glass-panel" style={{ padding: 28, maxWidth: 800 }}>
    <h1>Platform settings</h1>
    <p role="status">Generative AI is disabled. Provider keys and custom endpoints cannot be entered in this browser.</p>
    <p>The review pilot works without paid AI. Older research modules may use experimental local text heuristics; these are not a trained semantic model.</p>
    <h2>Research integrations</h2>
    <label>Similarity candidate threshold <input type="range" disabled aria-label="Unavailable similarity threshold" /></label>
    <p>Not connected to retrieval. This setting currently has no effect.</p>
    <p>No vector index backend is connected.</p>
    {['Reasoning model', 'Multimodal vision', 'Generative evidence synthesis'].map(name => <p key={name}><label><input type="checkbox" disabled /> {name} — unavailable</label></p>)}
    <a href="#/pilot/settings">Open account settings in Enterprise Review Pilot</a>
  </section>;
};
