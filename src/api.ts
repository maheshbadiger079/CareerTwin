import {
  AcceptanceReport,
  AuthResponse,
  CareerDocument,
  CareerProfile,
  DashboardStats,
  InterviewSession,
  InterviewType,
  JobMatchResult,
  RAGMessage,
  ResumeAnalysis,
  SkillGapReport,
  User,
} from './types';

const TOKEN_KEY = 'careertwin_auth_token';
const USER_KEY = 'careertwin_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set Content-Type only if not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // Clear expired session if 401
      clearAuthSession();
      window.dispatchEvent(new Event('auth-expired'));
    }
    throw new Error(data.error || `HTTP Error ${response.status}: ${response.statusText}`);
  }

  return data as T;
}

// Authentication API
export const api = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setAuthSession(res.token, res.user);
    return res;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthSession(res.token, res.user);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      clearAuthSession();
    }
  },

  // Dashboard
  async getDashboardSummary(): Promise<DashboardStats> {
    return request<DashboardStats>('/api/dashboard/summary');
  },

  // Documents
  async uploadDocument(file: File): Promise<{
    document: CareerDocument;
    analysis: ResumeAnalysis;
    profile: CareerProfile;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    return request('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  async getDocuments(): Promise<{ documents: CareerDocument[] }> {
    return request<{ documents: CareerDocument[] }>('/api/documents');
  },

  async deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/documents/${id}`, {
      method: 'DELETE',
    });
  },

  async clearKnowledgeBase(): Promise<{ success: boolean }> {
    return request('/api/knowledge-base/clear', {
      method: 'DELETE',
    });
  },

  // RAG Chat
  async sendRAGMessage(message: string): Promise<{
    answer: string;
    citations: RAGMessage['citations'];
    grounded: boolean;
  }> {
    return request('/api/rag/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  // Resume Analyzer
  async getResumeAnalysis(): Promise<ResumeAnalysis> {
    return request<ResumeAnalysis>('/api/resume/analysis');
  },

  async runResumeAnalysis(): Promise<ResumeAnalysis> {
    return request<ResumeAnalysis>('/api/resume/analyze', {
      method: 'POST',
    });
  },

  // Career Profile
  async getProfile(): Promise<{ profile: CareerProfile; isNew: boolean }> {
    return request<{ profile: CareerProfile; isNew: boolean }>('/api/profile');
  },

  async updateProfile(profile: Partial<CareerProfile>): Promise<{ success: boolean; profile: CareerProfile }> {
    return request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },

  // Job Matcher
  async analyzeJob(jobDescription: string): Promise<JobMatchResult> {
    return request<JobMatchResult>('/api/jobs/analyze', {
      method: 'POST',
      body: JSON.stringify({ jobDescription }),
    });
  },

  // Interview Simulator
  async startInterview(type: InterviewType, projectName?: string): Promise<InterviewSession> {
    return request<InterviewSession>('/api/interview/start', {
      method: 'POST',
      body: JSON.stringify({ type, projectName }),
    });
  },

  async answerInterviewQuestion(sessionId: string, answer: string): Promise<InterviewSession> {
    return request<InterviewSession>(`/api/interview/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  },

  async getInterviews(): Promise<{ interviews: InterviewSession[] }> {
    return request<{ interviews: InterviewSession[] }>('/api/interviews');
  },

  async getInterviewDetails(sessionId: string): Promise<InterviewSession> {
    return request<InterviewSession>(`/api/interview/${sessionId}`);
  },

  // Skill Gap Analysis
  async getSkillGap(targetRole?: string): Promise<SkillGapReport> {
    return request<SkillGapReport>('/api/skills/gap-analysis', {
      method: 'POST',
      body: JSON.stringify({ targetRole }),
    });
  },

  // Acceptance Tests
  async runAcceptanceTests(): Promise<AcceptanceReport> {
    return request<AcceptanceReport>('/api/tests/run', {
      method: 'POST',
    });
  },

  async getLatestTestReport(): Promise<AcceptanceReport | { message: string }> {
    return request<AcceptanceReport | { message: string }>('/api/tests/latest');
  },
};
