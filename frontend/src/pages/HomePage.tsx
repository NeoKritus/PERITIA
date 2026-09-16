// PERITIA — Home Page
import { Link } from 'react-router-dom';

const FEATURES = [
  {
    title: 'Role-Specific Preparation',
    description:
      'Personalized question sets tailored to your target role, experience level, and technology stack.',
  },
  {
    title: 'RAG Knowledge Retrieval',
    description:
      'Retrieval-Augmented Generation surfaces the most relevant interview knowledge before every generation.',
  },
  {
    title: 'IBM watsonx.ai Evaluation',
    description:
      'Enterprise-grade foundation models evaluate your answers and provide structured, actionable feedback.',
  },
  {
    title: 'Practice Mode',
    description:
      'One-question-at-a-time practice with scored evaluation covering strengths, gaps, and model responses.',
  },
  {
    title: 'Resume Integration',
    description:
      'Upload your resume (PDF, DOCX, TXT) or paste text to personalize every question and tip.',
  },
  {
    title: 'Progress Dashboard',
    description:
      'Track technical, behavioral, and HR performance across your practice sessions.',
  },
];

const ROLES = [
  'Software Engineer',
  'Data Analyst',
  'Machine Learning Engineer',
  'Web Developer',
];

const WORKFLOW_STEPS = [
  { step: '01', label: 'User Profile Analysis' },
  { step: '02', label: 'Resume & Role Analysis' },
  { step: '03', label: 'Knowledge Retrieval' },
  { step: '04', label: 'Interview Planning' },
  { step: '05', label: 'Question Generation' },
  { step: '06', label: 'Interview Practice' },
  { step: '07', label: 'Answer Evaluation' },
  { step: '08', label: 'Personalized Feedback' },
  { step: '09', label: 'Progress Tracking' },
];

export default function HomePage() {
  return (
    <div className="page">
      {/* Hero */}
      <div className="container--narrow" style={{ textAlign: 'center', paddingTop: '3rem', paddingBottom: '3.5rem' }}>
        <div
          style={{
            display: 'inline-block',
            background: 'var(--accent-muted)',
            border: '1px solid var(--accent)',
            borderRadius: '100px',
            padding: '0.25rem 0.9rem',
            fontSize: '0.8rem',
            color: '#c49a5a',
            letterSpacing: '0.06em',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
          }}
        >
          AI-Powered Interview Trainer
        </div>

        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          <span style={{ color: 'var(--accent)' }}>PERITIA</span>
        </h1>

        <p
          style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            maxWidth: '560px',
            margin: '0 auto 0.75rem',
            lineHeight: 1.7,
          }}
        >
          An intelligent interview preparation platform that uses Retrieval-Augmented
          Generation and IBM watsonx.ai to deliver personalized, role-specific
          technical and behavioral interview training.
        </p>

        <p
          style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2.5rem' }}
        >
          Supports Software Engineering · Data Analysis · Machine Learning · Web Development
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/setup" className="btn btn--primary btn--lg">
            Begin Preparation
          </Link>
          <Link to="/about" className="btn btn--ghost btn--lg">
            Learn the Methodology
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="container" style={{ marginBottom: '4rem' }}>
        <div className="section-heading">
          <h2>Core Capabilities</h2>
          <div className="section-heading__line" />
        </div>

        <div className="grid-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                {f.title}
              </h4>
              <p style={{ fontSize: '0.88rem', margin: 0 }}>{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Agentic Workflow */}
      <div className="container" style={{ marginBottom: '4rem' }}>
        <div className="section-heading">
          <h2>Agentic Workflow</h2>
          <div className="section-heading__line" />
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          {WORKFLOW_STEPS.map((ws, idx) => (
            <div
              key={ws.step}
              style={{
                flex: '1 1 200px',
                padding: '1.25rem',
                borderRight: idx < WORKFLOW_STEPS.length - 1 ? '1px solid var(--border)' : 'none',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: 'var(--accent)',
                  marginBottom: '0.3rem',
                }}
              >
                STEP {ws.step}
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {ws.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supported Roles */}
      <div className="container" style={{ marginBottom: '4rem' }}>
        <div className="section-heading">
          <h2>Supported Roles</h2>
          <div className="section-heading__line" />
        </div>

        <div className="grid-2">
          {ROLES.map((role) => (
            <Link
              key={role}
              to={`/setup?role=${encodeURIComponent(role)}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card"
                style={{
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                  borderColor: 'var(--border)',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = 'var(--accent)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = 'var(--border)')
                }
              >
                <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{role}</h4>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Start preparation →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="container--narrow" style={{ textAlign: 'center' }}>
        <div
          className="card"
          style={{ padding: '2.5rem', border: '1px solid var(--accent-muted)' }}
        >
          <h3 style={{ marginBottom: '0.75rem' }}>Ready to prepare?</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Enter your profile, skills, and optional resume. PERITIA will generate
            a personalized preparation plan and practice questions.
          </p>
          <Link to="/setup" className="btn btn--primary btn--lg">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
