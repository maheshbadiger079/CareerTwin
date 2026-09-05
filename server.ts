import express, { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import {
  AuthenticatedRequest,
  generateToken,
  hashPassword,
  requireAuth,
  sanitizeUser,
  verifyPassword,
} from './server/auth';
import {
  chunkText,
  cleanText,
  executeRAGQuery,
  extractTextFromBuffer,
} from './server/rag';
import {
  analyzeJobMatch,
  analyzeResume,
  evaluateInterviewSession,
  extractCareerProfile,
  generateInterviewQuestion,
  generateSkillGapAnalysis,
} from './server/careerAnalysis';
import { runAllAcceptanceTests } from './server/testRunner';
import { CareerDocument, DashboardStats, InterviewSession } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Multer in-memory storage for uploads (10MB max limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Cache latest acceptance test report
let latestAcceptanceReport: unknown = null;

// ==========================================
// 1. HEALTH & METRICS ENDPOINTS
// ==========================================
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ==========================================
// 2. AUTHENTICATION ENDPOINTS
// ==========================================
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: 'All fields (name, email, password) are required.' });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (String(password).length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existing = db.getUserByEmail(cleanEmail);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const { hash, salt } = hashPassword(String(password));
    const userId = `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const userRecord = db.createUser({
      id: userId,
      email: cleanEmail,
      name: String(name).trim(),
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
    });

    const token = generateToken();
    db.saveToken(token, userId);

    res.status(201).json({
      user: sanitizeUser(userRecord),
      token,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed.';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const userRecord = db.getUserByEmail(cleanEmail);
    if (!userRecord) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isValid = verifyPassword(String(password), userRecord.passwordHash, userRecord.salt);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken();
    db.saveToken(token, userRecord.id);

    res.json({
      user: sanitizeUser(userRecord),
      token,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login failed.';
    res.status(500).json({ error: msg });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.token) {
    db.deleteToken(req.token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ==========================================
// 3. DASHBOARD SUMMARY ENDPOINT
// ==========================================
app.get('/api/dashboard/summary', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const docs = db.getDocuments(userId);
  const chunks = db.getChunks(userId);
  const profile = db.getProfile(userId);
  const interviews = db.getInterviews(userId);
  const analysis = db.getAnalysis(userId);

  const completedInterviews = interviews.filter((i) => i.status === 'completed' && i.evaluation);
  const latestScore = completedInterviews.length > 0 ? completedInterviews[0].evaluation?.overallScore : undefined;

  // Real statistics, genuine empty state when no data exists
  let readinessScore = 0;
  if (docs.length > 0) readinessScore += 35;
  if (profile && profile.skills.length > 0) readinessScore += 25;
  if (analysis && analysis.overallScore) readinessScore += 20;
  if (completedInterviews.length > 0) readinessScore += 20;

  const topSkills = profile?.skills?.slice(0, 8) || analysis?.skillsDetected?.slice(0, 8) || [];

  const summary: DashboardStats = {
    careerReadinessScore: Math.min(100, readinessScore),
    resumeUploaded: docs.length > 0,
    resumeFileName: docs.length > 0 ? docs[0].fileName : undefined,
    resumeUploadDate: docs.length > 0 ? docs[0].uploadDate : undefined,
    documentCount: docs.length,
    totalChunks: chunks.length,
    interviewCount: completedInterviews.length,
    latestInterviewScore: latestScore,
    detectedSkillsCount: topSkills.length,
    topSkills,
    profileCompletion: profile ? (profile.skills.length > 0 && profile.experience.length > 0 ? 85 : 45) : (docs.length > 0 ? 30 : 0),
  };

  res.json(summary);
});

// ==========================================
// 4. DOCUMENT UPLOAD & MANAGEMENT
// ==========================================
app.post(
  '/api/documents/upload',
  requireAuth,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No file was uploaded. Please select a valid PDF, TXT, or Markdown document.' });
        return;
      }

      const userId = req.user!.id;
      const fileName = file.originalname;
      const mimeType = file.mimetype;

      // Extract text
      const rawText = await extractTextFromBuffer(file.buffer, mimeType, fileName);
      const cleaned = cleanText(rawText);

      if (cleaned.length < 30) {
        res.status(400).json({ error: 'The uploaded file does not contain sufficient readable text.' });
        return;
      }

      // Generate Document record
      const docId = `doc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const chunks = chunkText(cleaned, docId, userId);

      const docRecord: CareerDocument = {
        id: docId,
        userId,
        fileName,
        fileSize: file.size,
        mimeType,
        uploadDate: new Date().toISOString(),
        chunkCount: chunks.length,
        charCount: cleaned.length,
        previewText: cleaned.substring(0, 300) + '...',
      };

      // Save document & chunks
      db.saveDocument(docRecord);
      db.saveChunks(chunks);

      // Automatically run analysis & extract profile in background
      const analysis = await analyzeResume(cleaned);
      db.saveAnalysis(userId, analysis);

      const existingProfile = db.getProfile(userId);
      if (!existingProfile || existingProfile.skills.length === 0) {
        const extractedProfile = await extractCareerProfile(cleaned, userId);
        db.saveProfile(extractedProfile);
      }

      res.status(201).json({
        success: true,
        document: docRecord,
        analysis,
        profile: db.getProfile(userId),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process document.';
      res.status(400).json({ error: msg });
    }
  }
);

