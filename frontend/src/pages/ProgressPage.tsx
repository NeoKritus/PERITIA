// PERITIA — Progress & Performance Dashboard
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import type { SessionProgress, InterviewPreparation } from '../types';
import { getSessionProgress } from '../utils/api';

export default function ProgressPage() {
  const [progress, setProgress] = useState<SessionProgress | null>(null);
  const [preparation, setPreparation] = useState<InterviewPreparation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('peritia_preparation');
    if (stored) {
      try {
        const prep: InterviewPreparation = JSON.parse(stored);
        setPreparation(prep);
        fetchProgress(prep.session_id);
      } catch { /* ignore */ }
    }
  }, []);

  const fetchProgress = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSessionProgress(sessionId);
      setProgress(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load progress.');
    } finally {
      setLoading(false);
    }
  };

  if (!preparation) {
    return (
      <div className="page">
        <div className="container--narrow">
          <div className="empty-state">
            <div className="empty-state__title">No Session Found</div>
            <p>Complete the interview setup to start tracking your progress.</p>
            <Link to="/setup" className="btn btn--primary">Go to Setup</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading progress data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="container--narrow">
          <div className="alert alert--error">{error}</div>
          <Link to="/practice" className="btn btn--primary">Go to Practice</Link>
        </div>
      </div>
    );
  }

  // Show pre-practice summary if no evaluations yet
  if (!progress || progress.questions_attempted === 0) {
    return (
      <div className="page">
        <div className="container">
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ marginBottom: '0.35rem' }}>Progress Dashboard</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              {preparation.profile.name} · {preparation.profile.target_role}
            </p>
          </div>

          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <div className="stat-card">
              <div className="stat-card__label">Target Role</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                {preparation.profile.target_role}
              </div>
              <div className="stat-card__sub">
                {preparation.profile.experience_level} level
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card__label">Questions Ready</div>
              <div className="stat-card__value">{preparation.total_questions}</div>
              <div className="stat-card__sub">across all categories</div>
            </div>

            <div className="stat-card">
              <div className="stat-card__label">Practice Completed</div>
              <div className="stat-card__value">0</div>
              <div className="stat-card__sub">no attempts yet</div>
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Start Practicing to Track Progress</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Answer questions in Practice mode to see your scores, strengths, and areas for improvement.
            </p>
            <Link to="/practice" className="btn btn--primary btn--lg">Begin Practice Session</Link>
          </div>
        </div>
      </div>
    );
  }

  const passRate = progress.questions_attempted > 0
    ? Math.round((progress.questions_passed / progress.questions_attempted) * 100)
    : 0;

  // Radar chart data
  const radarData = [
    { subject: 'Technical', score: progress.technical_score || 0, fullMark: 10 },
    { subject: 'Behavioral', score: progress.behavioral_score || 0, fullMark: 10 },
    { subject: 'HR', score: progress.hr_score || 0, fullMark: 10 },
  ].filter((d) => d.score > 0);

  // History bar chart
  const historyData = progress.evaluations.slice(-10).map((e, i) => ({
    name: `Q${i + 1}`,
    score: e.score,
    type: e.type,
  }));

  const SCORE_COLOR = (score: number) =>
    score >= 7 ? '#4a7a5a' : score >= 5 ? '#8b7a40' : '#8b3a3a';

  return (
    <div className="page">
      <div className="container">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1 style={{ marginBottom: '0.35rem' }}>Progress Dashboard</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              {progress.user_name} · {progress.target_role} · {progress.experience_level} level
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/practice" className="btn btn--primary btn--sm">
              Continue Practice
            </Link>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => fetchProgress(preparation.session_id)}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid-3" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-card__label">Overall Score</div>
            <div
              className="stat-card__value"
              style={{ color: SCORE_COLOR(progress.overall_score) }}
            >
              {progress.overall_score.toFixed(1)}
              <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/10</span>
            </div>
            <div className="stat-card__sub">weighted average</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__label">Questions Attempted</div>
            <div className="stat-card__value">{progress.questions_attempted}</div>
            <div className="stat-card__sub">
              {progress.questions_passed} passed ({passRate}%)
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__label">Pass Rate</div>
            <div
              className="stat-card__value"
              style={{ color: passRate >= 60 ? '#4a7a5a' : '#8b7a40' }}
            >
              {passRate}
              <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>%</span>
            </div>
            <div className="stat-card__sub">score ≥ 6 to pass</div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid-2" style={{ marginBottom: '2rem' }}>
          <div className="card">
            <div className="card__header">
              <div className="card__title">Performance by Category</div>
            </div>

            {[
              { label: 'Technical', score: progress.technical_score },
              { label: 'Behavioral', score: progress.behavioral_score },
              { label: 'HR', score: progress.hr_score },
            ].map(({ label, score }) => (
              <div key={label} style={{ marginBottom: '1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    marginBottom: '0.35rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span>{label}</span>
                  <span style={{ color: score > 0 ? SCORE_COLOR(score) : 'var(--text-muted)', fontWeight: 600 }}>
                    {score > 0 ? `${score.toFixed(1)}/10` : '—'}
                  </span>
                </div>
                <div className="score-bar">
                  <div
                    className="score-bar__fill"
                    style={{
                      width: `${(score / 10) * 100}%`,
                      background: SCORE_COLOR(score),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {radarData.length >= 2 && (
            <div className="card">
              <div className="card__header">
                <div className="card__title">Skill Radar</div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#2e2e35" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#9e9b96', fontSize: 12 }}
                  />
                  <Radar
                    dataKey="score"
                    stroke="#8b6f47"
                    fill="#8b6f47"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* History Chart */}
        {historyData.length > 1 && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card__header">
              <div className="card__title">Recent Scores</div>
              <div className="card__subtitle">Last {historyData.length} answers</div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={historyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e35" />
                <XAxis dataKey="name" tick={{ fill: '#9e9b96', fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fill: '#9e9b96', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#222226',
                    border: '1px solid #2e2e35',
                    borderRadius: 8,
                    color: '#e8e6e1',
                    fontSize: 12,
                  }}
                  formatter={(val: number) => [`${val.toFixed(1)}/10`, 'Score']}
                />
                <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                  {historyData.map((entry, index) => (
                    <Cell key={index} fill={SCORE_COLOR(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Evaluation History Table */}
        {progress.evaluations.length > 0 && (
          <div className="card">
            <div className="card__header">
              <div className="card__title">Evaluation History</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.85rem',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Type', 'Score', 'Status', 'Time'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '0.5rem 0.75rem',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {progress.evaluations.map((ev, i) => (
                    <tr
                      key={i}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <span className={`type-badge type-badge--${ev.type}`}>
                          {ev.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '0.6rem 0.75rem',
                          fontWeight: 600,
                          color: SCORE_COLOR(ev.score),
                        }}
                      >
                        {ev.score.toFixed(1)}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <span className={`tag ${ev.passed ? 'tag--green' : 'tag--red'}`}>
                          {ev.passed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
