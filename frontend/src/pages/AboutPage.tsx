// PERITIA — About / Methodology Page
export default function AboutPage() {
  return (
    <div className="page">
      <div className="container--narrow">
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>
            About <span style={{ color: 'var(--accent)' }}>PERITIA</span>
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Methodology, architecture, and system design
          </p>
        </div>

        {/* Overview */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div className="section-heading">
            <h2>Overview</h2>
            <div className="section-heading__line" />
          </div>
          <p>
            PERITIA is an AI-powered interview preparation platform that combines Retrieval-Augmented
            Generation (RAG) with IBM watsonx.ai foundation models to deliver personalized,
            role-specific technical and behavioral interview training.
          </p>
          <p>
            Unlike generic chatbots or static question banks, PERITIA analyzes your profile,
            retrieves the most relevant interview knowledge, and generates questions and evaluations
            that are specific to your target role, experience level, and demonstrated skills.
          </p>
        </section>

        {/* Problem Statement */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div className="section-heading">
            <h2>Problem Statement</h2>
            <div className="section-heading__line" />
          </div>
          <p>
            Interview preparation is time-consuming, expensive, and rarely personalized.
            Generic question banks do not account for role specifics, experience gaps, or
            individual skill profiles. Mock interview services are costly and unavailable on demand.
          </p>
          <p>
            PERITIA addresses this gap by building a personalized, on-demand interview trainer
            that uses AI to generate, present, and evaluate interview questions tailored to each
            individual candidate.
          </p>
        </section>

        {/* RAG Pipeline */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div className="section-heading">
            <h2>RAG Pipeline</h2>
            <div className="section-heading__line" />
          </div>
          <p>
            PERITIA implements a Retrieval-Augmented Generation pipeline using FAISS for vector
            similarity search and Sentence Transformers for embedding generation.
          </p>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <h4 style={{ marginBottom: '0.75rem' }}>Pipeline Steps</h4>
            {[
              ['Knowledge Base Ingestion', 'Text files covering role-specific technical content, behavioral guidance, and interview strategies are chunked into 512-token segments.'],
              ['Embedding Generation', 'Each chunk is encoded using the all-MiniLM-L6-v2 Sentence Transformer model, producing dense 384-dimensional vector representations.'],
              ['Index Construction', 'Embeddings are stored in a FAISS IndexFlatIP (inner product) index for efficient cosine similarity search.'],
              ['Query Retrieval', 'At generation time, the candidate\'s role, experience, and skills are encoded as a query vector. The top-K most similar chunks are retrieved.'],
              ['Augmented Generation', 'Retrieved context is prepended to the system prompt before calling IBM watsonx.ai, ensuring generation is grounded in relevant knowledge.'],
            ].map(([title, desc]) => (
              <div key={title as string} style={{ marginBottom: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--accent)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{title as string}</div>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>{desc as string}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Agentic Workflow */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div className="section-heading">
            <h2>Agentic Workflow</h2>
            <div className="section-heading__line" />
          </div>

          <p>
            PERITIA is structured as an intelligent interview-training workflow rather than
            a generic question-answer chatbot. Each stage is a modular component with a clear
            responsibility.
          </p>

          {[
            ['Profile Analyzer', 'Processes user-provided name, role, experience, skills, resume text, and job description into a structured profile.'],
            ['Resume Processor', 'Heuristically extracts skills, education, projects, and technologies from resume text. Computes a role alignment score.'],
            ['Knowledge Retriever', 'Uses FAISS to retrieve the top-K most relevant knowledge base chunks for the candidate\'s query.'],
            ['Interview Planner', 'Determines appropriate question counts per category based on experience level and role.'],
            ['Question Generator', 'Constructs a comprehensive prompt combining the profile, retrieved context, and planning output. Calls IBM watsonx.ai for generation.'],
            ['Answer Evaluator', 'Receives the candidate\'s answer and constructs an evaluation prompt with retrieved context. Returns structured feedback.'],
            ['Progress Tracker', 'Maintains session scores per category and overall in TinyDB local storage.'],
          ].map(([name, desc]) => (
            <div key={name as string} className="card" style={{ marginBottom: '0.75rem', padding: '1rem 1.25rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                {name as string}
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>{desc as string}</p>
            </div>
          ))}
        </section>

        {/* Evaluation Method */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div className="section-heading">
            <h2>Evaluation Methodology</h2>
            <div className="section-heading__line" />
          </div>
          <p>
            Answer evaluation uses a 10-point rubric assessed by the IBM watsonx.ai foundation model.
            The evaluator considers:
          </p>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            <li>Completeness: coverage of key concepts expected in the answer</li>
            <li>Accuracy: technical or factual correctness</li>
            <li>Structure: logical organization and clarity</li>
            <li>Specificity: use of concrete examples and details</li>
            <li>Professional communication: appropriate tone and presentation</li>
          </ul>

          <div className="card" style={{ marginTop: '1rem' }}>
            <h4 style={{ marginBottom: '0.75rem' }}>Scoring Rubric</h4>
            {[
              ['9–10', 'Exceptional. Comprehensive, structured, with concrete examples and strong insight.'],
              ['7–8', 'Good. Covers main points with minor gaps. Demonstrates solid understanding.'],
              ['5–6', 'Adequate. Addresses the question but missing important aspects or depth.'],
              ['3–4', 'Incomplete. Significant gaps or misunderstandings present.'],
              ['1–2', 'Insufficient. Missing core concepts or fundamentally incorrect.'],
            ].map(([range, desc]) => (
              <div key={range as string} style={{ display: 'flex', gap: '1rem', marginBottom: '0.6rem', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent)', minWidth: '3rem', fontSize: '0.88rem' }}>{range as string}</span>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>{desc as string}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technology Stack */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div className="section-heading">
            <h2>Technology Stack</h2>
            <div className="section-heading__line" />
          </div>
          <div className="grid-2">
            {[
              { category: 'Frontend', items: ['React 18', 'TypeScript', 'Vite', 'React Router v6', 'Recharts', 'Axios'] },
              { category: 'Backend', items: ['Python 3.11+', 'FastAPI', 'Uvicorn', 'Pydantic v2', 'python-dotenv'] },
              { category: 'RAG / AI', items: ['FAISS (faiss-cpu)', 'Sentence Transformers', 'IBM watsonx.ai', 'meta-llama/llama-3-3-70b-instruct'] },
              { category: 'Storage', items: ['TinyDB (JSON)', 'sessionStorage (browser)'] },
              { category: 'Document Processing', items: ['PyMuPDF (PDF)', 'python-docx (DOCX)', 'Plain text fallback'] },
              { category: 'Testing', items: ['pytest', 'pytest-asyncio', 'httpx', 'FastAPI TestClient'] },
            ].map(({ category, items }) => (
              <div key={category} className="card">
                <div style={{ fontWeight: 600, marginBottom: '0.6rem', color: 'var(--text-primary)' }}>{category}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {items.map((item) => (
                    <span key={item} className="tag">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Security */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div className="section-heading">
            <h2>Security Notes</h2>
            <div className="section-heading__line" />
          </div>
          <div className="alert alert--info">
            IBM watsonx.ai credentials (API key and project ID) are loaded exclusively from
            server-side environment variables. They are never present in frontend code, browser
            storage, request logs, or repository files. The{' '}
            <code>.env</code> file is listed in <code>.gitignore</code> and must never be committed.
          </div>
          <ul style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            <li>Credentials loaded from <code>.env</code> via <code>python-dotenv</code> / <code>pydantic-settings</code></li>
            <li>No credentials in <code>.env.example</code> — only placeholder values</li>
            <li>File upload limited to 5MB, PDF/DOCX/TXT only</li>
            <li>CORS restricted to configured frontend origins</li>
          </ul>
        </section>

        {/* Limitations */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div className="section-heading">
            <h2>Limitations</h2>
            <div className="section-heading__line" />
          </div>
          <ul style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            <li>Evaluation quality depends on the IBM watsonx.ai model's capability for the domain</li>
            <li>Knowledge base covers four primary roles; other roles use general knowledge</li>
            <li>Resume parsing is heuristic and may miss structured information in complex layouts</li>
            <li>Sessions are local to the device — no cloud persistence by design</li>
            <li>Generation latency depends on watsonx.ai API response time (~10–40 seconds)</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
