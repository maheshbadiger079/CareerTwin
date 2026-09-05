import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api';
import { RAGMessage, SourceCitation } from '../types';
import {
  Send,
  MessageSquare,
  FileText,
  ShieldCheck,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const RAGChatView: React.FC = () => {
  const [messages, setMessages] = useState<RAGMessage[]>([
    {
      id: 'welcome_msg',
      role: 'assistant',
      content:
        "Hello! I am your CareerTwin Co-Pilot. Every answer I provide is strictly grounded in your uploaded career documents. If a skill, degree, or experience is not present in your files, I will explicitly let you know rather than guessing.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      grounded: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: RAGMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await api.sendRAGMessage(textToSend.trim());
      const botMessage: RAGMessage = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: res.citations,
        grounded: res.grounded,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error retrieving answer.';
      const errorMessage: RAGMessage = {
        id: `bot_err_${Date.now()}`,
        role: 'assistant',
        content: `Error: ${msg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        grounded: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const toggleCitation = (msgId: string) => {
    setExpandedCitations((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const sampleQueries = [
    'How many years of Python experience do I have?',
    'What programming technologies are listed in my resume?',
    'What is my Java experience?',
    'Summarize my main software engineering projects',
  ];

  return (
    <div className="p-6 space-y-3 max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-5.5rem)]">
      {/* Top Banner */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Grounded Career Chat
              <span className="text-[9px] bg-green-50 text-green-700 font-bold px-1.5 py-0.5 rounded border border-green-200 flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" /> Anti-Hallucination
              </span>
            </h1>
            <p className="text-[11px] text-slate-500">
              Only answers supported by uploaded document vectors will be returned.
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 font-medium">
          <Info className="w-3 h-3 text-blue-600 flex-shrink-0" />
          <span>Source-Attributed Citing</span>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-xs p-4 space-y-3">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const hasCitations = msg.citations && msg.citations.length > 0;
          const isExpanded = expandedCitations[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-2xl ${
                isUser ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div
                className={`p-3.5 rounded-lg text-xs leading-relaxed ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-800 border border-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                <div
                  className={`mt-1.5 flex items-center justify-between text-[10px] ${
                    isUser ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && msg.grounded && (
                    <span className="flex items-center gap-1 text-green-600 font-bold">
                      <ShieldCheck className="w-2.5 h-2.5" /> Grounded Fact
                    </span>
                  )}
                </div>
              </div>

              {/* Citations Panel */}
              {!isUser && hasCitations && (
                <div className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                  <button
                    onClick={() => toggleCitation(msg.id)}
                    className="w-full flex items-center justify-between text-slate-600 font-medium hover:text-slate-900"
                  >
                    <span className="flex items-center gap-1 font-bold text-[11px] text-blue-700">
                      <FileText className="w-3 h-3" />
                      {msg.citations!.length} Source {msg.citations!.length === 1 ? 'Citation' : 'Citations'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-1.5 space-y-1.5 pt-1.5 border-t border-slate-200">
                      {msg.citations!.map((cit, idx) => (
                        <div key={idx} className="bg-white p-2 rounded border border-slate-200">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                            <span className="font-bold text-slate-800">{cit.fileName}</span>
                            <span className="bg-green-50 text-green-700 px-1 py-0.5 rounded font-mono font-bold">
                              {cit.relevanceScore}% match
                            </span>
                          </div>
                          <p className="text-slate-700 italic text-[11px] bg-slate-50 p-1.5 rounded border border-slate-100">
                            "{cit.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Retrieving vector chunks and verifying facts...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="py-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
          Quick Tests:
        </span>
        {sampleQueries.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="whitespace-nowrap px-2.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-xs flex-shrink-0"
      >
        <input
          id="rag-query-input"
          type="text"
          placeholder="Ask a question about experience, tools, or projects..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 px-3 py-1.5 bg-transparent text-xs text-slate-800 focus:outline-none placeholder-slate-400"
        />
        <button
          id="rag-send-btn"
          type="submit"
          disabled={!input.trim() || loading}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-40"
        >
          <span>Send</span>
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
