import os
import json
import time
import streamlit as st
from datetime import datetime
from dotenv import load_dotenv

# Load local environment
load_dotenv()

# Import Python backend modules
from python_backend.rag import (
    extract_text_from_file,
    clean_text,
    chunk_text,
    execute_rag_query
)
from python_backend.analysis import (
    analyze_resume,
    extract_career_profile,
    analyze_job_match,
    generate_interview_question,
    evaluate_interview_session,
    generate_skill_gap_analysis
)
from python_backend.test_runner import run_all_acceptance_tests

# Page configuration
st.set_page_config(
    page_title="CareerTwin - AI Career Co-Pilot",
    page_icon="??",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Sleek Modern Styling
st.markdown("""
<style>
    .main-title {
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.2rem;
    }
    .sub-title {
        color: #94A3B8;
        font-size: 1.05rem;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background: #1E293B;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 1.2rem;
        text-align: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .metric-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #38BDF8;
    }
    .metric-label {
        font-size: 0.85rem;
        color: #94A3B8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .badge-pill {
        display: inline-block;
        padding: 0.25rem 0.6rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        margin-right: 0.3rem;
        margin-bottom: 0.3rem;
    }
    .badge-blue { background-color: #1E3A8A; color: #93C5FD; border: 1px solid #3B82F6; }
    .badge-green { background-color: #064E3B; color: #A7F3D0; border: 1px solid #10B981; }
    .badge-amber { background-color: #78350F; color: #FDE68A; border: 1px solid #F59E0B; }
    .citation-box {
        background: #0F172A;
        border-left: 4px solid #3B82F6;
        padding: 0.8rem;
        border-radius: 4px;
        margin-top: 0.5rem;
        font-size: 0.88rem;
        color: #CBD5E1;
    }
</style>
""", unsafe_allow_html=True)

# Initialize Session State
if "user_id" not in st.session_state:
    st.session_state.user_id = f"user_{int(time.time())}"
if "documents" not in st.session_state:
    st.session_state.documents = []
if "chunks" not in st.session_state:
    st.session_state.chunks = []
if "profile" not in st.session_state:
    st.session_state.profile = None
if "resume_analysis" not in st.session_state:
    st.session_state.resume_analysis = None
if "rag_chat_history" not in st.session_state:
    st.session_state.rag_chat_history = []
if "interview_session" not in st.session_state:
    st.session_state.interview_session = {
        "active": False,
        "type": "project",
        "projectName": "CareerTwin Co-Pilot",
        "questionIndex": 0,
        "currentQuestion": None,
        "currentCategory": None,
        "history": [],
        "evaluation": None
    }
if "acceptance_report" not in st.session_state:
    st.session_state.acceptance_report = None

# Sidebar Navigation
with st.sidebar:
    st.markdown("<h2 style='margin-bottom:0;'>?? CareerTwin</h2>", unsafe_allow_html=True)
    st.caption("Grounded AI Career Co-Pilot")
    st.divider()

    nav_choice = st.radio(
        "Navigation",
        [
            "?? Dashboard",
            "?? Resume & Knowledge Base",
            "?? Career Twin RAG Chat",
            "?? Job Matcher",
            "??? 5-Stage Interview Simulator",
            "?? Skill-Gap Roadmap",
            "?? Acceptance Test Suite",
            "?? Settings & API Key"
        ],
        index=0
    )

    st.divider()
    st.markdown("### ?? Security & Engine")
    api_key_env = os.getenv("GEMINI_API_KEY", "")
    has_api_key = bool(api_key_env and api_key_env not in ["MY_GEMINI_API_KEY", "your-gemini-api-key-here", ""])
    
    custom_key = st.session_state.get("custom_gemini_api_key", "")
    if custom_key:
        has_api_key = True

    if has_api_key:
        st.success("?? Gemini 2.5 Flash Connected", icon="?")
    else:
        st.info("?? Deterministic Fallback Engine Active (Zero-Cost / Offline)", icon="???")

    st.caption(f"Tenant Isolation: `{st.session_state.user_id[:12]}`")

# -------------------------------------------------------------
# 1. DASHBOARD
# -------------------------------------------------------------
if nav_choice == "?? Dashboard":
    st.markdown("<div class='main-title'>Career Twin Dashboard</div>", unsafe_allow_html=True)
    st.markdown("<div class='sub-title'>Your verified, strictly grounded AI career co-pilot and readiness intelligence.</div>", unsafe_allow_html=True)

    c1, c2, c3, c4 = st.columns(4)
    with c1:
        ats_score = st.session_state.resume_analysis.get("overallScore", 0) if st.session_state.resume_analysis else 0
        st.markdown(f"""
        <div class='metric-card'>
            <div class='metric-value'>{ats_score}%</div>
            <div class='metric-label'>ATS Readiness Score</div>
        </div>
        """, unsafe_allow_html=True)

    with c2:
        doc_count = len(st.session_state.documents)
        st.markdown(f"""
        <div class='metric-card'>
            <div class='metric-value'>{doc_count}</div>
            <div class='metric-label'>Indexed Documents</div>
        </div>
        """, unsafe_allow_html=True)

    with c3:
        skills_count = len(st.session_state.profile.get("skills", [])) if st.session_state.profile else 0
        st.markdown(f"""
        <div class='metric-card'>
            <div class='metric-value'>{skills_count}</div>
            <div class='metric-label'>Verified Skills</div>
        </div>
        """, unsafe_allow_html=True)

    with c4:
        interviews_done = len(st.session_state.interview_session.get("history", []))
        st.markdown(f"""
        <div class='metric-card'>
            <div class='metric-value'>{interviews_done}</div>
            <div class='metric-label'>Mock Exchanges</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("### ?? Quick Start")
    col_a, col_b = st.columns(2)
    with col_a:
        st.info("""
        **1. Upload Your Resume**:
        Head to **Resume & Knowledge Base** to parse your PDF/TXT resume into grounded vector embeddings.
        
        **2. Ask Grounded Questions**:
        Use **Career Twin RAG Chat** to verify what credentials and experience are indexed without hallucinations.
        """)
    with col_b:
        st.success("""
        **3. Match Target Jobs**:
        Compare job descriptions against your verified profile in **Job Matcher**.
        
        **4. Practice 5-Stage Project Defense**:
        Test your engineering depth in the **5-Stage Interview Simulator**.
        """)

    if st.session_state.profile:
        st.divider()
        st.markdown("### ?? Candidate Profile Summary")
        p = st.session_state.profile
        st.write(f"**Target Role:** {p.get('targetRole', 'Software Engineer')}")
        st.write(f"**Career Goals:** {p.get('careerGoals', 'Build scalable applications.')}")
        st.write(f"**Summary:** {p.get('summary', '')}")
        st.write("**Detected Skills & Tech:**")
        tags_html = "".join([f"<span class='badge-pill badge-blue'>{s}</span>" for s in p.get("skills", [])])
        st.markdown(tags_html, unsafe_allow_html=True)

# -------------------------------------------------------------
# 2. RESUME & KNOWLEDGE BASE
# -------------------------------------------------------------
elif nav_choice == "?? Resume & Knowledge Base":
    st.markdown("<div class='main-title'>Resume & Grounded Knowledge Base</div>", unsafe_allow_html=True)
    st.markdown("<div class='sub-title'>Upload candidate resumes into partitioned, strictly grounded vector spaces.</div>", unsafe_allow_html=True)

    uploaded_file = st.file_uploader("Upload Resume (PDF, TXT, MD)", type=["pdf", "txt", "md"])
    
    if uploaded_file is not None:
        if st.button("?? Parse, Chunk & Embed Resume", type="primary"):
            with st.spinner("Extracting text and generating embeddings..."):
                try:
                    bytes_data = uploaded_file.read()
                    raw_text = extract_text_from_file(bytes_data, uploaded_file.name)
                    cleaned = clean_text(raw_text)
                    doc_id = f"doc_{int(time.time())}"
                    
                    chunks = chunk_text(cleaned, doc_id, st.session_state.user_id)
                    
                    st.session_state.documents.append({
                        "id": doc_id,
                        "fileName": uploaded_file.name,
                        "charCount": len(cleaned),
                        "chunkCount": len(chunks),
                        "uploadDate": datetime.now().strftime("%Y-%m-%d %H:%M"),
                        "rawText": cleaned
                    })
                    st.session_state.chunks.extend(chunks)
                    
                    # Extract career profile and ATS analysis
                    with st.spinner("Extracting profile & running ATS evaluation..."):
                        key = st.session_state.get("custom_gemini_api_key")
                        st.session_state.profile = extract_career_profile(cleaned, st.session_state.user_id, key)
                        st.session_state.resume_analysis = analyze_resume(cleaned, key)
                        
                    st.success(f"Successfully processed `{uploaded_file.name}` into {len(chunks)} overlapping vector chunks!")
                except Exception as e:
                    st.error(f"Failed to process document: {e}")

    if st.session_state.documents:
        st.divider()
        st.markdown("### ?? Uploaded Documents")
        for doc in st.session_state.documents:
            c1, c2, c3, c4 = st.columns([3, 2, 2, 1])
            with c1: st.write(f"?? **{doc['fileName']}**")
            with c2: st.caption(f"{doc['charCount']} characters ({doc['chunkCount']} chunks)")
            with c3: st.caption(f"Uploaded: {doc['uploadDate']}")
            with c4:
                if st.button("??? Delete", key=f"del_{doc['id']}"):
                    st.session_state.chunks = [c for c in st.session_state.chunks if c["docId"] != doc["id"]]
                    st.session_state.documents = [d for d in st.session_state.documents if d["id"] != doc["id"]]
                    st.rerun()

    if st.session_state.resume_analysis:
        st.divider()
        st.markdown("### ?? ATS & Recruiter Readiness Analysis")
        res = st.session_state.resume_analysis

        score = res.get("overallScore", 70)
        score_color = "#10B981" if score >= 80 else "#F59E0B" if score >= 60 else "#EF4444"
        
        st.markdown(f"""
        <div style='background:#1E293B; border:1px solid #334155; padding:1.5rem; border-radius:12px; margin-bottom:1rem;'>
            <div style='display:flex; justify-content:space-between; align-items:center;'>
                <div>
                    <h3 style='margin:0; color:#F8FAFC;'>ATS Readiness Score</h3>
                    <p style='color:#94A3B8; margin:0.3rem 0 0 0;'>{res.get('summary', '')}</p>
                </div>
                <div style='font-size:2.5rem; font-weight:800; color:{score_color};'>
                    {score}/100
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

        col1, col2 = st.columns(2)
        with col1:
            st.markdown("#### ? Proven Strengths")
            for s in res.get("strengths", []):
                st.markdown(f"- {s}")
            
            st.markdown("#### ?? Recommended Keywords")
            kw_html = "".join([f"<span class='badge-pill badge-green'>{k}</span>" for k in res.get("keywordSuggestions", [])])
            st.markdown(kw_html, unsafe_allow_html=True)

        with col2:
            st.markdown("#### ?? ATS Improvement Areas")
            for w in res.get("weaknesses", []):
                st.markdown(f"- {w}")

            st.markdown("#### ??? Actionable Polish (Google XYZ Formula)")
            for a in res.get("actionableImprovements", []):
                st.markdown(f"- {a}")

# -------------------------------------------------------------
# 3. RAG CHAT
# -------------------------------------------------------------
elif nav_choice == "?? Career Twin RAG Chat":
    st.markdown("<div class='main-title'>Career Twin RAG Chat</div>", unsafe_allow_html=True)
    st.markdown("<div class='sub-title'>Ask strictly grounded questions about your verified career credentials and experience.</div>", unsafe_allow_html=True)

    if not st.session_state.chunks:
        st.warning("?? No documents indexed yet. Please upload a resume in **Resume & Knowledge Base** first.")

    # Display Chat History
    for msg in st.session_state.rag_chat_history:
        if msg["role"] == "user":
            with st.chat_message("user"):
                st.write(msg["content"])
        else:
            with st.chat_message("assistant"):
                st.write(msg["content"])
                if msg.get("citations"):
                    st.markdown("**Exact Grounded Citations:**")
                    for cit in msg["citations"]:
                        st.markdown(f"""
                        <div class='citation-box'>
                            <b>Source:</b> {cit['fileName']} (Chunk #{cit['chunkIndex']}, Relevance: {cit['relevanceScore']}%)<br/>
                            <i>"{cit['snippet']}"</i>
                        </div>
                        """, unsafe_allow_html=True)

    user_query = st.chat_input("Ask about your indexed resume (e.g. 'What is my Python experience?', 'What technologies are listed?')")
    if user_query:
        # Add user message
        st.session_state.rag_chat_history.append({"role": "user", "content": user_query})
        
        doc_names = {d["id"]: d["fileName"] for d in st.session_state.documents}
        key = st.session_state.get("custom_gemini_api_key")
        
        with st.spinner("Retrieving relevant chunks and generating grounded response..."):
            result = execute_rag_query(user_query, st.session_state.chunks, doc_names, key)
            
        st.session_state.rag_chat_history.append({
            "role": "assistant",
            "content": result["answer"],
            "citations": result.get("citations", []),
            "grounded": result.get("grounded", True)
        })
        st.rerun()

# -------------------------------------------------------------
# 4. JOB MATCHER
# -------------------------------------------------------------
elif nav_choice == "?? Job Matcher":
    st.markdown("<div class='main-title'>Job Description Matcher</div>", unsafe_allow_html=True)
    st.markdown("<div class='sub-title'>Compare target job descriptions against verified candidate credentials without extrapolation.</div>", unsafe_allow_html=True)

    if not st.session_state.profile:
        st.warning("?? Please upload a resume first in **Resume & Knowledge Base** to build your profile.")

    job_text = st.text_area(
        "Paste Job Description:",
        height=200,
        placeholder="Paste full job posting text here (including required skills, qualifications, and responsibilities)..."
    )

    if st.button("?? Analyze Match & Missing Skills", type="primary"):
        if not job_text.strip():
            st.error("Please paste a job description first.")
        else:
            with st.spinner("Analyzing job criteria and matching with profile..."):
                profile = st.session_state.profile or {
                    "skills": ["Python", "React", "PostgreSQL", "Git"],
                    "technologies": ["Python", "Flask", "React", "PostgreSQL"],
                    "experience": [],
                    "projects": []
                }
                key = st.session_state.get("custom_gemini_api_key")
                match_result = analyze_job_match(job_text, profile, key)
                st.session_state.job_match_result = match_result

    if "job_match_result" in st.session_state:
        res = st.session_state.job_match_result
        st.divider()
        
        match_score = res.get("matchPercentage", 0)
        color = "#10B981" if match_score >= 80 else "#F59E0B" if match_score >= 60 else "#EF4444"
        
        st.markdown(f"""
        <div style='background:#1E293B; border:1px solid #334155; padding:1.5rem; border-radius:12px; margin-bottom:1.5rem;'>
            <div style='display:flex; justify-content:space-between; align-items:center;'>
                <div>
                    <h3 style='margin:0; color:#F8FAFC;'>Target: {res.get('jobTitle', 'Software Engineer')}</h3>
                    <p style='color:#94A3B8; margin:0.3rem 0 0 0;'>Experience Requirement: {res.get('experienceRequirements', 'Not specified')}</p>
                </div>
                <div style='font-size:2.5rem; font-weight:800; color:{color};'>
                    {match_score}% Match
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

        col1, col2 = st.columns(2)
        with col1:
            st.markdown("#### ? Matching Verified Skills")
            for m in res.get("matchingSkills", []):
                st.markdown(f"- **{m}**")

            st.markdown("#### ?? Core Responsibilities Identified")
            for r in res.get("responsibilities", []):
                st.markdown(f"- {r}")

        with col2:
            st.markdown("#### ? Not Found in Profile *(Unconfirmed)*")
            for m in res.get("missingSkills", []):
                st.markdown(f"- <span style='color:#F59E0B;'>{m}</span>", unsafe_allow_html=True)

            st.markdown("#### ?? Recommended Next Steps")
            for n in res.get("recommendedNextSteps", []):
                st.markdown(f"- {n}")

# -------------------------------------------------------------
# 5. 5-STAGE INTERVIEW SIMULATOR
# -------------------------------------------------------------
elif nav_choice == "??? 5-Stage Interview Simulator":
    st.markdown("<div class='main-title'>5-Stage Progressive Project Defense & Mock Interview</div>", unsafe_allow_html=True)
    st.markdown("<div class='sub-title'>Rigorous simulated interview with stage-by-stage technical, behavioral, and architectural defense.</div>", unsafe_allow_html=True)

    session = st.session_state.interview_session

    if not session["active"]:
        st.markdown("### Configure Mock Session")
        c1, c2 = st.columns(2)
        with c1:
            int_type = st.selectbox("Interview Track", ["project", "technical", "hr"], format_func=lambda x: {
                "project": "5-Stage Progressive Project Defense",
                "technical": "Senior Technical Engineering",
                "hr": "HR & Behavioral Communication"
            }[x])
        with c2:
            proj_name = st.text_input("Project Name (for Project Defense)", value="CareerTwin Co-Pilot")

        if st.button("?? Start Interview Simulation", type="primary"):
            key = st.session_state.get("custom_gemini_api_key")
            q = generate_interview_question(int_type, 0, [], st.session_state.profile, proj_name, key)
            
            session["active"] = True
            session["type"] = int_type
            session["projectName"] = proj_name
            session["questionIndex"] = 0
            session["currentQuestion"] = q["question"]
            session["currentCategory"] = q["category"]
            session["history"] = []
            session["evaluation"] = None
            st.rerun()

    else:
        st.markdown(f"**Track:** `{session['type'].upper()}` | **Stage {session['questionIndex'] + 1} of 5:** `{session['currentCategory']}`")
        st.progress((session["questionIndex"] + 1) / 5)

        st.markdown(f"""
        <div style='background:#1E293B; border-left:5px solid #3B82F6; padding:1.2rem; border-radius:8px; margin:1rem 0;'>
            <h4 style='margin:0 0 0.5rem 0; color:#93C5FD;'>Interviewer Question #{session['questionIndex'] + 1} ({session['currentCategory']}):</h4>
            <p style='font-size:1.1rem; color:#F8FAFC; margin:0;'>{session['currentQuestion']}</p>
        </div>
        """, unsafe_allow_html=True)

        user_ans = st.text_area("Your Response:", height=150, placeholder="Type your detailed response demonstrating technical depth, architectural trade-offs, and metrics...")

        col_sub, col_reset = st.columns([4, 1])
        with col_sub:
            if st.button("?? Submit Answer", type="primary"):
                if not user_ans.strip():
                    st.warning("Please type an answer before submitting.")
                else:
                    session["history"].append({
                        "questionNumber": session["questionIndex"] + 1,
                        "question": session["currentQuestion"],
                        "category": session["currentCategory"],
                        "userAnswer": user_ans
                    })
                    
                    if session["questionIndex"] < 4:
                        session["questionIndex"] += 1
                        key = st.session_state.get("custom_gemini_api_key")
                        next_q = generate_interview_question(
                            session["type"],
                            session["questionIndex"],
                            session["history"],
                            st.session_state.profile,
                            session["projectName"],
                            key
                        )
                        session["currentQuestion"] = next_q["question"]
                        session["currentCategory"] = next_q["category"]
                        st.rerun()
                    else:
                        # Completed 5 stages -> evaluate
                        with st.spinner("Evaluating complete interview session..."):
                            key = st.session_state.get("custom_gemini_api_key")
                            eval_res = evaluate_interview_session(session["type"], session["history"], key)
                            session["evaluation"] = eval_res
                            st.rerun()

        with col_reset:
            if st.button("?? Reset Session"):
                session["active"] = False
                session["history"] = []
                session["evaluation"] = None
                st.rerun()

    # If completed and evaluated
    if session.get("evaluation"):
        st.divider()
        st.markdown("### ?? Comprehensive Interview Evaluation Scorecard")
        ev = session["evaluation"]

        c1, c2, c3 = st.columns(3)
        with c1:
            st.metric("Overall Score", f"{ev.get('overallScore', 80)}/100")
        with c2:
            st.metric("Answer Relevance", f"{ev.get('answerRelevance', 85)}/100")
        with c3:
            st.metric("Technical Quality", f"{ev.get('technicalQuality', 80)}/100")

        st.info(f"**Communication Feedback:** {ev.get('communicationFeedback', '')}")

        col_a, col_b = st.columns(2)
        with col_a:
            st.markdown("#### ? Key Strengths")
            for s in ev.get("strengths", []):
                st.markdown(f"- {s}")
        with col_b:
            st.markdown("#### ?? Growth & STAR Improvements")
            for imp in ev.get("improvementSuggestions", []):
                st.markdown(f"- {imp}")

# -------------------------------------------------------------
# 6. SKILL-GAP ROADMAP
# -------------------------------------------------------------
elif nav_choice == "?? Skill-Gap Roadmap":
    st.markdown("<div class='main-title'>Skill-Gap Analysis & Learning Roadmap</div>", unsafe_allow_html=True)
    st.markdown("<div class='sub-title'>Identify validated skills vs areas needing growth, with prioritized learning sequences.</div>", unsafe_allow_html=True)

    target_role_input = st.text_input("Target Career Role:", value="Senior Full-Stack Cloud Engineer")
    
    if st.button("?? Generate Skill Gap Breakdown", type="primary"):
        with st.spinner("Analyzing candidate profile against target role benchmark..."):
            profile = st.session_state.profile or {
                "skills": ["Python", "React", "PostgreSQL"],
                "technologies": ["Python", "React", "PostgreSQL", "Flask"],
                "experience": [],
                "projects": []
            }
            key = st.session_state.get("custom_gemini_api_key")
            report = generate_skill_gap_analysis(target_role_input, profile, key)
            st.session_state.skill_gap_report = report

    if "skill_gap_report" in st.session_state:
        rep = st.session_state.skill_gap_report
        st.divider()

        st.markdown("### ?? Skill Classification Breakdown")
        for item in rep.get("skills", []):
            status = item.get("status", "unknown")
            badge_class = "badge-green" if status == "demonstrated" else "badge-amber" if status == "needs_improvement" else "badge-blue"
            icon = "? Demonstrated" if status == "demonstrated" else "? Needs Improvement" if status == "needs_improvement" else "? Unknown / Unconfirmed"
            
            st.markdown(f"""
            <div style='background:#1E293B; border:1px solid #334155; padding:0.8rem 1rem; border-radius:8px; margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;'>
                <div>
                    <b>{item.get('skill', '')}</b> &nbsp;
                    <span class='badge-pill {badge_class}'>{icon}</span>
                </div>
                <div style='color:#94A3B8; font-size:0.85rem;'>{item.get('context', '')}</div>
            </div>
            """, unsafe_allow_html=True)

        st.divider()
        col1, col2 = st.columns(2)
        with col1:
            st.markdown("#### ??? Prioritized Learning Order")
            for step in rep.get("suggestedLearningOrder", []):
                st.markdown(f"- {step}")
        with col2:
            st.markdown("#### ??? Recommended Portfolio Projects")
            for proj in rep.get("recommendedProjects", []):
                st.markdown(f"- {proj}")

# -------------------------------------------------------------
# 7. ACCEPTANCE TEST SUITE
# -------------------------------------------------------------
elif nav_choice == "?? Acceptance Test Suite":
    st.markdown("<div class='main-title'>Automated MVP Acceptance Test Suite</div>", unsafe_allow_html=True)
    st.markdown("<div class='sub-title'>Live verification runner covering authentication, cross-tenant isolation, RAG grounding defense, and data lifecycle.</div>", unsafe_allow_html=True)

    if st.button("?? Run Full Acceptance Test Suite (15 Tests)", type="primary"):
        with st.spinner("Executing live assertion suite across all modules..."):
            report = run_all_acceptance_tests()
            st.session_state.acceptance_report = report

    if st.session_state.acceptance_report:
        rep = st.session_state.acceptance_report
        st.divider()

        status_color = "#10B981" if rep["scorePercent"] == 100 else "#F59E0B"
        st.markdown(f"""
        <div style='background:#1E293B; border:1px solid #334155; padding:1.5rem; border-radius:12px; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center;'>
            <div>
                <h3 style='margin:0; color:#F8FAFC;'>Suite Status: {rep['finalStatus']}</h3>
                <p style='color:#94A3B8; margin:0.3rem 0 0 0;'>Total Tests: {rep['totalTests']} | Passed: {rep['passed']} | Failed: {rep['failed']}</p>
            </div>
            <div style='font-size:2.5rem; font-weight:800; color:{status_color};'>
                {rep['scorePercent']}%
            </div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("### ?? Detailed Test Results")
        for t in rep.get("results", []):
            passed = t["status"] == "passed"
            icon = "? PASS" if passed else "? FAIL"
            color = "#10B981" if passed else "#EF4444"
            
            with st.expander(f"{icon} [{t['id']}] {t['name']} ({t['durationMs']}ms)"):
                st.write(f"**Category:** {t['category']}")
                st.write(f"**Details:** {t['details']}")

# -------------------------------------------------------------
# 8. SETTINGS
# -------------------------------------------------------------
elif nav_choice == "?? Settings & API Key":
    st.markdown("<div class='main-title'>Settings & AI Engine Configuration</div>", unsafe_allow_html=True)
    st.markdown("<div class='sub-title'>Manage your Gemini API key and tenant session workspace.</div>", unsafe_allow_html=True)

    st.markdown("### ?? Google Gemini API Key")
    key_input = st.text_input(
        "Enter Gemini API Key (Optional):",
        value=st.session_state.get("custom_gemini_api_key", os.getenv("GEMINI_API_KEY", "")),
        type="password",
        help="If not provided, the application runs reliably using its deterministic analytical engine."
    )
    if st.button("?? Save Key"):
        st.session_state.custom_gemini_api_key = key_input.strip()
        st.success("API Key saved for current session!")

    st.divider()
    st.markdown("### ?? Workspace Session Reset")
    if st.button("??? Reset Current Session & Knowledge Base", type="secondary"):
        st.session_state.documents = []
        st.session_state.chunks = []
        st.session_state.profile = None
        st.session_state.resume_analysis = None
        st.session_state.rag_chat_history = []
        st.session_state.interview_session = {
            "active": False,
            "type": "project",
            "projectName": "CareerTwin Co-Pilot",
            "questionIndex": 0,
            "currentQuestion": None,
            "currentCategory": None,
            "history": [],
            "evaluation": None
        }
        st.success("Session reset complete.")
        st.rerun()
