// PERITIA — Axios API Client

import axios from 'axios';
import type {
  InterviewPreparation,
  AnswerEvaluationRequest,
  AnswerEvaluation,
  SessionProgress,
  HealthStatus,
  PrepareFormData,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 minutes for model generation
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor: normalize error messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail;
    const status = err.response?.status;
    let message = 'An unexpected error occurred.';

    if (detail) {
      message = typeof detail === 'string' ? detail : JSON.stringify(detail);
    } else if (err.code === 'ECONNABORTED') {
      message = 'Request timed out. The model may be taking longer than expected.';
    } else if (!err.response) {
      message = 'Cannot connect to the PERITIA backend. Ensure the server is running on port 8000.';
    } else if (status === 503) {
      message = detail || 'IBM watsonx.ai is not available. Check your configuration.';
    } else if (status === 500) {
      message = detail || 'Internal server error. Check the backend logs.';
    }

    return Promise.reject(new Error(message));
  }
);

export async function checkHealth(): Promise<HealthStatus> {
  const res = await api.get<HealthStatus>('/health');
  return res.data;
}

export async function prepareInterview(
  formData: PrepareFormData
): Promise<InterviewPreparation> {
  if (formData.resume_file) {
    // Use multipart form for file upload
    const fd = new FormData();
    fd.append('name', formData.name);
    fd.append('target_role', formData.target_role);
    fd.append('experience_level', formData.experience_level);
    fd.append('skills', JSON.stringify(formData.skills));
    fd.append('job_description', formData.job_description || '');
    fd.append('resume_file', formData.resume_file);

    const res = await axios.post<InterviewPreparation>(
      '/api/interview/prepare-with-resume',
      fd,
      { timeout: 120000 }
    );
    return res.data;
  }

  // JSON endpoint
  const res = await api.post<InterviewPreparation>('/interview/prepare', {
    name: formData.name,
    target_role: formData.target_role,
    experience_level: formData.experience_level,
    skills: formData.skills,
    resume_text: formData.resume_text || null,
    job_description: formData.job_description || null,
  });
  return res.data;
}

export async function evaluateAnswer(
  req: AnswerEvaluationRequest
): Promise<AnswerEvaluation> {
  const res = await api.post<AnswerEvaluation>('/interview/evaluate', req);
  return res.data;
}

export async function getSessionProgress(
  sessionId: string
): Promise<SessionProgress> {
  const res = await api.get<SessionProgress>(`/interview/session/${sessionId}`);
  return res.data;
}
