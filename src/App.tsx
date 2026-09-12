import React, { useState, useEffect } from 'react';
import type { ModuleView } from './types';
import { dbStore } from './services/dbStore';
import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PatentWorkspaceView } from './components/PatentWorkspaceView';
import { SearchEngineView } from './components/SearchEngineView';
import { ClaimIntelligenceView } from './components/ClaimIntelligenceView';
import { ClaimMappingView } from './components/ClaimMappingView';
import { PriorArtTimelineView } from './components/PriorArtTimelineView';
import { AIEvidenceView } from './components/AIEvidenceView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { LiteratureModal } from './components/LiteratureModal';
import { ClaimSynthesizerView } from './components/ClaimSynthesizerView';
import { ClaimTranslatorModal } from './components/ClaimTranslatorModal';
import { IdeaNoveltyView } from './components/IdeaNoveltyView';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!dbStore.getCurrentUser();
  });
  
  const [user, setUser] = useState<{ name: string; email: string; role: string }>(() => {
    const active = dbStore.getCurrentUser();
    return active ? { name: active.name, email: active.email, role: active.role } : {
      name: 'Dr. Alex Vance',
      email: 'alex.vance@uspto-research.gov',
      role: 'Lead Patent Examiner'
    };
  });

  const [activeView, setActiveView] = useState<ModuleView>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/innovation') || hash.startsWith('#innovation')) return 'idea-novelty';
    if (hash === '#/review-queue' || hash === '#review-queue') return 'review-queue';
    if (hash.startsWith('#/')) {
      const view = hash.replace(/^#\//, '') as ModuleView;
      const valid: ModuleView[] = ['dashboard', 'workspace', 'search', 'claims', 'mapping', 'timeline', 'ai-evidence', 'analytics', 'settings', 'claim-synthesizer', 'idea-novelty', 'review-queue'];
      if (valid.includes(view)) return view;
    }
    return 'dashboard';
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(() => {
    const hash = window.location.hash;
    const match = hash.match(/#\/?innovation\/([^/?#]+)/);
    return match ? match[1] : undefined;
  });

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isLiteratureOpen, setIsLiteratureOpen] = useState<boolean>(false);
  const [literatureQuery, setLiteratureQuery] = useState<string>('patent claim similarity SBERT');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [synthesizerMetadata, setSynthesizerMetadata] = useState<any>(null);

  // Sync with browser hash changes for back/forward and refresh support
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/innovation/') || hash.startsWith('#innovation/')) {
        const id = hash.replace(/^#\/?innovation\//, '').split(/[?#]/)[0];
        if (id) {
          setSelectedProjectId(id);
          setActiveView('idea-novelty');
        }
      } else if (hash === '#/innovation' || hash === '#innovation') {
        setSelectedProjectId(undefined);
        setActiveView('idea-novelty');
      } else if (hash === '#/review-queue' || hash === '#review-queue') {
        setSelectedProjectId(undefined);
        setActiveView('review-queue');
      } else if (hash.startsWith('#/')) {
        const view = hash.replace(/^#\//, '') as ModuleView;
        const valid: ModuleView[] = ['dashboard', 'workspace', 'search', 'claims', 'mapping', 'timeline', 'ai-evidence', 'analytics', 'settings', 'claim-synthesizer', 'idea-novelty', 'review-queue'];
        if (valid.includes(view)) {
          setSelectedProjectId(undefined);
          setActiveView(view);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // WIPO Claim Translator Modal State
  const [isTranslatorOpen, setIsTranslatorOpen] = useState<boolean>(false);
  const [translatorPatentId, setTranslatorPatentId] = useState<string>('US10928341B2');
  const [translatorClaimNumber, setTranslatorClaimNumber] = useState<number>(1);
  const [translatorClaimText, setTranslatorClaimText] = useState<string | undefined>(undefined);
  const [translatorSearchQuery, setTranslatorSearchQuery] = useState<string | undefined>(undefined);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleSelectView = (view: ModuleView) => {
    setActiveView(view);
    if (view === 'review-queue') {
      setSelectedProjectId(undefined);
      window.location.hash = '/review-queue';
    } else if (view === 'idea-novelty') {
      window.location.hash = selectedProjectId ? `/innovation/${selectedProjectId}` : '/innovation';
    } else {
      setSelectedProjectId(undefined);
      window.location.hash = `/${view}`;
    }
  };

  const handleNavigateWithMetadata = (view: ModuleView, metadata?: any) => {
    if (metadata) {
      setSynthesizerMetadata(metadata);
    }
    handleSelectView(view);
  };

  const openLiteratureWithQuery = (query?: string) => {
    if (query) setLiteratureQuery(query);
    setIsLiteratureOpen(true);
  };

  const openClaimTranslator = (patentId?: string, claimNumber?: number, claimText?: string) => {
    if (patentId) setTranslatorPatentId(patentId);
    if (claimNumber) setTranslatorClaimNumber(claimNumber);
    if (claimText) setTranslatorClaimText(claimText);
    setIsTranslatorOpen(true);
  };

  const handleSearchSimilarFromTranslator = (translatedQuery: string) => {
    setTranslatorSearchQuery(translatedQuery);
    setActiveView('search');
  };

  const handleLoginSuccess = (userData: { name: string; email: string; role: string }) => {
    setUser(userData);
    setIsAuthenticated(true);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    dbStore.logoutUser();
    setIsAuthenticated(false);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (!isAuthenticated) {
    return (
      <AuthScreen 
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw',
      display: 'flex', 
      flexDirection: 'column', 
      background: 'var(--bg-main)',
      overflow: 'hidden'
    }}>
      {/* Header Bar */}
      <div style={{ flexShrink: 0, zIndex: 10 }}>
        <Header
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenLiterature={() => openLiteratureWithQuery()}
          onLogout={handleLogout}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Main Workspace Area (Fixed Full Height Body) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 64px)', width: '100%', maxWidth: '100%', minWidth: 0 }}>
        {/* Module Sidebar (Fixed Position Pinning) */}
        <Sidebar
          activeView={activeView}
          onSelectView={handleSelectView}
        />

        {/* Dynamic View Content Container (Individually Scrollable Main Area) */}
        <main 
          className={`app-main-content ${activeView === 'review-queue' ? 'review-queue-main-container' : ''}`} 
          style={{ 
            flex: 1, 
            height: '100%', 
            width: '100%', 
            maxWidth: '100%', 
            minWidth: 0, 
            padding: activeView === 'review-queue' ? '20px 28px' : '32px', 
            overflowY: activeView === 'review-queue' ? 'hidden' : 'auto', 
            boxSizing: 'border-box' 
          }}
        >
          {activeView === 'dashboard' && (
            <DashboardView 
              onNavigate={handleSelectView} 
              onOpenLiterature={(q) => openLiteratureWithQuery(q)}
            />
          )}

          {activeView === 'workspace' && (
            <PatentWorkspaceView 
              onOpenClaimTranslator={openClaimTranslator}
            />
          )}

          {activeView === 'search' && (
            <SearchEngineView 
              onNavigate={handleSelectView} 
              onOpenPaper={(q) => openLiteratureWithQuery(q)}
              initialQuery={translatorSearchQuery}
            />
          )}

          {activeView === 'claims' && (
            <ClaimIntelligenceView 
              onNavigate={handleSelectView}
              onOpenClaimTranslator={openClaimTranslator}
            />
          )}

          {activeView === 'mapping' && (
            <ClaimMappingView 
              onNavigate={handleSelectView} 
              onOpenPaper={(q) => openLiteratureWithQuery(q)}
            />
          )}

          {activeView === 'timeline' && (
            <PriorArtTimelineView 
              onOpenPaper={(q) => openLiteratureWithQuery(q)}
            />
          )}

          {activeView === 'ai-evidence' && (
            <AIEvidenceView 
              onOpenPaper={(q) => openLiteratureWithQuery(q)}
            />
          )}

          {activeView === 'analytics' && (
            <AnalyticsView />
          )}

          {activeView === 'settings' && (
            <SettingsView />
          )}

          {activeView === 'claim-synthesizer' && (
            <ClaimSynthesizerView initialData={synthesizerMetadata} />
          )}

          {activeView === 'idea-novelty' && (
            <IdeaNoveltyView 
              selectedProjectId={selectedProjectId}
              onNavigate={handleNavigateWithMetadata}
            />
          )}

          {activeView === 'review-queue' && (
            <IdeaNoveltyView 
              initialTab="review_queue"
              onNavigate={handleNavigateWithMetadata}
            />
          )}
        </main>
      </div>

      {/* Real-Time External Academic Literature Search Modal */}
      <LiteratureModal
        isOpen={isLiteratureOpen}
        onClose={() => setIsLiteratureOpen(false)}
        initialQuery={literatureQuery}
        onNavigateModule={(mod) => setActiveView(mod)}
      />

      {/* WIPO Multi-Language Claim Translator Modal */}
      <ClaimTranslatorModal
        isOpen={isTranslatorOpen}
        onClose={() => setIsTranslatorOpen(false)}
        initialPatentId={translatorPatentId}
        initialClaimNumber={translatorClaimNumber}
        initialClaimText={translatorClaimText}
        onSearchSimilarPatents={handleSearchSimilarFromTranslator}
      />
    </div>
  );
};

export default App;
