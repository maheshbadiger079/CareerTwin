import fs from 'fs';
import path from 'path';
import {
  CareerDocument,
  CareerProfile,
  DocumentChunk,
  InterviewSession,
  ResumeAnalysis,
} from '../src/types';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface TokenRecord {
  token: string;
  userId: string;
  expiresAt: number;
}

interface DatabaseSchema {
  users: Record<string, UserRecord>;
  tokens: Record<string, TokenRecord>;
  documents: Record<string, CareerDocument>;
  chunks: Record<string, DocumentChunk>;
  profiles: Record<string, CareerProfile>;
  interviews: Record<string, InterviewSession>;
  analyses: Record<string, ResumeAnalysis>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DatabaseStore {
  private data: DatabaseSchema = {
    users: {},
    tokens: {},
    documents: {},
    chunks: {},
    profiles: {},
    interviews: {},
    analyses: {},
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (e) {
      console.warn('Database initialization error, using in-memory store:', e);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database:', e);
    }
  }

  // Users
  getUserByEmail(email: string): UserRecord | undefined {
    const normalized = email.trim().toLowerCase();
    return Object.values(this.data.users).find(
      (u) => u.email.toLowerCase() === normalized
    );
  }

  getUserById(id: string): UserRecord | undefined {
    return this.data.users[id];
  }

  createUser(user: UserRecord): UserRecord {
    this.data.users[user.id] = user;
    this.save();
    return user;
  }

  // Tokens
  saveToken(token: string, userId: string, ttlHours = 72): void {
    this.data.tokens[token] = {
      token,
      userId,
      expiresAt: Date.now() + ttlHours * 60 * 60 * 1000,
    };
    this.save();
  }

  getUserByToken(token: string): UserRecord | undefined {
    const record = this.data.tokens[token];
    if (!record) return undefined;
    if (Date.now() > record.expiresAt) {
      delete this.data.tokens[token];
      this.save();
      return undefined;
    }
    return this.getUserById(record.userId);
  }

  deleteToken(token: string): void {
    if (this.data.tokens[token]) {
      delete this.data.tokens[token];
      this.save();
    }
  }

  // Documents
  getDocuments(userId: string): CareerDocument[] {
    return Object.values(this.data.documents).filter((d) => d.userId === userId);
  }

  getDocumentById(docId: string, userId: string): CareerDocument | undefined {
    const doc = this.data.documents[docId];
    if (doc && doc.userId === userId) return doc;
    return undefined;
  }

  saveDocument(doc: CareerDocument): void {
    this.data.documents[doc.id] = doc;
    this.save();
  }

  deleteDocument(docId: string, userId: string): boolean {
    const doc = this.data.documents[docId];
    if (!doc || doc.userId !== userId) return false;

    delete this.data.documents[docId];

    // Remove all associated chunks for this document
    for (const [chunkId, chunk] of Object.entries(this.data.chunks)) {
      if (chunk.docId === docId && chunk.userId === userId) {
        delete this.data.chunks[chunkId];
      }
    }

    this.save();
    return true;
  }

  clearUserKnowledge(userId: string): void {
    for (const [docId, doc] of Object.entries(this.data.documents)) {
      if (doc.userId === userId) {
        delete this.data.documents[docId];
      }
    }
    for (const [chunkId, chunk] of Object.entries(this.data.chunks)) {
      if (chunk.userId === userId) {
        delete this.data.chunks[chunkId];
      }
    }
    this.save();
  }

  // Chunks
  saveChunks(chunks: DocumentChunk[]): void {
    for (const chunk of chunks) {
      this.data.chunks[chunk.id] = chunk;
    }
    this.save();
  }

  getChunks(userId: string): DocumentChunk[] {
    return Object.values(this.data.chunks).filter((c) => c.userId === userId);
  }

  // Profiles
  getProfile(userId: string): CareerProfile | undefined {
    return this.data.profiles[userId];
  }

  saveProfile(profile: CareerProfile): void {
    this.data.profiles[profile.userId] = profile;
    this.save();
  }

  deleteProfile(userId: string): void {
    delete this.data.profiles[userId];
    this.save();
  }

  // Resume Analyses
  getAnalysis(userId: string): ResumeAnalysis | undefined {
    return this.data.analyses[userId];
  }

  saveAnalysis(userId: string, analysis: ResumeAnalysis): void {
    this.data.analyses[userId] = analysis;
    this.save();
  }

  // Interview Sessions
  getInterviews(userId: string): InterviewSession[] {
    return Object.values(this.data.interviews)
      .filter((i) => i.userId === userId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  getInterviewById(interviewId: string, userId: string): InterviewSession | undefined {
    const interview = this.data.interviews[interviewId];
    if (interview && interview.userId === userId) return interview;
    return undefined;
  }

  saveInterview(session: InterviewSession): void {
    this.data.interviews[session.id] = session;
    this.save();
  }
}

export const db = new DatabaseStore();
