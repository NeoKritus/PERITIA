"""
PERITIA - Pydantic data models for request/response contracts
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from enum import Enum


class ExperienceLevel(str, Enum):
    ENTRY = "entry"
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"


class InterviewType(str, Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    HR = "hr"
    ROLE_SPECIFIC = "role_specific"


class UserProfile(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    name: str = Field(..., min_length=1, max_length=100)
    target_role: str = Field(..., min_length=1, max_length=100)
    experience_level: ExperienceLevel
    skills: List[str] = Field(default_factory=list)
    resume_text: Optional[str] = None
    job_description: Optional[str] = None


class ProfileAnalysis(BaseModel):
    extracted_skills: List[str] = Field(default_factory=list)
    education: List[str] = Field(default_factory=list)
    experience_summary: str = ""
    projects: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    role_alignment_score: float = 0.0
    key_gaps: List[str] = Field(default_factory=list)


class InterviewQuestion(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    id: str
    question: str
    type: InterviewType
    difficulty: str  # easy | medium | hard
    topic: str
    model_answer: Optional[str] = None
    preparation_tips: Optional[List[str]] = None


class InterviewPreparation(BaseModel):
    session_id: str
    profile: UserProfile
    analysis: ProfileAnalysis
    technical_questions: List[InterviewQuestion] = Field(default_factory=list)
    behavioral_questions: List[InterviewQuestion] = Field(default_factory=list)
    hr_questions: List[InterviewQuestion] = Field(default_factory=list)
    role_specific_questions: List[InterviewQuestion] = Field(default_factory=list)
    preparation_tips: List[str] = Field(default_factory=list)
    total_questions: int = 0


class AnswerEvaluationRequest(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    session_id: str
    question_id: str
    question: str
    question_type: InterviewType
    user_answer: str
    expected_context: Optional[str] = None


class AnswerEvaluation(BaseModel):
    question_id: str
    overall_score: float = Field(..., ge=0, le=10)
    overall_assessment: str
    strengths: List[str] = Field(default_factory=list)
    areas_for_improvement: List[str] = Field(default_factory=list)
    missing_points: List[str] = Field(default_factory=list)
    suggested_response: str = ""
    concise_advice: str = ""
    passed: bool = False


class SessionProgress(BaseModel):
    session_id: str
    user_name: str
    target_role: str
    experience_level: str
    questions_attempted: int = 0
    questions_passed: int = 0
    technical_score: float = 0.0
    behavioral_score: float = 0.0
    hr_score: float = 0.0
    overall_score: float = 0.0
    evaluations: List[Dict[str, Any]] = Field(default_factory=list)


class PrepareRequest(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    name: str
    target_role: str
    experience_level: ExperienceLevel
    skills: List[str] = Field(default_factory=list)
    resume_text: Optional[str] = None
    job_description: Optional[str] = None