app.get('/api/documents', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const docs = db.getDocuments(req.user!.id);
  res.json({ documents: docs });
});

app.delete('/api/documents/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const docId = req.params.id;
  const userId = req.user!.id;
  const deleted = db.deleteDocument(docId, userId);
  if (!deleted) {
    res.status(404).json({ error: 'Document not found or unauthorized.' });
    return;
  }
  res.json({ success: true, message: 'Document and its vector embeddings have been completely deleted.' });
});

app.delete('/api/knowledge-base/clear', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  db.clearUserKnowledge(userId);
  res.json({ success: true, message: 'Knowledge base completely cleared.' });
});

// ==========================================
// 5. GROUNDED RAG CHAT
// ==========================================
app.post('/api/rag/chat', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || String(message).trim().length === 0) {
      res.status(400).json({ error: 'Query message cannot be empty.' });
      return;
    }

    const userId = req.user!.id;
    const userChunks = db.getChunks(userId);
    const userDocs = db.getDocuments(userId);

    if (userDocs.length === 0 || userChunks.length === 0) {
      res.json({
        answer: 'You have not uploaded a resume yet. Please upload your resume in the Resume section so I can answer questions grounded strictly in your verified career history.',
        citations: [],
        grounded: false,
      });
      return;
    }

    const docNames: Record<string, string> = {};
    for (const doc of userDocs) {
      docNames[doc.id] = doc.fileName;
    }

    const result = await executeRAGQuery(String(message), userChunks, docNames);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error processing RAG query.';
    res.status(500).json({ error: msg });
  }
});

// ==========================================
// 6. RESUME ANALYZER
// ==========================================
app.get('/api/resume/analysis', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const analysis = db.getAnalysis(userId);
  if (!analysis) {
    res.status(404).json({ error: 'No resume analysis available yet. Please upload a resume first.' });
    return;
  }
  res.json(analysis);
});

app.post('/api/resume/analyze', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const docs = db.getDocuments(userId);
    const chunks = db.getChunks(userId);

    if (docs.length === 0 || chunks.length === 0) {
      res.status(400).json({ error: 'No resume document found. Please upload a resume to analyze.' });
      return;
    }

    const fullText = chunks.map((c) => c.text).join('\n\n');
    const analysis = await analyzeResume(fullText);
    db.saveAnalysis(userId, analysis);

    res.json(analysis);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Analysis failed.';
    res.status(500).json({ error: msg });
  }
});

// ==========================================
// 7. CAREER PROFILE (CAREER TWIN)
// ==========================================
app.get('/api/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const profile = db.getProfile(userId);
  if (!profile) {
    res.json({
      profile: {
        userId,
        targetRole: 'Software Engineer',
        careerGoals: '',
        summary: '',
        skills: [],
        technologies: [],
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        lastUpdated: new Date().toISOString(),
      },
      isNew: true,
    });
    return;
  }
  res.json({ profile, isNew: false });
});

app.put('/api/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const payload = req.body;
    const updatedProfile = {
      ...payload,
      userId,
      lastUpdated: new Date().toISOString(),
    };
    db.saveProfile(updatedProfile);
    res.json({ success: true, profile: updatedProfile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update profile.';
    res.status(500).json({ error: msg });
  }
});

app.delete('/api/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  db.deleteProfile(userId);
  res.json({ success: true, message: 'Career profile deleted successfully.' });
});

// ==========================================
// 8. JOB DESCRIPTION ANALYZER
// ==========================================
app.post('/api/jobs/analyze', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription || String(jobDescription).trim().length < 20) {
      res.status(400).json({ error: 'Please provide a comprehensive job description (at least 20 characters).' });
      return;
    }

    const userId = req.user!.id;
    let profile = db.getProfile(userId);
    if (!profile) {
      profile = {
        userId,
        targetRole: 'Software Engineer',
        careerGoals: '',
        summary: '',
        skills: [],
        technologies: [],
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    const result = await analyzeJobMatch(String(jobDescription), profile);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Job match analysis failed.';
    res.status(500).json({ error: msg });
  }
});

