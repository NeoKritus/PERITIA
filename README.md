# PERITIA — AN AI-POWERED RAG-BASED INTELLIGENT INTERVIEW TRAINER AGENT FOR PERSONALIZED, ROLE-SPECIFIC TECHNICAL AND BEHAVIORAL INTERVIEW PREPARATION

An intelligent, end-to-end interview preparation platform that combines **Retrieval-Augmented Generation (RAG)** with **IBM watsonx.ai** foundation models to deliver personalized, role-specific technical and behavioral interview training.

---

## Problem Statement

Interview preparation is time-consuming, inconsistent, and rarely personalized:

- Generic online question banks do not account for role specifics, experience level, or individual skill gaps
- Mock interview services are expensive and unavailable on demand
- Candidates have no reliable way to evaluate their own answers and identify specific improvement areas
- Most AI chatbot solutions are not structured around an intelligent training workflow

**PERITIA solves this** by acting as an intelligent, personalized interview coach available on demand.

---

## Objectives

1. Generate role-specific, experience-appropriate interview questions using RAG + IBM watsonx.ai
2. Evaluate candidate answers with structured, constructive feedback
3. Identify skill gaps and surface relevant preparation guidance
4. Track performance progress across technical, behavioral, and HR categories
5. Support resume integration for deeper personalization
6. Provide a professional, usable software product — not a prototype

---

## Key Features

| Feature | Description |
|---|---|
| **Personalized Setup** | Name, role, experience level, skills, resume (PDF/DOCX/TXT), job description |
| **RAG Pipeline** | FAISS vector index + Sentence Transformers over a curated knowledge base |
| **IBM watsonx.ai** | `meta-llama/llama-3-3-70b-instruct` (configurable) for generation and evaluation |
| **Agentic Workflow** | Profile Analyzer → Knowledge Retriever → Interview Planner → Question Generator → Answer Evaluator |
| **Practice Mode** | One question at a time with IBM-powered scored evaluation |
| **Structured Feedback** | Score, strengths, improvements, missing points, suggested response, concise advice |
| **Progress Dashboard** | Session KPIs, per-category scores, radar chart, score history bar chart |
| **Resume Processing** | PDF, DOCX, TXT support with heuristic skill/education extraction |
| **Professional UI** | React 18, dark charcoal theme, responsive, accessible |
| **One-Command Launch** | `run_peritia.bat` starts both services, polls readiness, and opens the browser |

---

## System Architecture

```
User
 │
 ▼
PERITIA Frontend (React 18 + TypeScript · Port 3000)
 │  REST API via Vite proxy (/api → localhost:8000)
 ▼
FastAPI Backend (Python 3.11+ · Port 8000)
 ├── Profile & Resume Analyzer
 │    └── Heuristic skill/education extraction · Role alignment scoring
 ├── RAG Knowledge Retriever
 │    └── FAISS IndexFlatIP · all-MiniLM-L6-v2 embeddings · 100-char overlap chunks · top-K retrieval
 ├── Interview Intelligence Workflow
 │    ├── Interview Planner (question counts vary by experience level)
 │    ├── Question Generator (augmented prompt → IBM watsonx.ai)
 │    └── Answer Evaluator (rubric-based → IBM watsonx.ai)
 ├── Session Storage (TinyDB JSON · in-memory fallback)
 └── IBM watsonx.ai Client
      └── IAM token auth · auto-refresh · meta-llama/llama-3-3-70b-instruct
```

The architecture diagram is also saved at `docs/architecture.png`.

---

## Application Workflow

```
1. Open PERITIA at http://localhost:3000
2. Navigate to Setup → fill in profile, skills, optional resume/JD
3. Click "Generate Interview Preparation"
   → Backend: Profile Analysis → RAG Retrieval → Prompt Construction → watsonx.ai Generation
4. View Preparation Dashboard: questions by category, model answers, tips
5. Navigate to Practice → work through questions one at a time
6. Submit an answer → IBM watsonx.ai evaluates it
7. Receive structured feedback: score, strengths, gaps, suggested response, advice
8. Continue practicing or navigate to Progress Dashboard
9. View session scores, radar chart, bar chart history, evaluation table
```

---

## Agentic AI Workflow

PERITIA implements a structured, multi-stage interview training pipeline:

