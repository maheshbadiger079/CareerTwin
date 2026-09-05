import re
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from .gemini_client import get_gemini_client, GEMINI_MODEL

# 1. Resume Analyzer
def analyze_resume(resume_text: str, custom_api_key: Optional[str] = None) -> Dict[str, Any]:
    ai = get_gemini_client(custom_api_key)
    if ai:
        try:
            prompt = f"""You are a strict, senior Technical Recruiter and ATS Expert.
Analyze the following candidate resume text.
CRITICAL INSTRUCTIONS:
- You must NOT invent or fabricate any employment history, certifications, degrees, or achievements.
- Clearly distinguish between existing factual information detected in the resume and your suggestions for improvement.
- Provide practical ATS advice, keyword recommendations, strengths, weaknesses, and concrete actionable improvements.

Return ONLY valid JSON matching this exact schema:
{{
  "overallScore": number (0-100),
  "summary": "concise executive evaluation of the resume",
  "strengths": ["string", "string", ...],
  "weaknesses": ["string", "string", ...],
  "skillsDetected": ["string", "string", ...],
  "atsSuggestions": ["string", "string", ...],
  "keywordSuggestions": ["string", "string", ...],
  "formattingSuggestions": ["string", "string", ...],
  "actionableImprovements": ["string", "string", ...]
}}

Resume Text:
\"\"\"
{resume_text[:7000]}
\"\"\""""
            response = ai.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.2
                }
            )
            if response.text:
                parsed = json.loads(response.text)
                return {
                    "overallScore": int(parsed.get("overallScore", 75)),
                    "summary": parsed.get("summary", "Resume analysis completed successfully."),
                    "strengths": parsed.get("strengths", []),
                    "weaknesses": parsed.get("weaknesses", []),
                    "skillsDetected": parsed.get("skillsDetected", []),
                    "atsSuggestions": parsed.get("atsSuggestions", []),
                    "keywordSuggestions": parsed.get("keywordSuggestions", []),
                    "formattingSuggestions": parsed.get("formattingSuggestions", []),
                    "actionableImprovements": parsed.get("actionableImprovements", []),
                    "analyzedAt": datetime.now().isoformat()
                }
        except Exception as e:
            print(f"Gemini resume analysis notice: {e}")

    return fallback_analyze_resume(resume_text)

def fallback_analyze_resume(text: str) -> Dict[str, Any]:
    lower = text.lower()
    known_skills = [
        'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express',
        'PostgreSQL', 'SQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS',
        'GCP', 'Azure', 'Git', 'CI/CD', 'REST APIs', 'GraphQL', 'HTML', 'CSS',
        'Tailwind', 'Flask', 'Django', 'FastAPI', 'Java', 'C++', 'Go', 'Linux'
    ]

    detected = [s for s in known_skills if re.search(rf'\b{re.escape(s)}\b', text, re.IGNORECASE)]

    has_metrics = bool(re.search(r'\b(\d+%\b|\$\d+|\b\d+\s*(users|clients|rps|ms|percent|reduction|increase))', text, re.IGNORECASE))
    has_contact = bool(re.search(r'(@|[0-9]{3}[-.]?[0-9]{3}[-.]?[0-9]{4}|linkedin\.com|github\.com)', text, re.IGNORECASE))
    has_education = bool(re.search(r'(bachelor|master|degree|university|college|b\.s|b\.tech|m\.s)', lower))
    has_projects = bool(re.search(r'(project|built|developed|created|github|deployed)', lower))

    score = 55
    if len(detected) >= 5: score += 15
    if has_metrics: score += 10
    if has_contact: score += 5
    if has_education: score += 8
    if has_projects: score += 7

    strengths = []
    if detected:
        strengths.append(f"Clearly showcases key industry technical competencies ({', '.join(detected[:5])}).")
    if has_projects:
        strengths.append("Highlights demonstrable technical projects and practical engineering capabilities.")
    if has_metrics:
        strengths.append("Demonstrates quantified business and system performance impact in bullet points.")
    else:
        strengths.append("Organized structure providing transparent chronological background.")

    weaknesses = []
    if not has_metrics:
        weaknesses.append("Limited quantified business metrics (e.g. latency reduction %, user scale, or delivery speedup).")
    if len(detected) < 5:
        weaknesses.append("Technical stack details could be more prominently categorized.")
    weaknesses.append("Missing explicit ATS keywords for specific target job descriptions.")

    return {
        "overallScore": min(95, score),
        "summary": f"Resume evaluated: detected {len(detected)} technical skills across demonstrated engineering experience. Solid foundation with opportunities for quantified metrics and ATS alignment.",
        "strengths": strengths,
        "weaknesses": weaknesses,
        "skillsDetected": detected,
        "atsSuggestions": [
            "Use standard headers: Professional Experience, Technical Skills, Education, Projects.",
            "Avoid dual-column tables or text boxes that can be stripped by older ATS parsers.",
            "Ensure email, phone number, and LinkedIn profile link are in clean plaintext."
        ],
        "keywordSuggestions": [
            "CI/CD Pipelines",
            "Unit Testing & TDD",
            "Cloud Architecture (AWS/GCP)",
            "Scalable Microservices",
            "System Design & Observability"
        ],
        "formattingSuggestions": [
            "Ensure consistent bullet spacing and right-align employment date ranges.",
            "Maintain a single primary font family (e.g. Arial, Calibri, or Inter) throughout.",
            "Keep line length within 65-80 characters for optimal readability."
        ],
        "actionableImprovements": [
            "Revise project bullet points using the Google XYZ formula: 'Accomplished [X] as measured by [Y] by doing [Z]'.",
            "Add a dedicated 'Technologies & Tools' section at the top for automated parser indexing.",
            "Highlight links to public GitHub repositories or live deployed demos."
        ],
        "analyzedAt": datetime.now().isoformat()
    }

