export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface DocumentChunk {
  id: string;
  docId: string;
  userId: string;
  text: string;
  chunkIndex: number;
  embedding?: number[];
}

export interface CareerDocument {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  chunkCount: number;
  charCount: number;
  previewText: string;
}

export interface SourceCitation {
  docId: string;
  fileName: string;
  chunkId: string;
  chunkIndex: number;
  snippet: string;
  relevanceScore: number;
}

export interface RAGMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: SourceCitation[];
  grounded?: boolean;
}

export interface ResumeAnalysis {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  skillsDetected: string[];
  atsSuggestions: string[];
  keywordSuggestions: string[];
  formattingSuggestions: string[];
  actionableImprovements: string[];
  analyzedAt: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  year?: string;
  gpa?: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  duration?: string;
  highlights: string[];
}

export interface ProjectItem {
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface CareerProfile {
  userId: string;
  targetRole: string;
  careerGoals: string;
  summary: string;
  skills: string[];
  technologies: string[];
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: string[];
  lastUpdated: string;
}

export interface SkillMatchInfo {
  skill: string;
  category: 'matched' | 'missing' | 'needs_improvement';
  inProfile: boolean;
  notes: string;
}

export interface JobMatchResult {
  jobTitle: string;
  matchPercentage: number;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  technologies: string[];
  experienceRequirements: string;
  matchingSkills: string[];
  missingSkills: string[];
  skillsNeedingImprovement: string[];
  recommendedNextSteps: string[];
  analyzedAt: string;
}

export type InterviewType = 'hr' | 'technical' | 'project';

export interface InterviewExchange {
  questionNumber: number;
  question: string;
  category: string;
  userAnswer?: string;
  aiFeedback?: string;
  relevanceScore?: number;
  answeredAt?: string;
}

export interface InterviewEvaluation {
  overallScore: number;
  answerRelevance: number;
  technicalQuality: number;
  communicationFeedback: string;
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
}

export interface InterviewSession {
  id: string;
  userId: string;
  type: InterviewType;
  projectName?: string;
  startedAt: string;
  completedAt?: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  exchanges: InterviewExchange[];
  evaluation?: InterviewEvaluation;
  status: 'in_progress' | 'completed';
}

export interface SkillGapItem {
  skill: string;
  status: 'demonstrated' | 'needs_improvement' | 'unknown';
  priority: 'high' | 'medium' | 'low';
  context: string;
}

export interface SkillGapReport {
  targetRole: string;
  existingStrengths: string[];
  missingOrUncertainSkills: string[];
  highPrioritySkills: string[];
  skills: SkillGapItem[];
  suggestedLearningOrder: string[];
  recommendedProjects: string[];
  analyzedAt: string;
}

export interface DashboardStats {
  careerReadinessScore: number;
  resumeUploaded: boolean;
  resumeFileName?: string;
  resumeUploadDate?: string;
  documentCount: number;
  totalChunks: number;
  interviewCount: number;
  latestInterviewScore?: number;
  detectedSkillsCount: number;
  topSkills: string[];
  profileCompletion: number;
}

export interface TestResultItem {
  id: string;
  category: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  details: string;
  durationMs: number;
}

export interface AcceptanceReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  scorePercent: number;
  finalStatus: '🟢 MVP READY' | '🟡 MVP READY WITH NON-CRITICAL ISSUES' | '🔴 MVP NOT READY';
  metrics: {
    functionalTests: string;
    authTests: string;
    groundingAccuracy: string;
    promptInjectionResisted: string;
    crossUserIsolation: string;
    dataDeletionVerified: string;
  };
  results: TestResultItem[];
}
