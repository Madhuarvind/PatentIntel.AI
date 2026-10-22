import { StrictMode, useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PatentIntelApp from './App.tsx'
import PilotApp from './PilotApp.tsx'
import { removeDraft } from './services/pilotDrafts'
import { getStoredSettings } from './services/llmService'

document.documentElement.dataset.theme = 'light';
getStoredSettings(); // Purge obsolete browser provider credentials on startup.

function RootApp() {
  const previousHash = useRef(window.location.hash);
  const [isPilot, setIsPilot] = useState(() => {
    const hash = window.location.hash;
    return hash.startsWith('#/pilot') || hash.startsWith('#pilot') || window.location.pathname.startsWith('/pilot');
  });

  useEffect(() => {
    const handleHash = (event: HashChangeEvent) => {
      const hash = window.location.hash;
      const nextPilot = hash.startsWith('#/pilot') || hash.startsWith('#pilot') || window.location.pathname.startsWith('/pilot');
      // Guard before the child workspace is unmounted by a cross-workspace link.
      if (!nextPilot && document.documentElement.dataset.pilotDirty === 'true') {
        if (!window.confirm('Leave this draft without saving your changes?')) {
          history.replaceState(null, '', previousHash.current);
          event.stopImmediatePropagation();
          return;
        }
        removeDraft(document.documentElement.dataset.pilotDraftKey || '');
        document.documentElement.dataset.pilotDirty = 'false';
      }
      previousHash.current = hash;
      setIsPilot(nextPilot);
    };
    window.addEventListener('hashchange', handleHash, true);
    return () => window.removeEventListener('hashchange', handleHash, true);
  }, []);

  return isPilot ? <PilotApp /> : <PatentIntelApp />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)