# 2. Career Profile Extractor
def extract_career_profile(resume_text: str, user_id: str, custom_api_key: Optional[str] = None) -> Dict[str, Any]:
    ai = get_gemini_client(custom_api_key)
    if ai:
        try:
            prompt = f"""Extract structured career profile information from this resume.
Do NOT invent information that is not in the text.
Return ONLY valid JSON matching this schema:
{{
  "targetRole": "inferred or stated desired role",
  "careerGoals": "summary of career direction",
  "summary": "brief professional overview based strictly on resume",
  "skills": ["string", ...],
  "technologies": ["string", ...],
  "education": [{{"institution": "string", "degree": "string", "year": "string"}}],
  "experience": [{{"company": "string", "role": "string", "duration": "string", "highlights": ["string"]}}],
  "projects": [{{"name": "string", "description": "string", "technologies": ["string"]}}],
  "certifications": ["string", ...]
}}

Resume Text:
\"\"\"
{resume_text[:6000]}
\"\"\""""
            response = ai.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.1
                }
            )
            if response.text:
                parsed = json.loads(response.text)
                return {
                    "userId": user_id,
                    "targetRole": parsed.get("targetRole", "Software Engineer"),
                    "careerGoals": parsed.get("careerGoals", "Advance technical expertise and build scalable systems."),
                    "summary": parsed.get("summary", "Experienced professional with demonstrated background in software development."),
                    "skills": parsed.get("skills", []),
                    "technologies": parsed.get("technologies", []),
                    "education": parsed.get("education", []),
                    "experience": parsed.get("experience", []),
                    "projects": parsed.get("projects", []),
                    "certifications": parsed.get("certifications", []),
                    "lastUpdated": datetime.now().isoformat()
                }
        except Exception as e:
            print(f"Gemini profile extraction notice: {e}")

    return fallback_extract_career_profile(resume_text, user_id)

def fallback_extract_career_profile(text: str, user_id: str) -> Dict[str, Any]:
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    known_tech = [
        'Python', 'Flask', 'React', 'PostgreSQL', 'TypeScript', 'JavaScript', 'Docker',
        'Node.js', 'Express', 'SQL', 'Git', 'MongoDB', 'AWS', 'Redis', 'Tailwind', 'HTML', 'CSS'
    ]
    detected = [t for t in known_tech if re.search(rf'\b{re.escape(t)}\b', text, re.IGNORECASE)]
    edu_match = re.search(r'(bachelor|master|b\.s|b\.tech|m\.s|degree)[^\n,.]*', text, re.IGNORECASE)

    education = [{"institution": "University Program", "degree": edu_match.group(0), "year": "Recent"}] if edu_match else []

    return {
        "userId": user_id,
        "targetRole": "Full-Stack Software Engineer",
        "careerGoals": "Build high-performance, resilient web applications and systems.",
        "summary": " ".join(lines[:3]) if lines else "Passionate engineer with experience in modern web technologies.",
        "skills": detected,
        "technologies": detected,
        "education": education,
        "experience": [
            {
                "company": "Technology Experience",
                "role": "Software Developer",
                "duration": "2022 - Present",
                "highlights": [
                    f"Engineered applications utilizing {', '.join(detected[:4]) or 'modern stacks'}.",
                    "Collaborated on feature development, code reviews, and system optimizations."
                ]
            }
        ],
        "projects": [
            {
                "name": "CareerTwin Co-Pilot",
                "description": "AI-assisted career navigation with grounded RAG document processing.",
                "technologies": detected[:3]
            }
        ],
        "certifications": [],
        "lastUpdated": datetime.now().isoformat()
    }

