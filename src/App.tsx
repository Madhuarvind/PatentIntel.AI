import React, { useState, useEffect } from 'react';
import type { ModuleView } from './types';
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

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string }>({
    name: 'Dr. Alex Vance',
    email: 'alex.vance@uspto-research.gov',
    role: 'Lead Patent Examiner'
  });
  const [activeView, setActiveView] = useState<ModuleView>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isLiteratureOpen, setIsLiteratureOpen] = useState<boolean>(false);
  const [literatureQuery, setLiteratureQuery] = useState<string>('patent claim similarity SBERT');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const openLiteratureWithQuery = (query?: string) => {
    if (query) setLiteratureQuery(query);
    setIsLiteratureOpen(true);
  };

  const handleLoginSuccess = (userData: { name: string; email: string; role: string }) => {
    setUser(userData);
    setIsAuthenticated(true);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen 
          onLoginSuccess={handleLoginSuccess}
          onOpenLiterature={() => openLiteratureWithQuery()}
        />
        <LiteratureModal 
          isOpen={isLiteratureOpen}
          onClose={() => setIsLiteratureOpen(false)}
          initialQuery={literatureQuery}
          onNavigateModule={(mod) => setActiveView(mod)}
        />
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Header Bar */}
      <Header
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenLiterature={() => openLiteratureWithQuery()}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Workspace Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Module Sidebar */}
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
        />

        {/* Dynamic View Content Container */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {activeView === 'dashboard' && (
            <DashboardView 
              onNavigate={setActiveView} 
              onOpenLiterature={(q) => openLiteratureWithQuery(q)}
            />
          )}

          {activeView === 'workspace' && (
            <PatentWorkspaceView />
          )}

          {activeView === 'search' && (
            <SearchEngineView 
              onNavigate={setActiveView} 
              onOpenPaper={(q) => openLiteratureWithQuery(q)}
            />
          )}

          {activeView === 'claims' && (
            <ClaimIntelligenceView onNavigate={setActiveView} />
          )}

          {activeView === 'mapping' && (
            <ClaimMappingView 
              onNavigate={setActiveView} 
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
        </main>
      </div>

      {/* Real-Time External Academic Literature Search Modal */}
      <LiteratureModal
        isOpen={isLiteratureOpen}
        onClose={() => setIsLiteratureOpen(false)}
        initialQuery={literatureQuery}
        onNavigateModule={(mod) => setActiveView(mod)}
      />
    </div>
  );
};

export default App;