| Step | Module | Description |
|---|---|---|
| 01 | **Profile Analyzer** | Processes name, role, experience, skills, resume, JD into a structured summary |
| 02 | **Resume Processor** | Extracts skills, education, projects; computes role alignment score (0–10) |
| 03 | **Knowledge Retriever** | FAISS retrieves top-K relevant chunks from the knowledge base |
| 04 | **Interview Planner** | Determines question counts per category based on experience level |
| 05 | **Question Generator** | Builds augmented prompt; calls IBM watsonx.ai for personalized questions |
| 06 | **Interview Practice** | Presents one question at a time; receives candidate's answer |
| 07 | **Answer Evaluator** | Evaluates answer with rubric via IBM watsonx.ai |
| 08 | **Feedback Engine** | Returns score, strengths, improvements, missing points, advice, model response |
| 09 | **Progress Tracker** | Updates session per-category scores in TinyDB |

### Question Counts by Experience Level

| Experience | Technical | Behavioral | HR | Role-Specific | Total |
|---|---|---|---|---|---|
| Entry (0–1 yr) | 4 | 3 | 3 | 2 | 12 |
| Junior (1–2 yr) | 5 | 3 | 2 | 3 | 13 |
| Mid (3–5 yr) | 6 | 4 | 2 | 3 | 15 |
| Senior (5+ yr) | 6 | 4 | 2 | 4 | 16 |
| Lead / Principal | 5 | 4 | 2 | 5 | 16 |

---

## RAG Pipeline

```
Knowledge Base (.txt files)
       │
       ▼ Paragraph-aware chunking (≤512 chars, 100-char overlap)
       ▼ Sentence Transformer encoding (all-MiniLM-L6-v2 → 384-dim)
       ▼ L2-normalized embeddings
       ▼ FAISS IndexFlatIP (inner product = cosine similarity)
       │
   [At generation time]
       │
  Candidate query (role + level + skills)
       │ Encoded → query vector → L2 normalized
       ▼ top-K FAISS search
       ▼ Retrieved context chunks (with source label)
       ▼ Prepended to IBM watsonx.ai prompt
       ▼ Grounded, relevant generation
```

**Knowledge Base Contents:**

| File | Coverage |
|---|---|
| `software_engineer.txt` | Algorithms, OOP, system design, databases, concurrency |
| `data_analyst.txt` | SQL, statistics, A/B testing, visualization, pandas |
| `ml_engineer.txt` | Bias-variance, regularization, deep learning, MLOps |
| `web_developer.txt` | HTML/CSS, JavaScript, React, HTTP, REST, security |
| `behavioral_hr.txt` | STAR framework, behavioral Q&A, HR questions, negotiation |
| `interview_preparation.txt` | Strategies by level, system design framework, salary negotiation |

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite 5, React Router v6, Recharts, Axios, react-dropzone |
| **Backend** | Python 3.11+, FastAPI 0.111, Uvicorn, Pydantic v2, pydantic-settings |
| **RAG** | faiss-cpu, sentence-transformers (`all-MiniLM-L6-v2`), NumPy |
| **IBM AI** | IBM watsonx.ai, `meta-llama/llama-3-3-70b-instruct`, IAM token auth |
| **Storage** | TinyDB (local JSON) with in-memory fallback; browser `sessionStorage` |
| **Resume** | PyMuPDF (PDF), python-docx (DOCX), plain text (UTF-8) |
| **Testing** | pytest, pytest-asyncio, httpx, FastAPI TestClient |

---

## Project Structure