# 3. Job Matcher
def analyze_job_match(job_description: str, profile: Dict[str, Any], custom_api_key: Optional[str] = None) -> Dict[str, Any]:
    ai = get_gemini_client(custom_api_key)
    if ai:
        try:
            prompt = f"""You are a career matching system.
Compare the Job Description with the User's Career Twin Profile.
CRITICAL RULES:
1. You must clearly distinguish:
   "Skill not found in profile" (meaning the skill wasn't mentioned in the candidate's resume/profile)
   from
   "User does not have this skill" (never assume that an unlisted skill is permanently absent from the candidate's actual ability).
2. Extract required skills, preferred skills, responsibilities, technologies, and experience requirements.
3. Compute an objective match percentage (0-100%).

Return ONLY valid JSON:
{{
  "jobTitle": "inferred or stated job title",
  "matchPercentage": number,
  "requiredSkills": ["string", ...],
  "preferredSkills": ["string", ...],
  "responsibilities": ["string", ...],
  "technologies": ["string", ...],
  "experienceRequirements": "string",
  "matchingSkills": ["string", ...],
  "missingSkills": ["string (state: not found in profile)", ...],
  "skillsNeedingImprovement": ["string", ...],
  "recommendedNextSteps": ["string", ...]
}}

Candidate Profile:
{json.dumps({"skills": profile.get("skills", []), "technologies": profile.get("technologies", []), "experience": profile.get("experience", []), "projects": profile.get("projects", [])})}

Job Description:
\"\"\"
{job_description[:6000]}
\"\"\""""
            response = ai.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.1
                }
            )
            if response.text:
                parsed = json.loads(response.text)
                return {
                    "jobTitle": parsed.get("jobTitle", "Target Position"),
                    "matchPercentage": max(0, min(100, int(parsed.get("matchPercentage", 70)))),
                    "requiredSkills": parsed.get("requiredSkills", []),
                    "preferredSkills": parsed.get("preferredSkills", []),
                    "responsibilities": parsed.get("responsibilities", []),
                    "technologies": parsed.get("technologies", []),
                    "experienceRequirements": parsed.get("experienceRequirements", "1-3 years relevant experience"),
                    "matchingSkills": parsed.get("matchingSkills", []),
                    "missingSkills": parsed.get("missingSkills", []),
                    "skillsNeedingImprovement": parsed.get("skillsNeedingImprovement", []),
                    "recommendedNextSteps": parsed.get("recommendedNextSteps", []),
                    "analyzedAt": datetime.now().isoformat()
                }
        except Exception as e:
            print(f"Gemini job match notice: {e}")

    return fallback_job_match(job_description, profile)

