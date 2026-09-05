import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { CareerDocument, ResumeAnalysis } from '../types';
import {
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Award,
  AlertTriangle,
  Lightbulb,
  Tag,
  FileType,
} from 'lucide-react';

export const ResumeView: React.FC = () => {
  const [documents, setDocuments] = useState<CareerDocument[]>([]);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const docRes = await api.getDocuments();
      setDocuments(docRes.documents);

      try {
        const anaRes = await api.getResumeAnalysis();
        setAnalysis(anaRes);
      } catch {
        setAnalysis(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load documents.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (file: File) => {
    setError('');
    setSuccessMsg('');

    // Format validation
    const validExtensions = ['.pdf', '.txt', '.md'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setError(`Invalid file type. Supported formats are: PDF (.pdf), Plain Text (.txt), or Markdown (.md).`);
      return;
    }

    // Size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError(`File exceeds the maximum limit of 10MB. Please select a smaller file.`);
      return;
    }

    try {
      setUploading(true);
      const res = await api.uploadDocument(file);
      setSuccessMsg(`Successfully uploaded and indexed "${file.name}" into ${res.document.chunkCount} vector chunks.`);
      setDocuments((prev) => [res.document, ...prev]);
      if (res.analysis) {
        setAnalysis(res.analysis);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (docId: string, fileName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}" and all associated vector chunks?`)) {
      return;
    }
    try {
      await api.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setSuccessMsg(`Document "${fileName}" and all its vector chunks were completely removed.`);
      if (documents.length <= 1) {
        setAnalysis(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete document.';
      setError(msg);
    }
  };

  const handleReanalyze = async () => {
    try {
      setAnalyzing(true);
      setError('');
      const res = await api.runResumeAnalysis();
      setAnalysis(res);
      setSuccessMsg('Resume analysis refreshed with latest insights.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed.';
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Untrusted Data Sandbox
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Isolated Vector Store
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Resume & Knowledge Base
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest and normalize PDF, TXT, or MD files into partitioned vector embeddings.
          </p>
        </div>

        {documents.length > 0 && (
          <button
            onClick={handleReanalyze}
            disabled={analyzing}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Analyzing...' : 'Re-Run ATS Audit'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Zone */}
      <div
        id="resume-dropzone"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`p-6 rounded-lg border-2 border-dashed transition-all text-center ${
          dragActive
            ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,text/plain,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-2">
          {uploading ? (
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-blue-600" />
          )}
        </div>

        <h3 className="text-sm font-bold text-slate-800">
          {uploading ? 'Processing & Indexing Chunks...' : 'Drag & drop your resume, or select file'}
        </h3>
        <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
          Supported: <strong>PDF</strong>, <strong>TXT</strong>, or <strong>MD</strong> (Max 10MB). Automatically chunked and embedded into private vector space.
        </p>

        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded shadow-xs transition-colors disabled:opacity-50"
        >
          Select File from Computer
        </button>
      </div>

      {/* Active Knowledge-Base Documents List */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Active Knowledge-Base Documents ({documents.length})
          </h2>
          <span className="text-[10px] text-slate-400">Isolated per User ID</span>
        </div>

        {loading ? (
          <div className="py-6 text-center text-slate-400 text-xs">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-slate-200 rounded-lg">
            <FileText className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-700">No documents in your knowledge base yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Upload a resume above to begin grounding the AI.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                    DOC
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{doc.fileName}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span className="font-semibold text-blue-600">{doc.chunkCount} chunks</span>
                      <span>•</span>
                      <span>{doc.charCount} chars</span>
                      <span>•</span>
                      <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleDelete(doc.id, doc.fileName)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete document and erase all vector chunks"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resume Analyzer Section */}
      {analysis && (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Verified ATS Audit
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">Resume Analysis & Recruiter Evaluation</h2>
              <p className="text-[11px] text-slate-500">
                Audited against industry parsing benchmarks without fabricating credentials.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall ATS Score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-light text-slate-900">{analysis.overallScore}</span>
                <span className="text-[10px] text-slate-400 font-bold">/100</span>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Executive Summary</h3>
            <p className="text-xs text-slate-800 leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Detected Skills */}
          {analysis.skillsDetected && analysis.skillsDetected.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-blue-600" />
                Detected Skills ({analysis.skillsDetected.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {analysis.skillsDetected.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses 2-Column Grid with High Density Left Borders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2">Demonstrated Strengths</h4>
              <div className="space-y-1.5">
                {analysis.strengths.map((str, i) => (
                  <div key={i} className="text-xs p-2 bg-green-50 border-l-4 border-green-500 rounded-r text-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2">Priority Risks & Gaps</h4>
              <div className="space-y-1.5">
                {analysis.weaknesses.map((wk, i) => (
                  <div key={i} className="text-xs p-2 bg-amber-50 border-l-4 border-amber-500 rounded-r text-slate-800 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>{wk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ATS Suggestions & Keyword Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                ATS Suggestions
              </h4>
              <ul className="space-y-1">
                {analysis.atsSuggestions.map((sug, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                Recommended Keywords
              </h4>
              <div className="flex flex-wrap gap-1">
                {analysis.keywordSuggestions.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-purple-50 text-purple-800 text-[11px] font-semibold rounded border border-purple-200"
                  >
                    + {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actionable Improvements in Dark Slate Card */}
          <div className="p-4 bg-slate-900 text-white rounded-lg shadow-xs">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              Prioritized Actionable Improvements
            </h4>
            <div className="space-y-1.5">
              {analysis.actionableImprovements.map((imp, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-200">
                  <span className="font-bold text-blue-400">{i + 1}.</span>
                  <span>{imp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
