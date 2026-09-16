// PERITIA — Interview Setup Page
import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { prepareInterview } from '../utils/api';
import type { PrepareFormData, ExperienceLevel } from '../types';

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'entry', label: 'Entry Level (0–1 years)' },
  { value: 'junior', label: 'Junior (1–2 years)' },
  { value: 'mid', label: 'Mid-Level (3–5 years)' },
  { value: 'senior', label: 'Senior (5+ years)' },
  { value: 'lead', label: 'Lead / Principal' },
];

const SUGGESTED_SKILLS: Record<string, string[]> = {
  'Software Engineer': ['Python', 'Java', 'Algorithms', 'System Design', 'SQL', 'Git'],
  'Data Analyst': ['SQL', 'Python', 'Excel', 'Tableau', 'Statistics', 'Power BI'],
  'Machine Learning Engineer': ['Python', 'TensorFlow', 'PyTorch', 'scikit-learn', 'MLOps', 'SQL'],
  'Web Developer': ['JavaScript', 'React', 'Node.js', 'HTML/CSS', 'TypeScript', 'REST APIs'],
};

const ROLE_OPTIONS = Object.keys(SUGGESTED_SKILLS);

export default function SetupPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState<PrepareFormData>({
    name: '',
    target_role: params.get('role') || '',
    experience_level: 'mid',
    skills: [],
    resume_text: '',
    job_description: '',
    resume_file: null,
  });

  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeMode, setResumeMode] = useState<'file' | 'paste'>('file');

  // Auto-populate suggested skills when role changes
  useEffect(() => {
    if (form.target_role && SUGGESTED_SKILLS[form.target_role]) {
      // Only suggest if skills list is currently empty
      if (form.skills.length === 0) {
        setForm((f) => ({ ...f, skills: [] }));
      }
    }
  }, [form.target_role]);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !form.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setForm((f) => ({ ...f, skills: [...f.skills, trimmed] }));
    }
  };

  const removeSkill = (skill: string) => {
    setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
      setSkillInput('');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setForm((f) => ({ ...f, resume_file: acceptedFiles[0] }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (!form.target_role.trim()) { setError('Target role is required.'); return; }

    setLoading(true);
    try {
      const preparation = await prepareInterview(form);
      // Store in sessionStorage for other pages to consume
      sessionStorage.setItem('peritia_preparation', JSON.stringify(preparation));
      navigate('/preparation');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const suggested = SUGGESTED_SKILLS[form.target_role] || [];

  return (
    <div className="page">
      <div className="container--narrow">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Interview Setup</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Provide your profile information to generate a personalized interview
            preparation plan.
          </p>
        </div>

        {error && <div className="alert alert--error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Basic Info */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card__header">
              <div className="card__title">Profile Information</div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">
                  Your Name <span className="required">*</span>
                </label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Target Role <span className="required">*</span>
                </label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Software Engineer"
                  value={form.target_role}
                  list="role-suggestions"
                  onChange={(e) => setForm((f) => ({ ...f, target_role: e.target.value }))}
                  required
                />
                <datalist id="role-suggestions">
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r} />)}
                </datalist>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Experience Level <span className="required">*</span>
              </label>
              <select
                className="form-select"
                value={form.experience_level}
                onChange={(e) =>
                  setForm((f) => ({ ...f, experience_level: e.target.value as ExperienceLevel }))
                }
              >
                {EXPERIENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Skills */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card__header">
              <div className="card__title">Skills</div>
              <div className="card__subtitle">
                Add your technical skills. Press Enter or comma to add each skill.
              </div>
            </div>

            {form.skills.length > 0 && (
              <div className="skills-container">
                {form.skills.map((skill) => (
                  <span key={skill} className="skill-tag">
                    {skill}
                    <button
                      type="button"
                      className="skill-tag__remove"
                      onClick={() => removeSkill(skill)}
                      aria-label={`Remove ${skill}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              className="form-input"
              type="text"
              placeholder="Type a skill and press Enter…"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              onBlur={() => {
                if (skillInput.trim()) { addSkill(skillInput); setSkillInput(''); }
              }}
            />

            {suggested.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <p className="form-hint" style={{ marginBottom: '0.4rem' }}>
                  Suggested for {form.target_role}:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {suggested
                    .filter((s) => !form.skills.includes(s))
                    .map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="tag"
                        style={{ cursor: 'pointer' }}
                        onClick={() => addSkill(s)}
                      >
                        + {s}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Resume */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card__header">
              <div className="card__title">Resume</div>
              <div className="card__subtitle">
                Optional but recommended. Personalizes every question and tip.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className={`btn btn--sm ${resumeMode === 'file' ? 'btn--secondary' : 'btn--ghost'}`}
                onClick={() => setResumeMode('file')}
              >
                Upload File
              </button>
              <button
                type="button"
                className={`btn btn--sm ${resumeMode === 'paste' ? 'btn--secondary' : 'btn--ghost'}`}
                onClick={() => setResumeMode('paste')}
              >
                Paste Text
              </button>
            </div>

            {resumeMode === 'file' ? (
              <div>
                <div
                  {...getRootProps()}
                  className={`dropzone${isDragActive ? ' dropzone--active' : ''}`}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <p style={{ margin: 0 }}>Drop your resume here…</p>
                  ) : (
                    <p style={{ margin: 0 }}>
                      Drag and drop a resume file here, or click to browse
                    </p>
                  )}
                  <p className="form-hint" style={{ marginTop: '0.35rem', marginBottom: 0 }}>
                    Supported formats: PDF, DOCX, TXT · Max 5MB
                  </p>
                  {form.resume_file && (
                    <p className="dropzone__file-name">
                      Selected: {form.resume_file.name} ({(form.resume_file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
                {form.resume_file && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    style={{ marginTop: '0.5rem' }}
                    onClick={() => setForm((f) => ({ ...f, resume_file: null }))}
                  >
                    Remove File
                  </button>
                )}
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <textarea
                  className="form-textarea"
                  placeholder="Paste your resume text here…"
                  value={form.resume_text}
                  onChange={(e) => setForm((f) => ({ ...f, resume_text: e.target.value }))}
                  rows={8}
                />
              </div>
            )}
          </div>

          {/* Job Description */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card__header">
              <div className="card__title">Job Description</div>
              <div className="card__subtitle">
                Optional. Paste the job posting to tailor questions to this specific role.
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <textarea
                className="form-textarea"
                placeholder="Paste the job description here…"
                value={form.job_description}
                onChange={(e) => setForm((f) => ({ ...f, job_description: e.target.value }))}
                rows={5}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--lg"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18 }} />
                Generating Personalized Preparation…
              </>
            ) : (
              'Generate Interview Preparation'
            )}
          </button>

          {loading && (
            <p className="form-hint" style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              IBM watsonx.ai is generating your personalized questions. This may take 30–60 seconds.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