```
PERITIA/
├── run_peritia.bat            # One-command launcher (Windows): starts both services + opens browser
├── backend/
│   ├── main.py                # FastAPI app entry point; lifespan RAG pre-build
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── peritia_db.json        # TinyDB session store (auto-created)
│   ├── .env.example           # Environment variable template
│   ├── app/
│   │   ├── api/
│   │   │   ├── health.py      # GET /api/health
│   │   │   └── interview.py   # POST /prepare, /prepare-with-resume, /evaluate · GET /session/{id}
│   │   ├── core/
│   │   │   └── config.py      # pydantic-settings; loads .env; lru_cache singleton
│   │   ├── models/
│   │   │   └── schemas.py     # Pydantic v2 request/response models
│   │   └── services/
│   │       ├── interview_service.py  # Agentic workflow orchestrator
│   │       ├── rag_service.py        # FAISS RAG pipeline
│   │       ├── resume_service.py     # PDF/DOCX/TXT extraction + heuristic analysis
│   │       ├── storage_service.py    # TinyDB session CRUD with memory fallback
│   │       └── watsonx_service.py    # IBM watsonx.ai client; IAM token refresh
│   ├── data/
│   │   └── knowledge_base/    # 6 .txt knowledge base files
│   └── tests/
│       └── test_peritia.py    # 24 tests across 4 test classes
├── frontend/
│   ├── index.html             # Vite HTML entry point
│   ├── vite.config.ts         # Port 3000; proxy /api → localhost:8000
│   ├── tsconfig.json
│   ├── package.json
│   └── src/
│       ├── main.tsx           # React DOM root mount
│       ├── App.tsx            # BrowserRouter with 6 routes
│       ├── types.ts           # TypeScript interfaces (mirrors Pydantic schemas)
│       ├── components/
│       │   ├── Navbar.tsx         # Top navigation bar (6 NavLinks)
│       │   ├── QuestionCard.tsx   # Expandable question with model answer + tips
│       │   └── EvaluationResult.tsx  # Score ring + structured feedback display
│       ├── pages/
│       │   ├── HomePage.tsx       # Hero, feature cards, agentic workflow, role cards
│       │   ├── SetupPage.tsx      # Profile form, skills input, file/paste resume, JD
│       │   ├── PreparationPage.tsx # Tabbed question browser, stats, analysis cards
│       │   ├── PracticePage.tsx   # One-question-at-a-time practice loop
│       │   ├── ProgressPage.tsx   # KPI row, category bars, radar chart, bar chart, table
│       │   └── AboutPage.tsx      # Methodology, RAG pipeline, tech stack, security
│       ├── utils/
│       │   └── api.ts             # Axios client (120 s timeout), error interceptor, 4 functions
│       └── styles/
│           └── global.css         # Dark charcoal CSS custom properties + component classes
└── docs/
    ├── architecture.png           # System architecture diagram
    └── generate_architecture.py   # Diagram generator script
```

---

## API Reference

All routes are prefixed with `/api`. The backend serves interactive docs at `http://localhost:8000/api/docs` (Swagger UI) and `http://localhost:8000/api/redoc`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | System status: watsonx configured, RAG ready, model ID, version |
| `POST` | `/api/interview/prepare` | JSON body: generate personalized interview preparation |
| `POST` | `/api/interview/prepare-with-resume` | Multipart form: same as above + resume file upload (PDF/DOCX/TXT ≤ 5 MB) |
| `POST` | `/api/interview/evaluate` | JSON body: evaluate a candidate answer; updates session progress |
| `GET` | `/api/interview/session/{session_id}` | Retrieve session progress and evaluation history |

### Key Request / Response shapes

**`POST /api/interview/prepare` — request body**
```json
{
  "name": "Alex Johnson",
  "target_role": "Software Engineer",
  "experience_level": "senior",
  "skills": ["Python", "System Design", "PostgreSQL"],
  "resume_text": "...",
  "job_description": "..."
}
```
`experience_level` must be one of: `entry`, `junior`, `mid`, `senior`, `lead`.

**`POST /api/interview/evaluate` — request body**
```json
{
  "session_id": "uuid",
  "question_id": "tech_1",
  "question": "How would you design a distributed rate limiter?",
  "question_type": "technical",
  "user_answer": "I would use Redis with a sliding window algorithm..."
}
```

**`GET /api/health` — response**
```json
{
  "status": "ok",
  "watsonx_configured": true,
  "rag_ready": true,
  "model_id": "meta-llama/llama-3-3-70b-instruct",
  "version": "1.0.0"
}
```

---

## IBM watsonx.ai Integration

PERITIA uses IBM watsonx.ai as the foundation model layer for:

1. **Interview Preparation Generation** — personalized Q&A generation from RAG-augmented prompts (`max_tokens=3000`, `temperature=0.4`)
2. **Answer Evaluation** — rubric-based structured feedback on candidate answers (`max_tokens=2000`, `temperature=0.2`)

**Model:** `meta-llama/llama-3-3-70b-instruct` (configurable via `IBM_MODEL_ID`)

**Authentication:** IBM Cloud IAM token obtained from the API key at runtime. Tokens are cached for their lifetime and refreshed automatically 60 seconds before expiry.

**Endpoint:** `{IBM_URL}/ml/v1/text/chat?version={IBM_API_VERSION}`
Default: `https://eu-gb.ml.cloud.ibm.com/ml/v1/text/chat?version=2023-05-29`