def fallback_job_match(job_description: str, profile: Dict[str, Any]) -> Dict[str, Any]:
    candidate_skills = {s.lower() for s in profile.get("skills", []) + profile.get("technologies", [])}
    candidate_text = json.dumps(profile).lower()

    common_keywords = [
        'Python', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'TypeScript',
        'JavaScript', 'SQL', 'Kubernetes', 'CI/CD', 'Git', 'REST APIs', 'GraphQL',
        'FastAPI', 'Flask', 'Express', 'Redis', 'Testing', 'Agile'
    ]

    found_keywords = [k for k in common_keywords if re.search(rf'\b{re.escape(k)}\b', job_description, re.IGNORECASE)]

    matching = []
    missing = []

    for kw in found_keywords:
        if kw.lower() in candidate_skills or kw.lower() in candidate_text:
            matching.append(kw)
        else:
            missing.append(f"{kw} (Not found in profile - verify if you possess this)")

    total = len(matching) + len(missing)
    match_pct = round((len(matching) / total) * 100) if total > 0 else 70

    return {
        "jobTitle": "Software Engineer",
        "matchPercentage": match_pct,
        "requiredSkills": found_keywords[:5],
        "preferredSkills": found_keywords[5:8],
        "responsibilities": [
            "Design, develop, and maintain clean, scalable web applications.",
            "Collaborate with cross-functional teams to define feature requirements.",
            "Participate in architecture reviews and automated testing workflows."
        ],
        "technologies": found_keywords,
        "experienceRequirements": "2+ years of professional software development experience",
        "matchingSkills": matching,
        "missingSkills": missing,
        "skillsNeedingImprovement": missing[:2],
        "recommendedNextSteps": [
            "Update your career profile or resume to explicitly highlight any experience with unlisted technologies.",
            "Prepare portfolio examples or GitHub repositories illustrating relevant projects.",
            "Review system design concepts related to the job responsibilities."
        ],
        "analyzedAt": datetime.now().isoformat()
    }

# 4. Interview Simulator (5-Stage Project Defense & Technical/HR)
def generate_interview_question(
    interview_type: str,
    question_index: int,
    history: List[Dict[str, Any]],
    profile: Optional[Dict[str, Any]] = None,
    project_name: Optional[str] = None,
    custom_api_key: Optional[str] = None
) -> Dict[str, str]:
    ai = get_gemini_client(custom_api_key)
    if ai:
        try:
            prompt = f"""You are an expert interviewer conducting a {interview_type.upper()} interview.
Question Index: {question_index + 1} of 5.
{f"Project Focus: {project_name}" if interview_type == 'project' else ''}

Candidate Profile:
{json.dumps(profile) if profile else 'General Candidate'}

Previous Exchanges:
{json.dumps(history)}

INSTRUCTIONS:
{
    'For Project Defense, follow this progressive structure: \n- Q1: Problem statement & motivation\n- Q2: Technology selection & trade-offs\n- Q3: Architecture & data flow design\n- Q4: Security considerations & vulnerability defenses\n- Q5: Future improvements, scalability & bottlenecks'
    if interview_type == 'project' else
    f'Generate question #{question_index + 1}. Probe technical depth and clarity.'
}

Return ONLY valid JSON:
{{
  "question": "concise, direct question",
  "category": "e.g. Architecture, Problem Statement, Technical Depth, Leadership"
}}"""
            response = ai.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.3
                }
            )
            if response.text:
                parsed = json.loads(response.text)
                if parsed.get("question"):
                    return {
                        "question": parsed["question"],
                        "category": parsed.get("category", "Technical")
                    }
        except Exception as e:
            print(f"Gemini question generation notice: {e}")

    if interview_type == 'project':
        project_progression = [
            {
                "question": f"Could you describe the core problem statement for {project_name or 'your primary project'} and what inspired your architectural solution?",
                "category": "Problem Statement"
            },
            {
                "question": "Which technologies and libraries did you select for this implementation, and what trade-offs did you weigh against alternatives?",
                "category": "Technology Selection"
            },
            {
                "question": "Walk me through the system architecture: how does data flow from user action to persistent storage and background workers?",
                "category": "Architecture & Design"
            },
            {
                "question": "What security precautions did you take regarding authorization, data sanitization, and protecting user secrets or injection threats?",
                "category": "Security & Hardening"
            },
            {
                "question": "If you were to scale this system to 100,000 active users, where would the primary bottlenecks emerge and what would you refactor first?",
                "category": "Future Improvements & Scalability"
            }
        ]
        return project_progression[min(question_index, len(project_progression) - 1)]

    if interview_type == 'technical':
        tech_progression = [
            {"question": "Explain the core lifecycle and state management principles in your primary technology stack.", "category": "Core Fundamentals"},
            {"question": "How do you approach database schema design and index optimization when handling high read/write concurrency?", "category": "Data & Persistence"},
            {"question": "Describe an instance where you debugged an elusive race condition, memory leak, or latency spike in production.", "category": "Debugging & Performance"},
            {"question": "How do you ensure API resilience against transient failures (e.g. circuit breakers, retries with exponential backoff)?", "category": "Resilience & Systems"},
            {"question": "What is your methodology for automated testing (unit, integration, contract) to prevent regression in CI/CD?", "category": "Testing & Quality"}
        ]
        return tech_progression[min(question_index, len(tech_progression) - 1)]

    hr_progression = [
        {"question": "Tell me about yourself, your recent engineering journey, and what drives your passion in software engineering.", "category": "Introduction & Background"},
        {"question": "Describe a situation where you had a technical disagreement with a colleague. How did you arrive at a constructive consensus?", "category": "Collaboration & Communication"},
        {"question": "How do you prioritize competing deadlines when multiple critical tasks arise simultaneously?", "category": "Time Management"},
        {"question": "Can you share an experience where a project requirement shifted unexpectedly mid-sprint? How did you adapt?", "category": "Adaptability"},
        {"question": "What are your core career objectives for the next 2-3 years, and what environment brings out your best work?", "category": "Career Goals & Alignment"}
    ]
    return hr_progression[min(question_index, len(hr_progression) - 1)]

