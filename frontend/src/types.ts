// PERITIA — TypeScript Type Definitions

export type ExperienceLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'lead';
export type InterviewType = 'technical' | 'behavioral' | 'hr' | 'role_specific';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface UserProfile {
  name: string;
  target_role: string;
  experience_level: ExperienceLevel;
  skills: string[];
  resume_text?: string;
  job_description?: string;
}

export interface ProfileAnalysis {
  extracted_skills: string[];
  education: string[];
  experience_summary: string;
  projects: string[];
  technologies: string[];
  role_alignment_score: number;
  key_gaps: string[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: InterviewType;
  difficulty: Difficulty;
  topic: string;
  model_answer?: string;
  preparation_tips?: string[];
}

export interface InterviewPreparation {
  session_id: string;
  profile: UserProfile;
  analysis: ProfileAnalysis;
  technical_questions: InterviewQuestion[];
  behavioral_questions: InterviewQuestion[];
  hr_questions: InterviewQuestion[];
  role_specific_questions: InterviewQuestion[];
  preparation_tips: string[];
  total_questions: number;
}

export interface AnswerEvaluationRequest {
  session_id: string;
  question_id: string;
  question: string;
  question_type: InterviewType;
  user_answer: string;
  expected_context?: string;
}

export interface AnswerEvaluation {
  question_id: string;
  overall_score: number;
  overall_assessment: string;
  strengths: string[];
  areas_for_improvement: string[];
  missing_points: string[];
  suggested_response: string;
  concise_advice: string;
  passed: boolean;
}

export interface SessionProgress {
  session_id: string;
  user_name: string;
  target_role: string;
  experience_level: string;
  questions_attempted: number;
  questions_passed: number;
  technical_score: number;
  behavioral_score: number;
  hr_score: number;
  overall_score: number;
  evaluations: EvaluationRecord[];
}

export interface EvaluationRecord {
  question_id: string;
  score: number;
  passed: boolean;
  type: string;
  timestamp: string;
}

export interface HealthStatus {
  status: string;
  watsonx_configured: boolean;
  rag_ready: boolean;
  model_id: string;
  version: string;
}

export interface PrepareFormData {
  name: string;
  target_role: string;
  experience_level: ExperienceLevel;
  skills: string[];
  resume_text: string;
  job_description: string;
  resume_file?: File | null;
}