The `watsonx_service.py` module is fully modular — to change the model or region, update `IBM_MODEL_ID` or `IBM_URL` in `.env`.

---

## Configuration

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```bash
# Required
IBM_API_KEY=your_ibm_api_key_here
IBM_PROJECT_ID=your_project_id_here

# Optional (defaults shown)
IBM_MODEL_ID=meta-llama/llama-3-3-70b-instruct
IBM_URL=https://eu-gb.ml.cloud.ibm.com
IBM_API_VERSION=2023-05-29
DEBUG=false
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
DB_PATH=peritia_db.json
KNOWLEDGE_BASE_PATH=data/knowledge_base
EMBEDDING_MODEL=all-MiniLM-L6-v2
TOP_K_RETRIEVAL=5
CHUNK_SIZE=512
```

**Never commit your `.env` file.** It is listed in `.gitignore`.

---

## Installation

### Prerequisites

- Python 3.11 or later
- Node.js 18 or later and npm 9 or later
- IBM Cloud account with watsonx.ai access

### 1. Clone the repository

```bash
git clone https://github.com/your-username/peritia.git
cd peritia
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env — set IBM_API_KEY and IBM_PROJECT_ID
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

---

## Running the Application

### Option A — One command (Windows)

```bat
run_peritia.bat
```

The script:
1. Checks that `py` (Python launcher) and `node` are on `PATH`
2. Clears any processes already occupying ports 8000 and 3000
3. Launches the backend in its own terminal window
4. Polls `GET /api/health` every 3 seconds (up to 60 s) until the backend is ready
5. Launches the frontend in its own terminal window
6. Opens `http://localhost:3000` in the default browser

### Option B — Manual (two terminals)

**Terminal 1 — Backend**
```bash
cd backend
uvicorn main:app --reload --port 8000
```
Backend: `http://localhost:8000`  
API docs: `http://localhost:8000/api/docs`

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```
Frontend: `http://localhost:3000`  
Vite proxies all `/api` requests to the backend automatically.

### Verify the backend

```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "watsonx_configured": true,
  "rag_ready": true,
  "model_id": "meta-llama/llama-3-3-70b-instruct",
  "version": "1.0.0"
}
```

---

## Usage

### Complete Demo Flow

1. **Open PERITIA** at `http://localhost:3000`
2. Click **Setup** in the navigation
3. Enter your name, target role (e.g. "Software Engineer"), and experience level
4. Add skills by typing and pressing Enter (or click role-specific suggestions)
5. Optionally upload your resume (drag-and-drop or browse — PDF/DOCX/TXT, max 5 MB) or paste text
6. Optionally paste a job description for additional tailoring
7. Click **Generate Interview Preparation**
8. Wait 30–60 seconds for IBM watsonx.ai to generate your questions
9. Browse the **Preparation Dashboard** — view questions by category (Technical, Behavioral, HR, Role-Specific), expand for model answers and tips
10. Click **Practice This Question** on any card, or navigate to **Practice**
11. Read the question, type your answer, and click **Submit for Evaluation**
12. Review your score, strengths, gaps, suggested response, and concise advice
13. Click **Next Question** to continue, or **Try Again** to re-answer
14. Navigate to **Progress** to view session scores, radar chart, and history

---

## Frontend Pages

| Route | Page | Description |
|---|---|---|
| `/` | Home | Hero, feature overview, agentic workflow steps, supported roles |
| `/setup` | Setup | Profile form, skills input with suggestions, resume upload/paste, JD |
| `/preparation` | Preparation | Tabbed question browser, role-alignment stats, skill gap display |
| `/practice` | Practice | One-question practice loop with answer input and AI evaluation |
| `/progress` | Progress | KPI cards, category progress bars, radar chart, bar chart, history table |
| `/about` | About | Methodology, RAG pipeline detail, evaluation rubric, tech stack, security |

---

## Interview Evaluation Method

Answers are evaluated on a 10-point scale by the IBM watsonx.ai foundation model, considering completeness, accuracy, structure, specificity, and professional communication:

| Score | Level |
|---|---|
| **9–10** | Exceptional: comprehensive, structured, with concrete examples and depth |
| **7–8** | Good: covers main points with minor gaps |
| **5–6** | Adequate: addresses the question but missing important aspects |
| **3–4** | Incomplete: significant gaps or misunderstandings |
| **1–2** | Insufficient: missing core concepts or fundamentally incorrect |

