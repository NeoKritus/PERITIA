// PERITIA — Question Card with expandable model answer
import { useState } from 'react';
import type { InterviewQuestion } from '../types';

interface Props {
  question: InterviewQuestion;
  index: number;
  onPractice?: (q: InterviewQuestion) => void;
}

const TYPE_LABELS: Record<string, string> = {
  technical: 'Technical',
  behavioral: 'Behavioral',
  hr: 'HR',
  role_specific: 'Role-Specific',
};

export default function QuestionCard({ question, index, onPractice }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="question-card">
      <div
        className="question-card__header"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div style={{ flex: 1 }}>
          <div className="question-card__meta">
            <span className={`type-badge type-badge--${question.type}`}>
              {TYPE_LABELS[question.type] ?? question.type}
            </span>
            <span className={`difficulty difficulty--${question.difficulty}`}>
              {question.difficulty.toUpperCase()}
            </span>
            <span className="tag" style={{ fontSize: '0.75rem' }}>
              {question.topic}
            </span>
          </div>
          <p className="question-card__question">
            <span style={{ color: 'var(--text-muted)', marginRight: '0.4rem' }}>
              {String(index + 1).padStart(2, '0')}.
            </span>
            {question.question}
          </p>
        </div>

        <svg
          className={`question-card__toggle${expanded ? ' question-card__toggle--open' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {expanded && (
        <div className="question-card__body">
          {question.model_answer && (
            <div className="answer-section">
              <div className="answer-label">Model Answer</div>
              <p className="answer-text">{question.model_answer}</p>
            </div>
          )}

          {question.preparation_tips && question.preparation_tips.length > 0 && (
            <div className="answer-section">
              <div className="answer-label">Preparation Tips</div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {question.preparation_tips.map((tip, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {onPractice && (
            <button
              className="btn btn--secondary btn--sm"
              onClick={(e) => { e.stopPropagation(); onPractice(question); }}
            >
              Practice This Question
            </button>
          )}
        </div>
      )}
    </div>
  );
}
