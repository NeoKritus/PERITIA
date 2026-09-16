// PERITIA — Interview Practice Page (one question at a time)
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { evaluateAnswer } from '../utils/api';
import type {
  InterviewPreparation,
  InterviewQuestion,
  AnswerEvaluation,
} from '../types';
import EvaluationResult from '../components/EvaluationResult';

type Stage = 'answer' | 'evaluating' | 'feedback';

export default function PracticePage() {
  const [preparation, setPreparation] = useState<InterviewPreparation | null>(null);
  const [allQuestions, setAllQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [stage, setStage] = useState<Stage>('answer');
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [sessionScore, setSessionScore] = useState({ total: 0, count: 0 });

  useEffect(() => {
    const stored = sessionStorage.getItem('peritia_preparation');
    if (stored) {
      try {
        const prep: InterviewPreparation = JSON.parse(stored);
        setPreparation(prep);

        // Flatten questions: technical first, then behavioral, hr, role_specific
        const questions = [
          ...prep.technical_questions,
          ...prep.behavioral_questions,
          ...prep.hr_questions,
          ...prep.role_specific_questions,
        ];
        setAllQuestions(questions);

        // Check if a specific question was requested from the preparation page
        const pracQ = sessionStorage.getItem('peritia_practice_question');
        if (pracQ) {
          try {
            const q: InterviewQuestion = JSON.parse(pracQ);
            const idx = questions.findIndex((item) => item.id === q.id);
            if (idx >= 0) setCurrentIndex(idx);
            sessionStorage.removeItem('peritia_practice_question');
          } catch { /* ignore */ }
        }
      } catch {
        sessionStorage.removeItem('peritia_preparation');
      }
    }
  }, []);

  const currentQuestion = allQuestions[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || answer.trim().length < 10) {
      setError('Please provide a more detailed answer (at least 10 characters).');
      return;
    }
    if (!currentQuestion || !preparation) return;

    setError(null);
    setStage('evaluating');

    try {
      const result = await evaluateAnswer({
        session_id: preparation.session_id,
        question_id: currentQuestion.id,
        question: currentQuestion.question,
        question_type: currentQuestion.type,
        user_answer: answer.trim(),
      });

      setEvaluation(result);
      setStage('feedback');
      setSessionScore((prev) => ({
        total: prev.total + result.overall_score,
        count: prev.count + 1,
      }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Evaluation failed.');
      setStage('answer');
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 >= allQuestions.length) {
      setCompleted(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setAnswer('');
      setEvaluation(null);
      setStage('answer');
      setError(null);
    }
  };

  const handleRepeatQuestion = () => {
    setAnswer('');
    setEvaluation(null);
    setStage('answer');
    setError(null);
  };

  if (!preparation || allQuestions.length === 0) {
    return (
      <div className="page">
        <div className="container--narrow">
          <div className="empty-state">
            <div className="empty-state__title">No Questions Available</div>
            <p>Complete the interview setup first to generate your practice questions.</p>
            <Link to="/setup" className="btn btn--primary">
              Go to Setup
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (completed) {
    const avgScore = sessionScore.count > 0
      ? (sessionScore.total / sessionScore.count).toFixed(1)
      : '—';

    return (
      <div className="page">
        <div className="container--narrow" style={{ textAlign: 'center' }}>
          <div className="card" style={{ padding: '3rem 2rem' }}>
            <h2 style={{ marginBottom: '0.75rem' }}>Practice Session Complete</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              You completed {sessionScore.count} question{sessionScore.count !== 1 ? 's' : ''} in this session.
            </p>

            <div
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem 2.5rem',
                marginBottom: '2rem',
              }}
            >
              <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Session Average
              </span>
              <span style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                {avgScore}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/10</span>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/progress" className="btn btn--primary">
                View Full Progress
              </Link>
              <button
                className="btn btn--secondary"
                onClick={() => {
                  setCurrentIndex(0);
                  setCompleted(false);
                  setAnswer('');
                  setEvaluation(null);
                  setStage('answer');
                  setSessionScore({ total: 0, count: 0 });
                }}
              >
                Practice Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container--narrow">
        {/* Progress Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h1 style={{ marginBottom: '0.2rem', fontSize: '1.5rem' }}>Interview Practice</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {preparation.profile.target_role} · {preparation.profile.experience_level} level
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>
              Question{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{currentIndex + 1}</strong>
              {' '}/{' '}{allQuestions.length}
            </span>
            {sessionScore.count > 0 && (
              <span
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.8rem',
                }}
              >
                Avg: {(sessionScore.total / sessionScore.count).toFixed(1)}/10
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="score-bar" style={{ marginBottom: '2rem' }}>
          <div
            className="score-bar__fill"
            style={{ width: `${((currentIndex) / allQuestions.length) * 100}%` }}
          />
        </div>

        {error && <div className="alert alert--error" role="alert">{error}</div>}

        {/* Question */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className={`type-badge type-badge--${currentQuestion.type}`}>
                {currentQuestion.type.replace('_', ' ').toUpperCase()}
              </span>
              <span className={`difficulty difficulty--${currentQuestion.difficulty}`}>
                {currentQuestion.difficulty.toUpperCase()}
              </span>
              <span className="tag" style={{ fontSize: '0.75rem' }}>
                {currentQuestion.topic}
              </span>
            </div>

            <p
              style={{
                fontSize: '1.05rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {currentQuestion.question}
            </p>
          </div>
        </div>

        {/* Answer / Feedback */}
        {stage === 'answer' && (
          <div>
            <div className="form-group">
              <label className="form-label">Your Answer</label>
              <textarea
                className="form-textarea"
                placeholder="Type your answer here. Be as detailed and specific as possible…"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={8}
                style={{ fontSize: '0.92rem' }}
              />
              <p className="form-hint">
                {answer.length > 0
                  ? `${answer.length} characters`
                  : 'Aim for 2–5 minutes of speech in written form for behavioral questions.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn--primary btn--lg"
                onClick={handleSubmitAnswer}
                disabled={!answer.trim()}
                style={{ flex: 1 }}
              >
                Submit for Evaluation
              </button>

              {currentIndex + 1 < allQuestions.length && (
                <button
                  className="btn btn--ghost"
                  onClick={handleNextQuestion}
                  title="Skip this question"
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        )}

        {stage === 'evaluating' && (
          <div className="loading-state">
            <div className="spinner" />
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Evaluating your answer with IBM watsonx.ai…
            </p>
          </div>
        )}

        {stage === 'feedback' && evaluation && (
          <div>
            <EvaluationResult evaluation={evaluation} question={currentQuestion.question} />

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn--primary"
                onClick={handleNextQuestion}
                style={{ flex: 1 }}
              >
                {currentIndex + 1 >= allQuestions.length ? 'Finish Practice' : 'Next Question'}
              </button>
              <button className="btn btn--ghost" onClick={handleRepeatQuestion}>
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
