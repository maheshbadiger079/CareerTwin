import React, { useState } from 'react';
import { api } from '../api';
import { JobMatchResult } from '../types';
import {
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Layers,
  HelpCircle,
  FileCheck,
} from 'lucide-react';

export const JobMatchView: React.FC = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<JobMatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sampleJob = `Senior Full-Stack Engineer
Responsibilities:
- Build and maintain highly responsive web applications utilizing React and TypeScript.
- Architect scalable backend APIs using Python (FastAPI/Flask) or Node.js.
- Optimize relational databases (PostgreSQL) and implement Redis caching for high-concurrency requests.
- Deploy and manage containerized services using Docker and Kubernetes on AWS or GCP.
- Implement automated testing suites (unit, integration) and robust CI/CD pipelines.

Requirements:
- 3+ years of professional software engineering experience.
- Strong proficiency in Python, React, TypeScript, and PostgreSQL.
- Experience with Docker, cloud infrastructure (AWS/GCP), and Git.
- Excellent communication and collaborative problem-solving abilities.`;

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.analyzeJob(jobDescription);
      setResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Job analysis failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Alignment Engine
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Job Description Matcher
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare target job postings against your Career Twin profile to compute match %, identify verified skills, and isolate unconfirmed requirements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setJobDescription(sampleJob);
            setError('');
          }}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition-colors self-start sm:self-auto border border-slate-200"
        >
          Load Sample Senior Engineer Job
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Paste Target Job Description
        </label>
        <textarea
          id="job-description-input"
          rows={6}
          placeholder="Paste job posting title, responsibilities, required technical skills, and qualifications here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400 font-mono">
            {jobDescription.length} chars
          </span>
          <button
            id="job-match-btn"
            type="button"
            disabled={loading || !jobDescription.trim()}
            onClick={handleAnalyze}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>Calculate Career Match</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-4">
          {/* Match Score Banner */}
          <div className="p-4 bg-slate-900 text-white rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                Target Evaluation
              </span>
              <h2 className="text-xl font-bold mt-0.5 text-white">{result.jobTitle}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Criteria: {result.experienceRequirements}
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-800 px-4 py-2.5 rounded border border-slate-700">
              <div className="text-center">
                <span className="text-[9px] uppercase text-slate-400 font-bold block">
                  Profile Match
                </span>
                <span className="text-3xl font-light text-blue-400">
                  {result.matchPercentage}%
                </span>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div className="text-xs text-slate-300">
                <div className="text-green-400 font-semibold">✓ {result.matchingSkills.length} Matching</div>
                <div className="text-slate-400">○ {result.missingSkills.length} Unconfirmed</div>
              </div>
            </div>
          </div>

          {/* Critical Disclaimer Notice */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-600 text-xs flex items-start gap-2">
            <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 text-slate-500 mt-0.5" />
            <div className="text-[11px]">
              <strong>Standard Disclaimer:</strong> Skills marked as <em>Unconfirmed / Not Found</em> indicate they were not discovered in your profile, rather than a proven inability to perform them.
            </div>
          </div>

          {/* 2-Column Skills Breakdown with High Density Left Borders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matching Skills */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                Matching Demonstrated Skills ({result.matchingSkills.length})
              </h3>
              <div className="space-y-1.5">
                {result.matchingSkills.length > 0 ? (
                  result.matchingSkills.map((skill, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-2 bg-green-50 border-l-4 border-green-500 rounded-r text-slate-800"
                    >
                      <span className="font-medium">{skill}</span>
                      <span className="text-green-600 text-[10px] font-bold">✓ Confirmed</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No direct matching skills found.</p>
                )}
              </div>
            </div>

            {/* Missing or Unconfirmed Skills */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Unconfirmed / Not in Profile ({result.missingSkills.length})
              </h3>
              <div className="space-y-1.5">
                {result.missingSkills.length > 0 ? (
                  result.missingSkills.map((skill, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-2 bg-slate-50 border-l-4 border-slate-300 rounded-r text-slate-700"
                    >
                      <span className="font-medium">{skill}</span>
                      <span className="text-slate-400 text-[10px] font-bold">○ Not Found</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No missing skills detected.</p>
                )}
              </div>
            </div>
          </div>

          {/* Responsibilities & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Core Job Responsibilities
              </h4>
              <ul className="space-y-1">
                {result.responsibilities.map((resp, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Recommended Action Steps
              </h4>
              <div className="space-y-1.5">
                {result.recommendedNextSteps.map((step, i) => (
                  <div key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="font-bold text-blue-600">{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