**Pass threshold:** score ≥ 6.0

**Feedback includes:**
- Overall assessment (2–3 sentences)
- Strengths (specific positives from the answer)
- Areas for improvement (specific gaps)
- Missing points (concepts not mentioned)
- Suggested response (model answer that would score 9–10)
- Concise advice (direct, actionable guidance)

---

## Testing

```bash
cd backend
pytest tests/test_peritia.py -v
```

**24 tests across 4 classes:**

| Class | Tests |
|---|---|
| `TestRAGService` | Knowledge base files present; index builds; retrieval returns relevant results; role-specific content; empty query handled gracefully |
| `TestResumeService` | Heuristic analysis with/without resume; education detection; TXT file extraction; unsupported file type returns empty string |
| `TestInterviewService` | Profile summary generation; JSON extraction from markdown-wrapped responses; raw JSON extraction; fallback preparation object; evaluation parse-error fallback; question counts by experience level |
| `TestStorageService` | Session create and retrieve; evaluation update; missing session returns `None` |
| `TestAPIEndpoints` | `GET /api/health` returns 200; empty answer rejected 400; too-short answer rejected 400; missing session 404; unconfigured watsonx raises `RuntimeError` |

---

## Example Workflow

**Candidate:** Alex Johnson, targeting Senior Software Engineer  
**Skills:** Python, Java, System Design, PostgreSQL  
**Resume:** Provided · **Job Description:** Provided

**Generated Questions (sample):**
- *Technical:* "How would you design a distributed rate limiter for a high-traffic API?" (hard)
- *Behavioral:* "Describe a time when you had to make a technical decision with incomplete information." (medium)
- *HR:* "Why are you interested in this role and company?" (easy)
- *Role-Specific:* "Walk me through your approach to database schema design for a large-scale e-commerce platform." (hard)

**Evaluation Example:**

> Candidate Answer: "I would use Redis with a sliding window algorithm to track request counts per user per minute."

> **Score: 7.5/10** — Passed  
> **Strengths:** Correctly identifies Redis as the storage layer; mentions sliding window (better than fixed window).  
> **Missing Points:** Distributed synchronization across multiple Redis instances; handling Redis failures; per-endpoint vs per-user limits.  
> **Advice:** Add discussion of Redis Cluster or Sentinel for HA, and mention how you'd handle the thundering herd problem at rate limit boundaries.

---

## Results

| Metric | Value |
|---|---|
| Tests passing | 24/24 |
| Frontend build | Production build successful (`dist/`) |
| RAG knowledge base | 6 files, ~80 chunks |
| Supported roles (deep KB) | Software Engineer, Data Analyst, ML Engineer, Web Developer |
| Question categories | Technical, Behavioral, HR, Role-Specific |
| Evaluation feedback fields | Score, Assessment, Strengths, Improvements, Missing Points, Suggested Response, Advice |
| Session storage | TinyDB JSON with automatic in-memory fallback |

---

## Limitations

- **Latency:** IBM watsonx.ai generation takes 15–60 seconds depending on token load
- **Knowledge base scope:** Four primary roles covered; general knowledge used for other roles
- **Resume parsing:** Heuristic extraction may miss information in complex PDF layouts
- **Local storage:** Sessions are device-local; no cloud synchronization
- **Evaluation subjectivity:** AI evaluation may vary slightly across requests for the same answer
- **Rate limits:** IBM watsonx.ai enforces request rate limits under heavy load

---

## Future Scope

- Multi-session history with persistent cloud storage
- Support for more roles: DevOps, Product Manager, UX Designer, Data Engineer
- Audio/video practice mode with speech-to-text
- Company-specific preparation modules (FAANG, startups, consulting)
- Peer comparison and benchmarking
- Spaced repetition for weak areas
- Integration with LinkedIn for automatic profile import
- Export of preparation plans as PDF

---

## Security Notes

- IBM watsonx.ai credentials are stored exclusively in `backend/.env` (server-side only)
- `.env` is in `.gitignore` and must **never** be committed
- No credentials appear in frontend code, browser storage, logs, screenshots, or this README
- File uploads are restricted to PDF/DOCX/TXT, max 5 MB
- CORS is restricted to configured frontend origins only (`ALLOWED_ORIGINS`)
- The `.env.example` file contains only placeholder values — never real credentials
- IAM tokens are cached in memory only; never written to disk or logs

---

## License

MIT License — see `LICENSE` for details.
