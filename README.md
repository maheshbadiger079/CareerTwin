# CareerTwin - Grounded AI Career Co-Pilot

CareerTwin is a full-stack AI career platform featuring strictly grounded RAG resume intelligence, job description matching, progressive interview simulations, skill-gap roadmaps, and isolated user data architectures.

---

## 🎯 Key Features

1. **Strictly Grounded RAG Knowledge Base**:
   - Parses PDF, TXT, and Markdown resumes into overlapping chunks.
   - Embeds text into isolated vector spaces partitioned by `userId`.
   - Anti-hallucination prompt defense: If a skill or experience is not present in uploaded documents, CareerTwin explicitly responds that it cannot be found.
   - Citations show the exact chunk snippet, document name, and relevance match %.

2. **Untrusted Data Sandbox & Prompt Injection Defense**:
   - Resumes and documents are treated as untrusted data inside protected `<candidate_document_content>` boundaries.
   - Injection commands such as *"IGNORE ALL PREVIOUS INSTRUCTIONS"* are sanitized and ignored.

3. **ATS & Recruiter Resume Analyzer**:
   - Automatically computes an objective ATS readiness score (0-100).
   - Identifies proven strengths, formatting risks, missing metrics, and recommended keywords.
   - Never fabricates credentials, employment history, or achievements.

4. **Job Description Matcher**:
   - Extracts required skills, preferred skills, and experience criteria.
   - Computes match percentage.
   - Explicitly distinguishes *"Not found in profile"* from *"User cannot perform skill"*.

5. **5-Stage Project Defense & Interview Simulator**:
   - HR Behavioral, Technical Engineering, and 5-stage progressive Project Defense:
     1. Problem Statement & Motivation
     2. Technology Selection & Trade-offs
     3. Architecture & Data Flow
     4. Security Considerations & Hardening
     5. Future Improvements & Scalability
   - Automatic scoring across relevance, technical quality, communication, and actionable suggestions.

6. **Skill-Gap Analysis**:
   - Maps candidate skills into Demonstrated (✓), Needs Improvement (⚠), and Unknown/Unconfirmed (○).
   - Generates a prioritized learning sequence and recommended portfolio projects.

7. **Automated MVP Acceptance Suite**:
   - Built-in verification runner covering authentication, user isolation, RAG grounding, prompt injection defense, document lifecycle, and cleanup.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS 4, Lucide Icons, Motion
- **Backend**: Node.js, Express, Multer, PDF-Parse, PBKDF2 cryptography
- **AI & RAG Engine**: Google GenAI SDK (`@google/genai` with `gemini-3.8-flash`), deterministic 128-dimensional vector embedding engine with cosine similarity and BM25 hybrid ranking
- **Data Isolation**: Partitioned file & in-memory JSON database (`data/db.json`) ensuring 100% tenant separation by account ID.

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
- Node.js (v18 or v20+ recommended)
- npm (v9+)

### 2. Clone and Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your environment keys:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
```
*(Note: If no Gemini API key is provided, the application will automatically operate using its deterministic offline analytical fallback engine without crashing or incurring charges).*

### 4. Run in Development Mode
```bash
npm run dev
```
The server and client will start on `http://localhost:3000`.

### 5. Run Linter & Type Check
```bash
npm run lint
```

### 6. Production Build & Execution
```bash
npm run build
npm start
```

---

## 🧪 Running Acceptance Tests

You can run the full automated verification suite directly from the UI:
1. Navigate to the **Acceptance Suite** tab in the top navigation.
2. Click **Run All Acceptance Tests**.
3. Inspect live assertions covering authentication, cross-user isolation, known vs unknown RAG grounding, prompt injection defense, and vector cleanup.