// ==========================================
// 9. INTERVIEW SIMULATOR & PROJECT DEFENSE
// ==========================================
app.post('/api/interview/start', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type = 'technical', projectName } = req.body;
    const userId = req.user!.id;
    const profile = db.getProfile(userId);

    const firstQuestion = await generateInterviewQuestion(
      type,
      0,
      [],
      profile || undefined,
      projectName
    );

    const sessionId = `interview_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const session: InterviewSession = {
      id: sessionId,
      userId,
      type,
      projectName: type === 'project' ? projectName || 'Featured Project' : undefined,
      startedAt: new Date().toISOString(),
      currentQuestionIndex: 0,
      totalQuestions: 5,
      status: 'in_progress',
      exchanges: [
        {
          questionNumber: 1,
          question: firstQuestion.question,
          category: firstQuestion.category,
        },
      ],
    };

    db.saveInterview(session);
    res.status(201).json(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to start interview.';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/interview/:id/answer', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionId = req.params.id;
    const { answer } = req.body;
    const userId = req.user!.id;

    if (!answer || String(answer).trim().length === 0) {
      res.status(400).json({ error: 'Answer cannot be empty.' });
      return;
    }

    const session = db.getInterviewById(sessionId, userId);
    if (!session) {
      res.status(404).json({ error: 'Interview session not found or unauthorized.' });
      return;
    }

    if (session.status === 'completed') {
      res.status(400).json({ error: 'This interview session has already been completed.' });
      return;
    }

    const currentExchange = session.exchanges[session.currentQuestionIndex];
    currentExchange.userAnswer = String(answer).trim();
    currentExchange.answeredAt = new Date().toISOString();

    const nextIndex = session.currentQuestionIndex + 1;

    if (nextIndex < session.totalQuestions) {
      // Generate next question
      const profile = db.getProfile(userId);
      const nextQ = await generateInterviewQuestion(
        session.type,
        nextIndex,
        session.exchanges,
        profile || undefined,
        session.projectName
      );

      session.currentQuestionIndex = nextIndex;
      session.exchanges.push({
        questionNumber: nextIndex + 1,
        question: nextQ.question,
        category: nextQ.category,
      });

      db.saveInterview(session);
      res.json(session);
    } else {
      // Completed! Generate full evaluation
      const evaluation = await evaluateInterviewSession(session.type, session.exchanges);
      session.evaluation = evaluation;
      session.status = 'completed';
      session.completedAt = new Date().toISOString();

      db.saveInterview(session);
      res.json(session);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to process answer.';
    res.status(500).json({ error: msg });
  }
});

app.get('/api/interviews', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const interviews = db.getInterviews(req.user!.id);
  res.json({ interviews });
});

app.get('/api/interview/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const session = db.getInterviewById(req.params.id, req.user!.id);
  if (!session) {
    res.status(404).json({ error: 'Interview not found.' });
    return;
  }
  res.json(session);
});

// ==========================================
// 10. SKILL-GAP ANALYSIS
// ==========================================
app.post('/api/skills/gap-analysis', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetRole } = req.body;
    const userId = req.user!.id;
    let profile = db.getProfile(userId);
    if (!profile) {
      profile = {
        userId,
        targetRole: targetRole || 'Senior Software Engineer',
        careerGoals: '',
        summary: '',
        skills: [],
        technologies: [],
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    const report = await generateSkillGapAnalysis(targetRole || profile.targetRole || 'Full Stack Engineer', profile);
    res.json(report);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Skill-gap analysis failed.';
    res.status(500).json({ error: msg });
  }
});

// ==========================================
// 11. ACCEPTANCE VERIFICATION TEST RUNNER
// ==========================================
app.post('/api/tests/run', async (_req: Request, res: Response) => {
  try {
    const report = await runAllAcceptanceTests();
    latestAcceptanceReport = report;
    res.json(report);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to run acceptance tests.';
    res.status(500).json({ error: msg });
  }
});

app.get('/api/tests/latest', (_req: Request, res: Response) => {
  if (latestAcceptanceReport) {
    res.json(latestAcceptanceReport);
  } else {
    res.json({ message: 'No test run yet. Click Run Acceptance Tests to execute the full evaluation suite.' });
  }
});

// ==========================================
// 12. VITE MIDDLEWARE & SERVER STARTUP
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CareerTwin Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