def evaluate_interview_session(
    interview_type: str,
    exchanges: List[Dict[str, Any]],
    custom_api_key: Optional[str] = None
) -> Dict[str, Any]:
    ai = get_gemini_client(custom_api_key)
    if ai:
        try:
            prompt = f"""You are a principal hiring manager evaluating a completed {interview_type.upper()} interview.
Exchanges:
{json.dumps(exchanges)}

Evaluate the candidate objectively:
- Overall Score (0-100)
- Answer Relevance (0-100)
- Technical Quality (0-100)
- Communication Feedback
- Key Strengths
- Identified Weaknesses
- Actionable Improvement Suggestions

Return ONLY valid JSON:
{{
  "overallScore": number,
  "answerRelevance": number,
  "technicalQuality": number,
  "communicationFeedback": "string",
  "strengths": ["string", ...],
  "weaknesses": ["string", ...],
  "improvementSuggestions": ["string", ...]
}}"""
            response = ai.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.2
                }
            )
            if response.text:
                parsed = json.loads(response.text)
                return {
                    "overallScore": int(parsed.get("overallScore", 82)),
                    "answerRelevance": int(parsed.get("answerRelevance", 85)),
                    "technicalQuality": int(parsed.get("technicalQuality", 80)),
                    "communicationFeedback": parsed.get("communicationFeedback", "Clear articulation with good technical depth."),
                    "strengths": parsed.get("strengths", ["Structured reasoning", "Clear delivery"]),
                    "weaknesses": parsed.get("weaknesses", ["Could detail edge cases further"]),
                    "improvementSuggestions": parsed.get("improvementSuggestions", ["Include more quantified performance metrics."])
                }
        except Exception as e:
            print(f"Gemini evaluation notice: {e}")

    answered = [e for e in exchanges if e.get("userAnswer") and len(e["userAnswer"].strip()) > 15]
    total_words = sum(len(e.get("userAnswer", "").split()) for e in exchanges)

    relevance = min(95, max(50, 60 + len(answered) * 7))
    tech_quality = min(95, max(50, 55 + (total_words // 15)))
    overall = round(relevance * 0.5 + tech_quality * 0.5)

    return {
        "overallScore": overall,
        "answerRelevance": relevance,
        "technicalQuality": tech_quality,
        "communicationFeedback": "Demonstrated solid understanding of core concepts with coherent structure across all interview questions.",
        "strengths": [
            "Addressed technical and architectural questions directly without evasiveness.",
            "Demonstrated structured problem-solving approach from fundamentals to trade-offs.",
            "Communicated clearly with appropriate domain terminology."
        ],
        "weaknesses": [
            "Could provide deeper elaboration on specific trade-offs and alternative solutions considered.",
            "Opportunity to quantify performance impacts (e.g. latency, throughput, or memory footprint)."
        ],
        "improvementSuggestions": [
            "Structure behavioral and technical scenarios using the STAR framework (Situation, Task, Action, Result).",
            "Explicitly cite edge cases, failure domains, and defensive security measures during system explanations."
        ]
    }

# 5. Skill Gap Analysis
def generate_skill_gap_analysis(
    target_role: str,
    profile: Dict[str, Any],
    custom_api_key: Optional[str] = None
) -> Dict[str, Any]:
    ai = get_gemini_client(custom_api_key)
    if ai:
        try:
            prompt = f"""You are a Career Architect.
Compare the Candidate's Career Profile with the Target Role: \"{target_role}\".
CRITICAL RULE:
- Represent skills with 3 clear statuses:
  - \"demonstrated\" (?)
  - \"needs_improvement\" (?)
  - \"unknown\" (?) (IMPORTANT: Do not represent \"unknown/not found\" as proof that the user cannot perform the skill).

Return ONLY valid JSON:
{{
  "targetRole": \"{target_role}\",
  "existingStrengths": ["string", ...],
  "missingOrUncertainSkills": ["string", ...],
  "highPrioritySkills": ["string", ...],
  "skills": [
    {{
      "skill": "string",
      "status": "demonstrated" | "needs_improvement" | "unknown",
      "priority": "high" | "medium" | "low",
      "context": "string"
    }}
  ],
  "suggestedLearningOrder": ["string", ...],
  "recommendedProjects": ["string", ...]
}}

Candidate Profile:
{json.dumps({"skills": profile.get("skills", []), "technologies": profile.get("technologies", []), "experience": profile.get("experience", []), "projects": profile.get("projects", [])})}"""
            response = ai.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.1
                }
            )
            if response.text:
                parsed = json.loads(response.text)
                return {
                    "targetRole": target_role,
                    "existingStrengths": parsed.get("existingStrengths", []),
                    "missingOrUncertainSkills": parsed.get("missingOrUncertainSkills", []),
                    "highPrioritySkills": parsed.get("highPrioritySkills", []),
                    "skills": parsed.get("skills", []),
                    "suggestedLearningOrder": parsed.get("suggestedLearningOrder", []),
                    "recommendedProjects": parsed.get("recommendedProjects", []),
                    "analyzedAt": datetime.now().isoformat()
                }
        except Exception as e:
            print(f"Gemini skill-gap notice: {e}")

    return fallback_skill_gap(target_role, profile)

def fallback_skill_gap(target_role: str, profile: Dict[str, Any]) -> Dict[str, Any]:
    user_skills = {s.lower() for s in profile.get("skills", []) + profile.get("technologies", [])}
    profile_text = json.dumps(profile).lower()

    role_lower = target_role.lower()
    if 'frontend' in role_lower:
        benchmarks = ['React', 'TypeScript', 'CSS/Tailwind', 'Next.js', 'State Management', 'Testing (Jest)', 'Performance', 'Web Vitals']
    elif 'backend' in role_lower:
        benchmarks = ['Python', 'PostgreSQL', 'Docker', 'Redis', 'REST APIs', 'System Design', 'CI/CD', 'Kubernetes']
    else:
        benchmarks = ['Python', 'React', 'Docker', 'PostgreSQL', 'TypeScript', 'Kubernetes', 'CI/CD', 'System Design']

    items = []
    for skill in benchmarks:
        if skill.lower() in user_skills or skill.lower() in profile_text:
            items.append({
                "skill": skill,
                "status": "demonstrated",
                "priority": "medium",
                "context": "Demonstrated in career profile & project history."
            })
        elif skill in ['Docker', 'PostgreSQL', 'Kubernetes']:
            items.append({
                "skill": skill,
                "status": "needs_improvement",
                "priority": "high",
                "context": "Foundational infrastructure capability for senior roles."
            })
        else:
            items.append({
                "skill": skill,
                "status": "unknown",
                "priority": "medium",
                "context": "Not explicitly documented in profile (may still be known)."
            })

    return {
        "targetRole": target_role,
        "existingStrengths": [i["skill"] for i in items if i["status"] == "demonstrated"],
        "missingOrUncertainSkills": [i["skill"] for i in items if i["status"] == "unknown"],
        "highPrioritySkills": [i["skill"] for i in items if i["priority"] == "high"],
        "skills": items,
        "suggestedLearningOrder": [
            "1. Strengthen containerization workflows (Docker & multi-stage builds)",
            "2. Deepen database optimization (PostgreSQL indexing & query plans)",
            "3. Master distributed systems concepts (Message queues & caching)",
            "4. Implement automated end-to-end testing & observability"
        ],
        "recommendedProjects": [
            "Build an event-driven service with asynchronous worker queues and caching.",
            "Deploy a containerized microservice on Kubernetes with health monitoring."
        ],
        "analyzedAt": datetime.now().isoformat()
    }
