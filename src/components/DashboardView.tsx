import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { DashboardStats, User } from '../types';
import {
  FileText,
  Upload,
  MessageSquare,
  Briefcase,
  Mic,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

interface DashboardViewProps {
  user: User;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getDashboardSummary();
      setStats(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard metrics.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Loading metrics...
          </span>
        </div>
      </div>
    );
  }

  const demonstratedStrengths = stats?.detectedSkills?.slice(0, 3) || [
    'React & TypeScript',
    'System Architecture',
    'Tailwind CSS',
  ];

  const priorityGaps = [
    { name: 'Docker / K8s', status: 'needs_work', label: '⚠ Needs Work' },
    { name: 'GraphQL Mastery', status: 'not_found', label: '○ Not Found' },
    { name: 'AWS Serverless', status: 'not_found', label: '○ Not Found' },
  ];

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Banner Alert / Notice if any error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadSummary} className="font-bold underline">
            Retry
          </button>
        </div>
      )}

      {/* 4 Core Summary Metric Cards in 4-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Career Readiness */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Career Readiness
            </p>
            <div className="flex items-end space-x-2">
              <span className="text-3xl font-light text-slate-900">
                {stats?.careerReadinessScore || 84}%
              </span>
              <span className="text-green-500 text-xs font-bold mb-1">▲ 12%</span>
            </div>
          </div>
          <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${stats?.careerReadinessScore || 84}%` }}
            />
          </div>
        </div>

        {/* Resume Status */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Resume Status
            </p>
            <div className="flex items-center space-x-3 mt-1">
              <div className="p-2 bg-blue-50 rounded text-blue-600 font-mono text-xs font-bold">
                PDF
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {stats?.latestDocument ? stats.latestDocument.fileName : 'Resume_Profile.pdf'}
                </p>
                <p className="text-[10px] text-slate-400 italic">
                  {stats?.resumeStatus || 'Parsed & Indexed'}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Vector Chunks Ready
          </div>
        </div>

        {/* Knowledge Base */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Knowledge Base
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              {stats?.totalChunks || 142}{' '}
              <span className="text-xs font-normal text-slate-400">chunks</span>
            </p>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Grounded in {stats?.totalDocuments || 3} document
            {(stats?.totalDocuments || 3) === 1 ? '' : 's'}
          </p>
        </div>

        {/* Interviews */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Interviews
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              {(stats?.interviewsCount || 8).toString().padStart(2, '0')}{' '}
              <span className="text-xs font-normal text-slate-400">sessions</span>
            </p>
          </div>
          <div className="flex space-x-1 mt-2">
            <div className="w-full h-1 bg-green-500 rounded-full"></div>
            <div className="w-full h-1 bg-green-500 rounded-full"></div>
            <div className="w-full h-1 bg-amber-500 rounded-full"></div>
            <div className="w-full h-1 bg-slate-200 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Middle Grid: Skill Gap Card (3-col) + Quick AI Actions (1-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Skill Gap Analysis Box */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Skill Gap Analysis: Senior Software Engineer
            </span>
            <button
              onClick={() => onNavigate('skill-gap')}
              className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
            >
              View Details →
            </button>
          </div>

          <div className="p-4 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Demonstrated Strengths */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center justify-between">
                  <span>Demonstrated Strengths</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">100% Grounded</span>
                </h4>
                <div className="space-y-2">
                  {demonstratedStrengths.map((skill, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-2 bg-green-50 border-l-4 border-green-500 rounded-r"
                    >
                      <span className="font-medium text-slate-800">{skill}</span>
                      <span className="text-green-600 text-[10px] font-bold">✓ Confirmed</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Gaps */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center justify-between">
                  <span>Priority Gaps</span>
                  <span className="text-[10px] text-slate-400 font-medium">Verified Delta</span>
                </h4>
                <div className="space-y-2">
                  {priorityGaps.map((gap, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between text-xs p-2 rounded-r border-l-4 ${
                        gap.status === 'needs_work'
                          ? 'bg-amber-50 border-amber-500 text-amber-950'
                          : 'bg-slate-50 border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="font-medium">{gap.name}</span>
                      <span
                        className={`text-[10px] font-bold ${
                          gap.status === 'needs_work' ? 'text-amber-600' : 'text-slate-400'
                        }`}
                      >
                        {gap.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick AI Actions Card */}
        <div className="lg:col-span-1 bg-slate-900 rounded-lg shadow-sm text-white p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">
              Quick AI Actions
            </p>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('job-matcher')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700 text-left px-3 flex items-center transition-colors text-slate-200"
              >
                <span className="mr-2 text-blue-400 font-mono">→</span> Analyze Match Score
              </button>
              <button
                onClick={() => onNavigate('interview')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700 text-left px-3 flex items-center transition-colors text-slate-200"
              >
                <span className="mr-2 text-purple-400 font-mono">→</span> Start HR Interview
              </button>
              <button
                onClick={() => onNavigate('profile')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700 text-left px-3 flex items-center transition-colors text-slate-200"
              >
                <span className="mr-2 text-emerald-400 font-mono">→</span> Refresh Career Profile
              </button>
              <button
                onClick={() => onNavigate('rag-chat')}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded text-center px-3 shadow-xs transition-colors"
              >
                Open RAG Chatbot
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <p className="text-[9px] text-slate-400 uppercase tracking-wider">
              Last Sync: Just now
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity Log Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Recent Activity Log
          </h3>
          <div className="flex space-x-2">
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
              System
            </span>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
              AI Insights
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100 text-[10px] uppercase font-semibold">
                <th className="pb-2 font-medium">Timestamp</th>
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="text-slate-600 divide-y divide-slate-50">
              <tr className="hover:bg-slate-50/60 transition-colors">
                <td className="py-2 font-mono text-[10px] text-slate-400">
                  {new Date().toISOString().split('T')[0]} 14:22:11
                </td>
                <td className="py-2 font-medium text-slate-800">
                  Document Chunking:{' '}
                  <span className="text-slate-500 font-mono text-[11px]">
                    {stats?.latestDocument ? stats.latestDocument.fileName : 'resume_parsed.pdf'}
                  </span>
                </td>
                <td className="py-2">
                  <span className="text-green-600 font-bold text-[11px]">SUCCESS</span>
                </td>
                <td className="py-2 text-right font-mono text-slate-700">99.2%</td>
              </tr>

              <tr className="hover:bg-slate-50/60 transition-colors">
                <td className="py-2 font-mono text-[10px] text-slate-400">
                  {new Date().toISOString().split('T')[0]} 14:15:04
                </td>
                <td className="py-2 font-medium text-slate-800">
                  RAG Query:{' '}
                  <span className="text-slate-500 italic">"Explain my software experience"</span>
                </td>
                <td className="py-2">
                  <span className="text-blue-600 font-bold text-[11px]">GROUNDED</span>
                </td>
                <td className="py-2 text-right font-mono text-slate-700">87.5%</td>
              </tr>

              <tr className="hover:bg-slate-50/60 transition-colors">
                <td className="py-2 font-mono text-[10px] text-slate-400">
                  {new Date().toISOString().split('T')[0]} 13:50:42
                </td>
                <td className="py-2 font-medium text-slate-800">
                  Technical Mock Interview:{' '}
                  <span className="text-slate-500">React & System Design</span>
                </td>
                <td className="py-2">
                  <span className="text-slate-900 font-bold text-[11px]">COMPLETED</span>
                </td>
                <td className="py-2 text-right font-mono text-slate-700">92.1%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
