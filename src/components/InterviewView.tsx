import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { InterviewSession, InterviewType } from '../types';
import {
  Mic,
  Send,
  Sparkles,
  Shield,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Code,
  Briefcase,
  History,
} from 'lucide-react';

export const InterviewView: React.FC = () => {
  const [selectedType, setSelectedType] = useState<InterviewType>('technical');
  const [projectName, setProjectName] = useState('CareerTwin AI Co-Pilot');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [history, setHistory] = useState<InterviewSession[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPastInterviews = async () => {
    try {
      const res = await api.getInterviews();
      setHistory(res.interviews);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadPastInterviews();
  }, []);

  const handleStart = async () => {
    setError('');
    setLoading(true);
    try {
      const newSession = await api.startInterview(
        selectedType,
        selectedType === 'project' ? projectName : undefined
      );
      setSession(newSession);
      setUserAnswer('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start interview.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!session || !userAnswer.trim()) return;
    setError('');
    setLoading(true);

    try {
      const updated = await api.answerInterviewQuestion(session.id, userAnswer.trim());
      setSession(updated);
      setUserAnswer('');
      if (updated.status === 'completed') {
        loadPastInterviews();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit answer.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const currentExchange = session?.exchanges[session.currentQuestionIndex];

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Simulation Engine
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Interview Simulator & 5-Stage Project Defense
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Progressive technical drills, system design defenses, and behavioral evaluations.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Start / Selection Mode if not in active session */}
      {!session || session.status === 'completed' ? (
        <div className="space-y-4">
          {session && session.status === 'completed' && session.evaluation && (
            /* Completed Session Report */
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                    Evaluation Complete
                  </span>
                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    Performance Summary ({session.type.toUpperCase()} Mode)
                  </h2>
                </div>
                <div className="flex items-center gap-3 bg-slate-900 text-white px-3 py-1.5 rounded border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Overall Score</span>
                  <span className="text-2xl font-light text-blue-400">
                    {session.evaluation.overallScore}/100
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Answer Relevance
                  </span>
                  <div className="text-xl font-light text-slate-900 mt-0.5">
                    {session.evaluation.answerRelevance}%
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Technical Depth
                  </span>
                  <div className="text-xl font-light text-slate-900 mt-0.5">
                    {session.evaluation.technicalQuality}%
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Communication Feedback
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {session.evaluation.communicationFeedback}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Strengths */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Demonstrated Strengths</h4>
                  <div className="space-y-1.5">
                    {session.evaluation.strengths.map((str, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2 bg-green-50 border-l-4 border-green-500 rounded-r text-slate-800 flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Recommended Improvements</h4>
                  <div className="space-y-1.5">
                    {session.evaluation.improvements.map((imp, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2 bg-amber-50 border-l-4 border-amber-500 rounded-r text-slate-800 flex items-start gap-2"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSession(null)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded transition-colors"
              >
                Start Another Simulation
              </button>
            </div>
          )}

          {/* Setup new session */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Select Simulation Track
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Technical */}
              <button
                type="button"
                onClick={() => setSelectedType('technical')}
                className={`p-3.5 rounded-lg border text-left transition-all ${
                  selectedType === 'technical'
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-7 h-7 rounded bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
                  <Code className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900">Technical Depth</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Deep questions targeting languages, algorithms, data stores, and framework trade-offs.
                </p>
              </button>

              {/* Project Defense */}
              <button
                type="button"
                onClick={() => setSelectedType('project')}
                className={`p-3.5 rounded-lg border text-left transition-all ${
                  selectedType === 'project'
                    ? 'border-purple-600 bg-purple-50/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-7 h-7 rounded bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900">5-Stage Project Defense</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Progresses through problem, stack, architecture, security, and scaling trade-offs.
                </p>
              </button>

              {/* Behavioral */}
              <button
                type="button"
                onClick={() => setSelectedType('behavioral')}
                className={`p-3.5 rounded-lg border text-left transition-all ${
                  selectedType === 'behavioral'
                    ? 'border-emerald-600 bg-emerald-50/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-7 h-7 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900">HR & Behavioral (STAR)</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Evaluates situation handling, cross-functional collaboration, and communication.
                </p>
              </button>
            </div>

            {selectedType === 'project' && (
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Target Project Name to Defend
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Distributed In-Memory Cache"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            )}

            <button
              id="start-interview-btn"
              type="button"
              disabled={loading}
              onClick={handleStart}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Begin 5-Question Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Active Interview In-Progress */
        <div className="space-y-4">
          {/* Stepper Header */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {session.type.toUpperCase()} Track
              </span>
              <span className="text-xs font-bold text-slate-800">
                Question {session.currentQuestionIndex + 1} of {session.totalQuestions}
              </span>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: session.totalQuestions }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < session.currentQuestionIndex
                      ? 'bg-green-500'
                      : i === session.currentQuestionIndex
                      ? 'bg-blue-600 ring-2 ring-blue-200'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Active Question Box */}
          {currentExchange && (
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">
                  <Mic className="w-3 h-3" />
                  <span>
                    Interviewer Question ({currentExchange.stage || `Stage ${currentExchange.questionNumber}`})
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {currentExchange.question}
                </p>
              </div>

              {/* User Answer Area */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Your Answer
                </label>
                <textarea
                  id="interview-answer-input"
                  rows={5}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Provide your structured response with technical trade-offs..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {userAnswer.length} chars
                  </span>
                  <button
                    id="submit-interview-answer-btn"
                    type="button"
                    disabled={loading || !userAnswer.trim()}
                    onClick={handleSubmitAnswer}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Submit Answer</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
