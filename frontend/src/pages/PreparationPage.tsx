// PERITIA — Preparation Dashboard Page
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { InterviewPreparation, InterviewQuestion } from '../types';
import QuestionCard from '../components/QuestionCard';

type TabKey = 'technical' | 'behavioral' | 'hr' | 'role_specific' | 'tips';

const TAB_CONFIG: { key: TabKey; label: string; field: keyof InterviewPreparation }[] = [
  { key: 'technical', label: 'Technical', field: 'technical_questions' },
  { key: 'behavioral', label: 'Behavioral', field: 'behavioral_questions' },
  { key: 'hr', label: 'HR', field: 'hr_questions' },
  { key: 'role_specific', label: 'Role-Specific', field: 'role_specific_questions' },
  { key: 'tips', label: 'Prep Tips', field: 'preparation_tips' },
];

export default function PreparationPage() {
  const navigate = useNavigate();
  const [preparation, setPreparation] = useState<InterviewPreparation | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('technical');

  useEffect(() => {
    const stored = sessionStorage.getItem('peritia_preparation');
    if (stored) {
      try {
        setPreparation(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem('peritia_preparation');
      }
    }
  }, []);

  const handlePractice = (q: InterviewQuestion) => {
    sessionStorage.setItem('peritia_practice_question', JSON.stringify(q));
    navigate('/practice');
  };

  if (!preparation) {
    return (
      <div className="page">
        <div className="container--narrow">
          <div className="empty-state">
            <div className="empty-state__title">No Preparation Found</div>
            <p>Complete the interview setup to generate your personalized preparation plan.</p>
            <Link to="/setup" className="btn btn--primary">
              Go to Setup
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { profile, analysis, preparation_tips } = preparation;

  const getQuestions = (tab: TabKey): InterviewQuestion[] => {
    if (tab === 'technical') return preparation.technical_questions;
    if (tab === 'behavioral') return preparation.behavioral_questions;
    if (tab === 'hr') return preparation.hr_questions;
    if (tab === 'role_specific') return preparation.role_specific_questions;
    return [];
  };

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1 style={{ marginBottom: '0.35rem' }}>
              Preparation Plan
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              {profile.name} · {profile.target_role} ·{' '}
              {profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)} Level
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/setup" className="btn btn--ghost btn--sm">
              Regenerate
            </Link>
            <Link to="/practice" className="btn btn--primary btn--sm">
              Start Practice
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid-3" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-card__label">Total Questions</div>
            <div className="stat-card__value">{preparation.total_questions}</div>
            <div className="stat-card__sub">across all categories</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__label">Role Alignment</div>
            <div className="stat-card__value" style={{ color: analysis.role_alignment_score >= 7 ? 'var(--green)' : analysis.role_alignment_score >= 5 ? 'var(--yellow)' : 'var(--red)' }}>
              {analysis.role_alignment_score.toFixed(1)}
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/10</span>
            </div>
            <div className="stat-card__sub">skills match</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__label">Skills Detected</div>
            <div className="stat-card__value">{analysis.extracted_skills.length}</div>
            <div className="stat-card__sub">from profile and resume</div>
          </div>
        </div>

        {/* Analysis Card */}
        <div className="grid-2" style={{ marginBottom: '2rem' }}>
          {analysis.key_gaps.length > 0 && (
            <div className="card">
              <div className="card__header">
                <div className="card__title">Identified Skill Gaps</div>
                <div className="card__subtitle">Focus areas for preparation</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {analysis.key_gaps.map((g) => (
                  <span key={g} className="tag tag--red">{g}</span>
                ))}
              </div>
            </div>
          )}

          {analysis.extracted_skills.length > 0 && (
            <div className="card">
              <div className="card__header">
                <div className="card__title">Detected Skills</div>
                <div className="card__subtitle">From profile and resume</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {analysis.extracted_skills.slice(0, 20).map((s) => (
                  <span key={s} className="tag tag--accent">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Question Tabs */}
        <div className="tabs">
          {TAB_CONFIG.map((tab) => {
            const count =
              tab.key === 'tips'
                ? preparation_tips.length
                : getQuestions(tab.key).length;

            return (
              <button
                key={tab.key}
                className={`tab${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {count > 0 && <span className="tab__count">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'tips' ? (
          <div>
            {preparation_tips.length === 0 ? (
              <div className="empty-state">
                <p>No preparation tips available.</p>
              </div>
            ) : (
              <ul style={{ paddingLeft: '1.5rem' }}>
                {preparation_tips.map((tip, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: '0.92rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.75rem',
                      lineHeight: 1.6,
                    }}
                  >
                    {tip}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div>
            {getQuestions(activeTab).length === 0 ? (
              <div className="empty-state">
                <p>No questions in this category.</p>
              </div>
            ) : (
              getQuestions(activeTab).map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={i}
                  onPractice={handlePractice}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
