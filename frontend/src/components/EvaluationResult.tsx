// PERITIA — Evaluation Result Display Component
import type { AnswerEvaluation } from '../types';

interface Props {
  evaluation: AnswerEvaluation;
  question: string;
}

function ScoreColor(score: number) {
  if (score >= 7) return 'var(--green)';
  if (score >= 5) return 'var(--yellow)';
  return 'var(--red)';
}

export default function EvaluationResult({ evaluation, question }: Props) {
  const isPass = evaluation.passed;
  const scoreColor = ScoreColor(evaluation.overall_score);

  return (
    <div className="eval-result">
      <div className="eval-result__header">
        <div
          className={`eval-result__score-ring eval-result__score-ring--${isPass ? 'pass' : 'fail'}`}
          style={{ borderColor: scoreColor }}
        >
          <span className="eval-result__score-number" style={{ color: scoreColor }}>
            {evaluation.overall_score.toFixed(1)}
          </span>
          <span className="eval-result__score-label">/10</span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span
              className={`tag ${isPass ? 'tag--green' : 'tag--red'}`}
              style={{ fontSize: '0.75rem', fontWeight: 600 }}
            >
              {isPass ? 'PASSED' : 'NEEDS IMPROVEMENT'}
            </span>
          </div>
          <p className="eval-result__assessment">{evaluation.overall_assessment}</p>
        </div>
      </div>

      <div className="eval-result__body">
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div className="answer-label" style={{ marginBottom: '0.35rem' }}>Question</div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{question}</p>
        </div>

        <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
          {evaluation.strengths.length > 0 && (
            <div className="eval-section">
              <div className="eval-section__title" style={{ color: '#7ab98a' }}>Strengths</div>
              <ul className="eval-list eval-list--strengths">
                {evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {evaluation.areas_for_improvement.length > 0 && (
            <div className="eval-section">
              <div className="eval-section__title" style={{ color: '#c4ad60' }}>Areas for Improvement</div>
              <ul className="eval-list eval-list--improvements">
                {evaluation.areas_for_improvement.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </div>

        {evaluation.missing_points.length > 0 && (
          <div className="eval-section">
            <div className="eval-section__title" style={{ color: '#c47070' }}>Missing Points</div>
            <ul className="eval-list eval-list--missing">
              {evaluation.missing_points.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        )}

        {evaluation.concise_advice && (
          <div className="eval-section">
            <div className="eval-section__title">Concise Advice</div>
            <div className="concise-advice">{evaluation.concise_advice}</div>
          </div>
        )}

        {evaluation.suggested_response && (
          <div className="eval-section">
            <div className="eval-section__title">Suggested Response</div>
            <div className="suggested-response">{evaluation.suggested_response}</div>
          </div>
        )}
      </div>
    </div>
  );
}
