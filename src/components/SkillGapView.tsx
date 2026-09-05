import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { SkillGapReport } from '../types';
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  FolderPlus,
  AlertCircle,
} from 'lucide-react';

export const SkillGapView: React.FC = () => {
  const [targetRole, setTargetRole] = useState('Senior Full-Stack Engineer');
  const [report, setReport] = useState<SkillGapReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runAnalysis = async (roleToRun?: string) => {
    const role = roleToRun || targetRole;
    if (!role.trim()) return;
    setError('');
    setLoading(true);
    try {
      const data = await api.getSkillGap(role);
      setReport(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Skill-gap analysis failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Career Trajectory
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Skill-Gap Analysis & Sequenced Roadmap
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Measure the verified delta between demonstrated competencies and target positions.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Target Role Selector */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Target Role for Gap Analysis
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Senior DevOps Engineer, Principal Backend Architect..."
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
        </div>
        <button
          type="button"
          disabled={loading || !targetRole.trim()}
          onClick={() => runAnalysis()}
          className="w-full sm:w-auto mt-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Generate Roadmap</span>
            </>
          )}
        </button>
      </div>

      {/* Report Content */}
      {report && (
        <div className="space-y-4">
          {/* Disclaimer */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-600 text-xs flex items-start gap-2">
            <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 text-slate-500 mt-0.5" />
            <div className="text-[11px]">
              <strong>Audit Transparency:</strong> Skills marked as <em>Unknown / Not Documented</em> simply reflect that no reference was discovered in your uploaded resume or profile. It does not prove inability.
            </div>
          </div>

          {/* 3 Categories Matrix with High Density Left Borders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Demonstrated */}
            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  Demonstrated (✓)
                </h3>
                <span className="text-[10px] bg-green-50 text-green-700 font-bold px-1.5 py-0.5 rounded border border-green-200">
                  {report.existingStrengths.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Verified from resume & project evidence.
              </p>
              <div className="space-y-1.5 pt-1">
                {report.existingStrengths.map((s, i) => (
                  <div
                    key={i}
                    className="p-2 bg-green-50 border-l-4 border-green-500 rounded-r text-xs font-medium text-slate-800"
                  >
                    ✓ {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Needs Improvement */}
            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Needs Improvement (⚠)
                </h3>
                <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded border border-amber-200">
                  {report.skills.filter((sk) => sk.status === 'needs_improvement').length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Foundational target skills to strengthen.
              </p>
              <div className="space-y-1.5 pt-1">
                {report.skills
                  .filter((sk) => sk.status === 'needs_improvement')
                  .map((sk, i) => (
                    <div
                      key={i}
                      className="p-2 bg-amber-50 border-l-4 border-amber-500 rounded-r text-xs font-medium text-amber-950"
                    >
                      ⚠ {sk.name}
                    </div>
                  ))}
              </div>
            </div>

            {/* Unknown / Not Documented */}
            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  Not In Profile (○)
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded border border-slate-200">
                  {report.skills.filter((sk) => sk.status === 'unknown').length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Zero document evidence located in vector store.
              </p>
              <div className="space-y-1.5 pt-1">
                {report.skills
                  .filter((sk) => sk.status === 'unknown')
                  .map((sk, i) => (
                    <div
                      key={i}
                      className="p-2 bg-slate-50 border-l-4 border-slate-300 rounded-r text-xs font-medium text-slate-700"
                    >
                      ○ {sk.name}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Sequenced Learning Roadmap */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              Sequenced Roadmap & Milestone Actions
            </h3>

            <div className="space-y-2.5">
              {report.learningRoadmap.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.skill}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">{item.actionableStep}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                    <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                      {item.estimatedEffort}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        item.priority === 'high'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {item.priority} Priority
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
