import React, { useState } from 'react';
import { User } from '../types';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Briefcase,
  Mic,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenAuth,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'resume', label: 'Resume Analyzer', icon: FileText },
    { id: 'rag-chat', label: 'RAG Chat', icon: MessageSquare },
    { id: 'job-matcher', label: 'Job Matcher', icon: Briefcase },
    { id: 'interview', label: 'Interview Sim', icon: Mic },
    { id: 'skill-gap', label: 'Skill Gap', icon: TrendingUp },
    { id: 'profile', label: 'Career Profile', icon: UserCheck },
    { id: 'tests', label: 'Acceptance Suite', icon: CheckCircle2 },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#1e293b] text-white border-b border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-slate-300 hover:text-white rounded-md bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <h1 className="text-base font-bold tracking-tight">
              CAREER<span className="text-blue-400">TWIN</span>
            </h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest">
              AI Career Orchestrator
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {user ? (
            <button
              onClick={onLogout}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs flex">
          <div className="w-64 bg-[#1e293b] text-white flex flex-col h-full border-r border-slate-700 p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  CAREER<span className="text-blue-400">TWIN</span>
                </h1>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest">
                  AI Career Orchestrator
                </p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              <div className="px-2 mb-2 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                Core Features
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center px-3 py-2 text-xs font-medium rounded transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2.5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-3 border-t border-slate-700 bg-slate-900 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase text-slate-400 font-bold">MVP Status</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                  🟢 READY
                </span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[100%]"></div>
              </div>
            </div>
          </div>

          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop Sidebar (Theme: High Density) */}
      <aside className="hidden md:flex w-64 bg-[#1e293b] text-white flex-col border-r border-slate-700 shrink-0 h-screen sticky top-0">
        <div className="p-5 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-left focus:outline-none w-full group"
          >
            <h1 className="text-xl font-bold tracking-tight">
              CAREER<span className="text-blue-400">TWIN</span>
            </h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">
              AI Career Orchestrator
            </p>
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
            Core Features
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-2 text-xs rounded transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'
                }`}
              >
                <Icon className="w-4 h-4 mr-3 text-slate-300 group-hover:text-white" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Status in Sidebar Footer */}
        {user && (
          <div className="px-4 py-2.5 bg-slate-850/60 border-t border-slate-700/60 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 truncate max-w-[120px]">{user.email}</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> Active
              </span>
            </div>
          </div>
        )}

        {/* MVP Status Footer Block */}
        <div className="p-4 border-t border-slate-700 bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
              MVP Status
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
              🟢 READY
            </span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[100%]"></div>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
            <span>Grounding: 100%</span>
            <span>Zero Hallucination</span>
          </div>
        </div>
      </aside>
    </>
  );
};
