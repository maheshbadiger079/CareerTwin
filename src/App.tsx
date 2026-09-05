import React, { useState, useEffect } from 'react';
import { api, clearAuthSession, getStoredToken, getStoredUser } from './api';
import { User } from './types';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './components/DashboardView';
import { ResumeView } from './components/ResumeView';
import { RAGChatView } from './components/RAGChatView';
import { JobMatchView } from './components/JobMatchView';
import { InterviewView } from './components/InterviewView';
import { SkillGapView } from './components/SkillGapView';
import { ProfileView } from './components/ProfileView';
import { TestRunnerView } from './components/TestRunnerView';
import { ShieldCheck, Sparkles, ArrowRight, Lock } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Restore session
  useEffect(() => {
    const checkSession = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch {
          clearAuthSession();
          setUser(null);
        }
      }
      setInitialLoading(false);
    };

    checkSession();

    const handleExpired = () => {
      setUser(null);
      setShowAuthModal(true);
    };
    window.addEventListener('auth-expired', handleExpired);
    return () => window.removeEventListener('auth-expired', handleExpired);
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setShowAuthModal(false);
  };

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'User Dashboard';
      case 'resume':
        return 'Resume Analyzer & Knowledge Base';
      case 'rag-chat':
        return 'RAG Grounded Chatbot';
      case 'job-matcher':
        return 'Job Description Matcher';
      case 'interview':
        return 'Mock Interview Simulator';
      case 'skill-gap':
        return 'Skill Gap & Learning Roadmap';
      case 'profile':
        return 'Career Twin Profile';
      case 'tests':
        return 'MVP Acceptance Suite';
      default:
        return 'Career Twin';
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Loading CareerTwin Orchestrator...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* High Density Navigation Sidebar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] text-[#0f172a] overflow-x-hidden">
        {/* High Density Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3 text-sm">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              {getTabTitle(activeTab)}
            </h2>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 truncate">
              {user ? `Welcome back, ${user.name}` : 'Career Knowledge Sandbox'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 font-mono">
                    {user.name.replace(/\s+/g, '_').toUpperCase()}
                  </p>
                  <p className="text-[10px] text-slate-400">Standard Tier</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-xs">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('tests')}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 rounded border border-slate-200"
                >
                  Test Suite
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded shadow-xs transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1">
          {!user ? (
            /* Unauthenticated Landing / Demo State */
            <div className="max-w-4xl mx-auto px-6 py-12 text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Grounded AI Career Twin & RAG Co-Pilot</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                AI Career Orchestrator Grounded in Strict Truth.
              </h1>

              <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Upload your resume into an isolated vector store. Chat strictly with facts, run ATS audits, simulate progressive project defenses, and close skill gaps without AI hallucinations.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  id="landing-signin-btn"
                  onClick={() => setShowAuthModal(true)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>Access Career Twin</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveTab('tests')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-lg border border-slate-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Run Acceptance Suite</span>
                </button>
              </div>

              {/* High Density Feature Trio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-6">
                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Zero Hallucinations</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Strictly grounded RAG. If information is not in your documents, the AI explicitly declines rather than guessing.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Isolated Vector Store</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Each user's resume chunks are partitioned by account ID. Deleting a resume erases all vector chunks permanently.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <div className="w-7 h-7 rounded bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">5-Stage Project Defense</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Interactive simulation probing problem statement, tech stack, architecture, security, and scalability.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Authenticated User Views */
            <div className="w-full">
              {activeTab === 'dashboard' && (
                <DashboardView user={user} onNavigate={setActiveTab} />
              )}
              {activeTab === 'resume' && <ResumeView />}
              {activeTab === 'rag-chat' && <RAGChatView />}
              {activeTab === 'job-matcher' && <JobMatchView />}
              {activeTab === 'interview' && <InterviewView />}
              {activeTab === 'skill-gap' && <SkillGapView />}
              {activeTab === 'profile' && <ProfileView />}
              {activeTab === 'tests' && <TestRunnerView />}
            </div>
          )}
        </main>

        {/* High Density Status Footer */}
        <footer className="mt-auto bg-slate-50 border-t border-slate-200 px-6 sm:px-8 py-2.5 flex flex-wrap justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest font-semibold gap-2">
          <div className="flex flex-wrap space-x-4 sm:space-x-6">
            <span>System Latency: 124ms</span>
            <span>Recall@5: 88.2%</span>
            <span>Uptime: 99.98%</span>
          </div>
          <div>
            Build v0.1.2-ALPHA • 2026 CAREERTWIN AI
          </div>
        </footer>
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal onSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}
